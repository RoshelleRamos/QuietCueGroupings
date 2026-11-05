import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'parent' | 'family' | 'child';
export type Registration = { fullName: string; email: string; password: string };
export type User = { id: string; email: string; user_metadata: { full_name: string; role: Role } };
type Session = { access_token: string; user: User };
type ApiError = { message: string; code?: string };
// Results vary by table, matching the existing screen query interface.
type Result = { data: any; error: ApiError | null };
type Listener = (event: string, session: Session | null) => void;
const key = '@quietcue_postgres_session_v1';
const listeners = new Set<Listener>();
let session: Session | null = null;
let loaded: Promise<void> | undefined;
let revision = 0;
const ready = () => loaded ??= AsyncStorage.getItem(key).then(raw => {
  try { session = raw ? JSON.parse(raw) : null; } catch { session = null; }
});
async function save(next: Session | null, event: string) {
  await AsyncStorage.setItem(key, JSON.stringify(next));
  session = next;
  revision++;
  listeners.forEach(listener => listener(event, session));
}
async function request(path: string, body?: unknown): Promise<Result> {
  try {
    await ready();
    const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (!base) throw new Error('QuietCue backend is not configured. Set EXPO_PUBLIC_API_URL and restart Expo.');
    const current = session;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${base}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(current ? { Authorization: `Bearer ${current.access_token}` } : {}) },
        body: JSON.stringify(body ?? {}), signal: controller.signal,
      });
      const result = await response.json();
      if (response.status === 401 && current && session === current) await save(null, 'SIGNED_OUT');
      return response.ok ? { data: result.data, error: null } : { data: null, error: result.error ?? { message: 'The server could not complete the request.' } };
    } finally { clearTimeout(timer); }
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Could not connect to QuietCue.' } };
  }
}
type Filter = { column: string; op: string; value: unknown };
class Query implements PromiseLike<Result> {
  private query: { table: string; action: string; columns: string; filters: Filter[]; values?: unknown; order?: { column: string; ascending: boolean }; limit?: number; cardinality?: string };
  constructor(table: string) { this.query = { table, action: 'select', columns: '*', filters: [] }; }
  select(columns = '*') { this.query.columns = columns; return this; }
  insert(values: unknown) { this.query.action = 'insert'; this.query.values = values; return this; }
  update(values: unknown) { this.query.action = 'update'; this.query.values = values; return this; }
  delete() { this.query.action = 'delete'; return this; }
  eq(column: string, value: unknown) { this.query.filters.push({ column, op: 'eq', value }); return this; }
  gte(column: string, value: unknown) { this.query.filters.push({ column, op: 'gte', value }); return this; }
  in(column: string, value: unknown[]) { this.query.filters.push({ column, op: 'in', value }); return this; }
  is(column: string, value: null) { this.query.filters.push({ column, op: 'is', value }); return this; }
  order(column: string, options: { ascending: boolean }) { this.query.order = { column, ...options }; return this; }
  limit(limit: number) { this.query.limit = limit; return this; }
  single() { this.query.cardinality = 'single'; return this; }
  maybeSingle() { this.query.cardinality = 'maybeSingle'; return this; }
  then<T = Result, U = never>(fulfilled?: ((value: Result) => T | PromiseLike<T>) | null, rejected?: ((reason: unknown) => U | PromiseLike<U>) | null): PromiseLike<T | U> {
    return request('/query', this.query).then(fulfilled, rejected);
  }
}
export const backend = {
  from: (table: string) => new Query(table),
  rpc: (name: string, args: Record<string, unknown> = {}) => request('/rpc', { name, args }),
  auth: {
    onAuthStateChange(listener: Listener) {
      listeners.add(listener);
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
    },
    async getSession() {
      await ready();
      const currentRevision = revision;
      if (session) {
        const result = await request('/auth/me');
        if (result.error) return { data: { session: null }, error: result.error };
        if (session && currentRevision === revision) session = { ...session, user: result.data.user };
      }
      return { data: { session }, error: null };
    },
    async getUser() { const result = await this.getSession(); return { data: { user: result.data.session?.user ?? null }, error: result.error }; },
    async signInWithPassword(details: { email: string; password: string }) {
      const result = await request('/auth/login', details);
      if (!result.error) await save(result.data.session, 'SIGNED_IN');
      return { data: { user: result.data?.session.user ?? null, session: result.data?.session ?? null }, error: result.error };
    },
    async signUp(details: { email: string; password: string; options: { data: { full_name: string; role: Role } } }) {
      const result = await request('/auth/register', { email: details.email, password: details.password, ...details.options.data });
      if (!result.error) await save(result.data.session, 'SIGNED_IN');
      return { data: { session: result.data?.session ?? null }, error: result.error };
    },
    async signOut() {
      const result = await request('/auth/logout');
      if (result.error && session) return { error: result.error };
      await save(null, 'SIGNED_OUT');
      return { error: null };
    },
  },
};
