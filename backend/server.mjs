import http from 'node:http';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';
import { pathToFileURL } from 'node:url';
import { compileQuery, compileRpc } from './query.mjs';

const derive = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
const publicUser = row => ({ id: row.id, email: row.email, user_metadata: row.raw_user_meta_data });
const failure = (message, status = 400) => Object.assign(new Error(message), { status });
const attempts = new Map();
const rateWindow = setInterval(() => { const now = Date.now(); for (const [key, value] of attempts) if (value.until < now) attempts.delete(key); }, 60000);
rateWindow.unref();
function rateLimit(key, limit) {
  let value = attempts.get(key);
  if (!value || value.until < Date.now()) { value = { count: 0, until: Date.now() + 600000 }; attempts.set(key, value); }
  if (++value.count > limit) throw failure('Too many attempts. Please try again later.', 429);
}
async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 16384) throw failure('Request is too large.', 413);
  }
  try { const body = JSON.parse(raw || '{}'); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(); return body; }
  catch { throw failure('Invalid JSON.'); }
}
async function issueSession(client, user) {
  const token = randomBytes(32).toString('base64url');
  await client.query('DELETE FROM qc_auth.sessions WHERE expires_at < now()');
  await client.query("INSERT INTO qc_auth.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 days')", [hash(token), user.id]);
  return { session: { access_token: token, user: publicUser(user) } };
}
async function route(client, path, body, req) {
  if (path === '/auth/register' || path === '/auth/login') {
    // Use the socket address by default. A trusted reverse proxy can rate-limit separately.
    rateLimit(`ip:${req.socket.remoteAddress}`, 100);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 256) throw failure('Enter a valid email and a password of 8–256 characters.');
    rateLimit(`email:${email}`, 20);
    if (path === '/auth/register') {
      const name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
      if (!['parent', 'child', 'family'].includes(body.role) || !name || name.length > 120) throw failure('Choose a role and enter your name (up to 120 characters).');
      const salt = randomBytes(16).toString('hex');
      const derived = await derive(password, salt, 64);
      const result = await client.query('INSERT INTO qc_auth.users(email,password_hash,raw_user_meta_data) VALUES($1,$2,$3) RETURNING id,email,raw_user_meta_data', [email, `${salt}:${derived.toString('hex')}`, { full_name: name, role: body.role }]);
      return issueSession(client, result.rows[0]);
    }
    const result = await client.query('SELECT * FROM qc_auth.users WHERE email=$1', [email]);
    const user = result.rows[0];
    // Do the expensive work even for unknown email addresses.
    const [salt, expected] = (user?.password_hash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
    const actual = await derive(password, salt, 64);
    if (!user || !timingSafeEqual(actual, Buffer.from(expected, 'hex'))) throw failure('Email or password is incorrect.', 400);
    return issueSession(client, user);
  }
  const token = req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if (!token) throw failure('Please log in again.', 401);
  const tokenHash = hash(token);
  const result = await client.query('SELECT u.id,u.email,u.raw_user_meta_data FROM qc_auth.sessions s JOIN qc_auth.users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()', [tokenHash]);
  const user = result.rows[0];
  if (!user) throw failure('Your session expired. Please log in again.', 401);
  if (path === '/auth/me') return { user: publicUser(user) };
  if (path === '/auth/logout') { await client.query('DELETE FROM qc_auth.sessions WHERE token_hash=$1', [tokenHash]); return null; }
  if (path !== '/query' && path !== '/rpc') throw failure('Not found.', 404);
  await client.query("SELECT set_config('quietcue.user_id',$1,true)", [user.id]);
  // Every data request runs without owner privileges, so row policies apply.
  await client.query('SET LOCAL ROLE qc_member');
  if (path === '/rpc') {
    const query = compileRpc(body.name, body.args);
    return (await client.query(query)).rows[0].result;
  }
  const query = compileQuery(body);
  const rows = (await client.query(query)).rows;
  if (body.cardinality === 'single' || body.cardinality === 'maybeSingle') {
    if (rows.length > 1 || (body.cardinality === 'single' && rows.length !== 1)) throw failure('The requested record was not found or changed. Refresh and try again.');
    return rows[0] ?? null;
  }
  return rows;
}
export function createServer(pool) {
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const origin = req.headers.origin;
  const origins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
  if (origin && origins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  }
  const send = (status, body) => { res.writeHead(status); res.end(JSON.stringify(body)); };
  let client;
  try {
    if (origin && !origins.includes(origin)) throw failure('This web origin is not allowed.', 403);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method === 'GET' && req.url === '/health') { await pool.query('SELECT 1 FROM qc_auth.users LIMIT 1'); send(200, { data: { status: 'ok' } }); return; }
    if (req.method !== 'POST') throw failure('Not found.', 404);
    const body = await readBody(req);
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query("SET LOCAL statement_timeout = '10s'");
    const data = await route(client, req.url, body, req);
    await client.query('COMMIT');
    send(200, { data });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    const known = error.status || error.code?.startsWith('23') || ['42501', 'P0001'].includes(error.code);
    const message = error.code === '23505' ? 'This account or connection already exists.' : error.code === '42501' ? 'You do not have permission to change this record.' : known ? error.message : 'Could not complete the request. Please try again.';
    if (!known) console.error('Backend failure:', error.code || error.name);
    send(error.status ?? (known ? 400 : 500), { error: { message, code: error.code } });
  } finally { client?.release(); }
});
server.requestTimeout = 30000;
server.headersTimeout = 15000;
return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required on the backend.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 10000 });
pool.on('error', error => console.error('Database connection failure:', error.code || error.name));
const server = createServer(pool);
server.listen(Number(process.env.PORT || 3001), '0.0.0.0', () => console.log('QuietCue PostgreSQL backend is ready.'));
async function shutdown() { server.close(async () => { await pool.end(); process.exit(0); }); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
}
