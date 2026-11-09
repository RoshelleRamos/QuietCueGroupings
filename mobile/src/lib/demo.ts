import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FamilyRequest, Profile } from './family';
import { startOfLocalDay, type FocusSession, type ParentNotification, type ParentSnapshot, type Task } from './parent-model';

export type Role = 'parent' | 'family' | 'child';
export type Registration = { fullName: string; email: string };
export type User = { id: string; email: string; user_metadata: { full_name: string; role: Role } };
type Account = { user: User; profile: Profile; familyCode: string };
type DemoData = {
  currentId: string | null;
  nextId: number;
  accounts: Account[];
  links: Record<string, string>;
  requests: FamilyRequest[];
  tasks: Task[];
  sessions: FocusSession[];
  notifications: ParentNotification[];
};

const storageKey = '@quietcue_demo_v1';
const listeners = new Set<(user: User | null) => void>();
let pending = Promise.resolve();
const now = () => new Date().toISOString();
const id = (data: DemoData) => String(data.nextId++);

function account(accountId: string, email: string, fullName: string, role: Role): Account {
  return {
    user: { id: accountId, email, user_metadata: { full_name: fullName, role } },
    profile: { id: accountId, full_name: fullName, role, focus_status: 'available', available_at: null },
    familyCode: 'DEMO' + accountId.padStart(8, '0'),
  };
}

function initialData(): DemoData {
  return {
    currentId: null,
    nextId: 3,
    accounts: [
      account('1', 'parent@example.com', 'Demo Parent', 'parent'),
      account('2', 'child@example.com', 'Demo Child', 'child'),
    ],
    links: {}, requests: [], tasks: [], sessions: [], notifications: [],
  };
}

async function read(): Promise<DemoData> {
  await pending;
  return readStorage();
}

async function readStorage(): Promise<DemoData> {
  const saved = await AsyncStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : initialData();
}

function change<T>(update: (data: DemoData) => T): Promise<T> {
  const result = pending.then(async () => {
    const data = await readStorage();
    const value = update(data);
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
    return value;
  });
  pending = result.then(() => {}, () => {});
  return result;
}

function currentAccount(data: DemoData) {
  return data.accounts.find(({ user }) => user.id === data.currentId);
}

function requireAccount(data: DemoData, userId: string, parent: boolean) {
  const current = currentAccount(data);
  if (!current || current.user.id !== userId || (current.user.user_metadata.role === 'parent') !== parent) {
    throw new Error('Switch to the matching demo profile.');
  }
  return current;
}

function findTask(data: DemoData, userId: string, taskId: string) {
  const task = data.tasks.find(row => row.user_id === userId && row.id === taskId);
  if (!task) throw new Error('This task is no longer available.');
  return task;
}

function notify(data: DemoData, recipient: string, kind: ParentNotification['kind'], title: string, body: string, requestId: string | null = null) {
  data.notifications.unshift({ id: id(data), recipient_id: recipient, kind, title, body, request_id: requestId, created_at: now(), read_at: null });
}

export const demo = {
  subscribe(listener: (user: User | null) => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  async currentUser() {
    return currentAccount(await read())?.user ?? null;
  },
  async signIn(email: string) {
    const user = await change(data => {
      const existing = data.accounts.find(row => row.user.email === email);
      if (!existing) throw new Error('Enter a demo email or create a local demo profile.');
      data.currentId = existing.user.id;
      return existing.user;
    });
    listeners.forEach(listener => listener(user));
  },
  async signUp({ email, fullName }: Registration, role: Role) {
    const user = await change(data => {
      if (data.accounts.some(row => row.user.email === email)) throw new Error('This demo profile already exists.');
      const created = account(id(data), email, fullName, role);
      data.accounts.push(created);
      data.currentId = created.user.id;
      return created.user;
    });
    listeners.forEach(listener => listener(user));
  },
  async signOut() {
    await change(data => { data.currentId = null; });
    listeners.forEach(listener => listener(null));
  },
  async loadParent(userId: string): Promise<ParentSnapshot> {
    const data = await read();
    const parent = requireAccount(data, userId, true);
    const today = startOfLocalDay(Date.now());
    return {
      ownerId: userId,
      profile: parent.profile,
      children: data.accounts.filter(row => data.links[row.user.id] === userId).map(row => row.profile),
      tasks: data.tasks.filter(row => row.user_id === userId),
      sessions: data.sessions.filter(row => row.user_id === userId && Date.parse(row.planned_end) >= today),
      requests: data.requests.filter(row => row.parent_id === userId).slice(0, 100),
      notifications: data.notifications.filter(row => row.recipient_id === userId).slice(0, 100),
      code: parent.familyCode,
    };
  },
  async loadChild(userId: string) {
    const data = await read();
    const child = requireAccount(data, userId, false);
    return {
      own: child.profile,
      parent: data.accounts.find(row => row.user.id === data.links[userId])?.profile ?? null,
      requests: data.requests.filter(row => row.child_id === userId).slice(0, 100),
    };
  },
  joinParent(userId: string, code: string) {
    return change(data => {
      const child = requireAccount(data, userId, false);
      const parent = data.accounts.find(row => row.profile.role === 'parent' && row.familyCode === code.trim().toUpperCase());
      if (!parent) throw new Error('Enter a family code from a parent profile on this device.');
      if (data.links[userId] === parent.user.id) return;
      if (data.links[userId]) throw new Error('This demo profile already has a connected parent.');
      data.links[userId] = parent.user.id;
      notify(data, parent.user.id, 'child_connected', 'Family member connected', `${child.profile.full_name} joined your family.`);
    });
  },
  sendRequest(userId: string, category: string, message: string, priority: FamilyRequest['priority']) {
    return change(data => {
      const child = requireAccount(data, userId, false);
      const parentId = data.links[userId];
      if (!parentId) throw new Error('Connect a demo parent first.');
      const requestId = id(data);
      data.requests.unshift({
        id: requestId, child_id: userId, parent_id: parentId, category, message, priority,
        status: 'pending', created_at: now(),
      });
      const urgent = priority === 'emergency';
      notify(data, parentId, urgent ? 'emergency' : 'request',
        urgent ? 'Urgent demo request' : 'New family request', `${child.profile.full_name}: ${message}`, requestId);
    });
  },
  answer(userId: string, requestId: string, status: 'acknowledged' | 'done') {
    return change(data => {
      requireAccount(data, userId, true);
      const request = data.requests.find(row => row.parent_id === userId && row.id === requestId);
      if (!request) throw new Error('This request is no longer available.');
      if (request.status !== 'done') request.status = status;
    });
  },
  markRead(userId: string, notificationId?: string) {
    return change(data => {
      requireAccount(data, userId, true);
      for (const note of data.notifications) {
        if (note.recipient_id === userId && (!notificationId || note.id === notificationId)) note.read_at ??= now();
      }
    });
  },
  saveTask(userId: string, title: string, taskId?: string) {
    return change(data => {
      requireAccount(data, userId, true);
      const clean = title.trim();
      if (!clean || clean.length > 120) throw new Error('Enter a task name between 1 and 120 characters.');
      if (taskId) {
        findTask(data, userId, taskId).title = clean;
      } else {
        data.tasks.unshift({ id: id(data), user_id: userId, title: clean, completed: false, completed_at: null, created_at: now() });
      }
    });
  },
  toggleTask(userId: string, taskId: string) {
    return change(data => {
      requireAccount(data, userId, true);
      const task = findTask(data, userId, taskId);
      task.completed = !task.completed;
      task.completed_at = task.completed ? now() : null;
    });
  },
  deleteTask(userId: string, taskId: string) {
    return change(data => {
      requireAccount(data, userId, true);
      data.tasks = data.tasks.filter(row => row.user_id !== userId || row.id !== taskId);
      for (const session of data.sessions) {
        if (session.user_id === userId && session.task_id === taskId) session.task_id = null;
      }
    });
  },
  startFocus(userId: string, minutes: number, taskId: string | null) {
    return change(data => {
      const { profile } = requireAccount(data, userId, true);
      if (![15, 25, 50].includes(minutes)) throw new Error('Choose a 15, 25, or 50 minute session.');
      if (taskId && findTask(data, userId, taskId).completed) throw new Error('Choose an unfinished task.');
      const startedAt = now();
      closeFocus(data, userId, startedAt);
      const end = new Date(Date.parse(startedAt) + minutes * 60_000).toISOString();
      data.sessions.unshift({ id: id(data), user_id: userId, task_id: taskId, started_at: startedAt, planned_end: end, ended_at: null });
      profile.focus_status = 'focusing';
      profile.available_at = end;
    });
  },
  endFocus(userId: string, status: 'available' | 'break') {
    return change(data => {
      const { profile } = requireAccount(data, userId, true);
      closeFocus(data, userId, now());
      profile.focus_status = status;
      profile.available_at = null;
    });
  },
};

function closeFocus(data: DemoData, userId: string, endedAt: string) {
  const session = data.sessions.find(row => row.user_id === userId && !row.ended_at);
  if (session) session.ended_at = session.planned_end < endedAt ? session.planned_end : endedAt;
}
