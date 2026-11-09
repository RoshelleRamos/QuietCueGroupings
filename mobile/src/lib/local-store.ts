import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBytesAsync, randomUUID } from 'expo-crypto';

import { attachmentKey, type AttachmentDraft } from './message-attachments';
import type { FamilyMessage, FamilyRequest, Profile } from './family';
import { activeSession, currentPause, localDate, type FocusSession, type ParentNotification, type ParentSnapshot, type Task } from './parent-model';

export type Role = 'parent' | 'family' | 'child';
export type Registration = { fullName: string; email: string; password: string };
export type User = { id: string; email: string; user_metadata: { full_name: string; role: Role } };
type Credentials = { salt: string; verifier: string };
type Account = { user: User; profile: Profile; familyCode: string; credentials?: Credentials };
type LocalData = {
  currentId: string | null;
  nextId: number;
  accounts: Account[];
  links: Record<string, string>;
  requests: FamilyRequest[];
  messages?: FamilyMessage[];
  tasks: Task[];
  sessions: FocusSession[];
  notifications: ParentNotification[];
};

const storageKey = '@quietcue_demo_v1';
const listeners = new Set<(user: User | null) => void>();
let pending = Promise.resolve();
const now = () => new Date().toISOString();
const id = (data: LocalData) => String(data.nextId++);

function account(accountId: string, email: string, fullName: string, role: Role): Account {
  return {
    user: { id: accountId, email, user_metadata: { full_name: fullName, role } },
    profile: { id: accountId, full_name: fullName, role, focus_status: 'available', available_at: null },
    familyCode: 'QC' + accountId.padStart(10, '0'),
  };
}

function initialData(): LocalData {
  return {
    currentId: null,
    nextId: 3,
    accounts: [],
    links: {}, requests: [], tasks: [], sessions: [], notifications: [],
  };
}

async function read(): Promise<LocalData> {
  await pending;
  return readStorage();
}

async function readStorage(): Promise<LocalData> {
  const saved = await AsyncStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : initialData();
}

function change<T>(update: (data: LocalData) => T | Promise<T>): Promise<T> {
  const result = pending.then(async () => {
    const data = await readStorage();
    const value = await update(data);
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
    return value;
  });
  pending = result.then(() => {}, () => {});
  return result;
}

function currentAccount(data: LocalData) {
  return data.accounts.find(({ user, credentials }) => user.id === data.currentId && credentials);
}

function requireAccount(data: LocalData, userId: string, parent: boolean) {
  const current = currentAccount(data);
  if (!current || current.user.id !== userId || (current.user.user_metadata.role === 'parent') !== parent) {
    throw new Error('Switch to the matching account.');
  }
  return current;
}

function findTask(data: LocalData, userId: string, taskId: string) {
  const task = data.tasks.find(row => row.user_id === userId && row.id === taskId);
  if (!task) throw new Error('This task is no longer available.');
  return task;
}

function notify(data: LocalData, recipient: string, kind: ParentNotification['kind'], title: string, body: string, requestId: string | null = null, childId?: string) {
  data.notifications.unshift({ id: id(data), recipient_id: recipient, kind, title, body, request_id: requestId, child_id: childId, created_at: now(), read_at: null });
}

async function passwordVerifier(password: string, salt: Uint8Array) {
  return bytesToHex(await pbkdf2Async(sha256, password, salt, { c: 600_000, dkLen: 32 }));
}

export const localStore = {
  subscribe(listener: (user: User | null) => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  async currentUser() {
    return currentAccount(await read())?.user ?? null;
  },
  async signIn(email: string, password: string) {
    const user = await change(async data => {
      const existing = data.accounts.find(row => row.user.email === email);
      if (existing && !existing.credentials) {
        throw new Error('Use Create Account with the same email and role to set a password for your existing profile.');
      }
      if (!existing?.credentials || await passwordVerifier(password, hexToBytes(existing.credentials.salt)) !== existing.credentials.verifier) {
        throw new Error('The email or password is incorrect.');
      }
      data.currentId = existing.user.id;
      return existing.user;
    });
    listeners.forEach(listener => listener(user));
  },
  async signUp({ email, fullName, password }: Registration, role: Role) {
    if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
    const user = await change(async data => {
      const existing = data.accounts.find(row => row.user.email === email);
      if (existing?.credentials) throw new Error('An account with this email already exists on this device.');
      if (existing && existing.user.user_metadata.role !== role) {
        throw new Error('Choose the same role as your existing profile.');
      }
      const salt = await getRandomBytesAsync(16);
      const credentials = { salt: bytesToHex(salt), verifier: await passwordVerifier(password, salt) };
      // Reuse the old profile ID so its tasks, requests and family link survive.
      const created = existing ?? account(id(data), email, fullName, role);
      created.credentials = credentials;
      created.profile.full_name = fullName;
      created.user.user_metadata.full_name = fullName;
      if (!existing) data.accounts.push(created);
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
    return {
      ownerId: userId,
      profile: parent.profile,
      children: data.accounts.filter(row => data.links[row.user.id] === userId).map(row => row.profile),
      messages: (data.messages ?? []).filter(row => row.parent_id === userId),
      tasks: data.tasks.filter(row => row.user_id === userId),
      sessions: data.sessions.filter(row => row.user_id === userId),
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
      messages: (data.messages ?? []).filter(row => row.child_id === userId && row.parent_id === data.links[userId]),
      parent: data.accounts.find(row => row.user.id === data.links[userId])?.profile ?? null,
      requests: data.requests.filter(row => row.child_id === userId).slice(0, 100),
    };
  },
  joinParent(userId: string, code: string) {
    return change(data => {
      const child = requireAccount(data, userId, false);
      const parent = data.accounts.find(row => row.profile.role === 'parent' && row.familyCode === code.trim().toUpperCase());
      if (!parent) throw new Error('Enter a family code from a parent account on this device.');
      if (data.links[userId] === parent.user.id) return;
      if (data.links[userId]) throw new Error('This account already has a connected parent.');
      data.links[userId] = parent.user.id;
      notify(data, parent.user.id, 'child_connected', 'Family member connected', `${child.profile.full_name} joined your family.`, null, userId);
    });
  },
  sendRequest(userId: string, category: string, message: string, priority: FamilyRequest['priority']) {
    return change(data => {
      const child = requireAccount(data, userId, false);
      const parentId = data.links[userId];
      if (!parentId) throw new Error('Connect a parent account first.');
      const requestId = id(data);
      data.requests.unshift({
        id: requestId, child_id: userId, parent_id: parentId, category, message, priority,
        status: 'pending', created_at: now(),
      });
      const urgent = priority === 'emergency';
      notify(data, parentId, urgent ? 'emergency' : 'request',
        urgent ? 'Urgent family request' : 'New family request', `${child.profile.full_name}: ${message}`, requestId, userId);
    });
  },
  async sendMessage(userId: string, childId: string, body: string, sender: FamilyMessage['sender'], draft?: AttachmentDraft) {
    const attachment = draft && { id: randomUUID(), name: draft.name, mime: draft.mime };
    let saved = false;
    try {
      await change(async data => {
        const fromParent = sender === 'parent';
        const from = requireAccount(data, userId, fromParent);
        const parentId = data.links[childId];
        if (!parentId || (fromParent ? parentId !== userId : childId !== userId)) {
          throw new Error('Choose a connected family member.');
        }
        const message = body.trim();
        if ((!message && !attachment) || message.length > 500) throw new Error('Enter a message or add an attachment.');
        if (attachment && draft) {
          await AsyncStorage.setItem(attachmentKey(attachment.id), draft.base64);
          saved = true;
        }
        (data.messages ??= []).push({ id: id(data), parent_id: parentId, child_id: childId, sender, body: message, attachment, created_at: now() });
        if (!fromParent) {
          notify(data, parentId, 'message', 'New message', `${from.profile.full_name}: ${message || attachment?.name}`, null, childId);
        }
      });
    } catch (error) {
      if (saved && attachment) await AsyncStorage.removeItem(attachmentKey(attachment.id)).catch(() => {});
      throw error;
    }
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
  saveTask(userId: string, title: string, taskId?: string, dueDate?: string | null) {
    return change(data => {
      requireAccount(data, userId, true);
      const clean = title.trim();
      if (!clean || clean.length > 120) throw new Error('Enter a task name between 1 and 120 characters.');
      if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || localDate(Date.parse(dueDate + 'T12:00:00')) !== dueDate)) {
        throw new Error('Enter a valid due date in YYYY-MM-DD format.');
      }
      if (taskId) {
        const task = findTask(data, userId, taskId);
        task.title = clean;
        if (dueDate !== undefined) task.due_date = dueDate;
      } else {
        data.tasks.unshift({ id: id(data), user_id: userId, title: clean, due_date: dueDate, completed: false, completed_at: null, created_at: now() });
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
  setFocusPaused(userId: string, paused: boolean) {
    return change(data => {
      const { profile } = requireAccount(data, userId, true);
      const at = now();
      const session = activeSession(data.sessions.filter(row => row.user_id === userId), Date.parse(at));
      if (!session) throw new Error('There is no current focus session.');
      const pause = currentPause(session);
      if (paused && !pause) {
        (session.pauses ??= []).push({ started_at: at, ended_at: null });
        profile.focus_status = 'break';
        profile.available_at = null;
      } else if (!paused && pause) {
        pause.ended_at = at;
        session.planned_end = new Date(Date.parse(session.planned_end) + Date.parse(at) - Date.parse(pause.started_at)).toISOString();
        profile.focus_status = 'focusing';
        profile.available_at = session.planned_end;
      }
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

function closeFocus(data: LocalData, userId: string, endedAt: string) {
  const session = data.sessions.find(row => row.user_id === userId && !row.ended_at);
  if (!session) return;
  const pause = currentPause(session);
  if (pause) pause.ended_at = endedAt;
  session.ended_at = pause || endedAt < session.planned_end ? endedAt : session.planned_end;
}
