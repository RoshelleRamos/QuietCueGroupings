import type { FamilyMessage, FamilyRequest, Profile } from './family';

export type Task = {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  due_date?: string | null;
};

export type FocusPause = { started_at: string; ended_at: string | null };
export type FocusSession = {
  id: string;
  user_id: string;
  task_id: string | null;
  started_at: string;
  planned_end: string;
  ended_at: string | null;
  pauses?: FocusPause[];
};

export type ParentNotification = {
  id: string;
  recipient_id: string;
  kind: 'child_connected' | 'request' | 'emergency' | 'message';
  title: string;
  body: string;
  request_id: string | null;
  child_id?: string;
  read_at: string | null;
  created_at: string;
};

export type ParentSnapshot = {
  ownerId: string;
  profile: Profile | null;
  children: Profile[];
  requests: FamilyRequest[];
  messages: FamilyMessage[];
  tasks: Task[];
  sessions: FocusSession[];
  notifications: ParentNotification[];
  code: string;
};

export function emptyParent(ownerId = ''): ParentSnapshot {
  return { ownerId, profile: null, children: [], requests: [], messages: [], tasks: [], sessions: [], notifications: [], code: '' };
}

export function forAccount(snapshot: ParentSnapshot, userId: string | null): ParentSnapshot {
  return userId && snapshot.ownerId === userId ? snapshot : emptyParent(userId ?? '');
}

export function currentPause(session: FocusSession | null) {
  return session?.pauses?.find(pause => !pause.ended_at) ?? null;
}

export function activeSession(sessions: FocusSession[], now: number) {
  return sessions.find(session => !session.ended_at && (currentPause(session) || Date.parse(session.planned_end) > now)) ?? null;
}

export function focusSeconds(sessions: FocusSession[], now: number, earliest = -Infinity) {
  const milliseconds = sessions.reduce((sum, session) => {
    const start = Math.max(earliest, Date.parse(session.started_at));
    const end = Math.min(now, Date.parse(session.ended_at ?? session.planned_end));
    const paused = (session.pauses ?? []).reduce((total, pause) => {
      const pauseStart = Math.max(start, Date.parse(pause.started_at));
      const pauseEnd = pause.ended_at ? Math.min(end, Date.parse(pause.ended_at)) : end;
      return total + Math.max(0, pauseEnd - pauseStart);
    }, 0);
    return sum + Math.max(0, end - start - paused);
  }, 0);
  return Math.floor(milliseconds / 1000);
}

export function remainingSeconds(session: FocusSession, now: number) {
  const pause = currentPause(session);
  return Math.max(0, Math.ceil((Date.parse(session.planned_end) - (pause ? Date.parse(pause.started_at) : now)) / 1000));
}

export function clockTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const short = `${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  return minutes >= 60 ? `${Math.floor(minutes / 60)}:${short}` : short;
}

export function startOfLocalDay(now: number) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function localDate(now: number) {
  const date = new Date(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
