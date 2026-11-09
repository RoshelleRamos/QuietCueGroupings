import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';

import { localStore, type User } from '../lib/local-store';
import type { AttachmentDraft } from '../lib/message-attachments';
import { errorMessage } from '../lib/family';
import { emptyParent, forAccount, type ParentSnapshot, type Task } from '../lib/parent-model';
import { showAlert } from '../lib/show-alert';

type ParentContext = ParentSnapshot & {
  user: User | null;
  loading: boolean;
  error: string;
  busy: boolean;
  refresh: () => Promise<void>;
  saveTask: (title: string, id?: string, dueDate?: string | null) => Promise<boolean>;
  toggleTask: (task: Task) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  startFocus: (minutes: number, taskId: string | null) => Promise<boolean>;
  setFocusPaused: (paused: boolean) => Promise<boolean>;
  sendMessage: (childId: string, body: string, attachment?: AttachmentDraft) => Promise<boolean>;
  endFocus: (status?: 'available' | 'break') => Promise<boolean>;
  answer: (id: string, status: 'acknowledged' | 'done') => Promise<boolean>;
  markRead: (id?: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const Context = createContext<ParentContext | null>(null);

export function ParentProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [snapshot, setSnapshot] = useState(emptyParent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const currentUser = useRef<User | null>(null);
  const operation = useRef(false);

  const refresh = useCallback(async () => {
    const account = currentUser.current;
    try {
      const next = account?.user_metadata.role === 'parent' ? await localStore.loadParent(account.id) : emptyParent();
      if (currentUser.current === account) {
        setSnapshot(next);
        setError('');
      }
    } catch (cause) {
      if (currentUser.current === account) setError(errorMessage(cause));
    } finally {
      if (currentUser.current === account) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let changed = false;
    const update = (next: User | null) => {
      currentUser.current = next;
      setUser(next);
      setLoading(true);
      void refresh();
    };
    const unsubscribe = localStore.subscribe(next => {
      changed = true;
      update(next);
    });
    localStore.currentUser().then(next => {
      if (active && !changed) update(next);
    }).catch(cause => {
      if (active && !changed) {
        setError(errorMessage(cause));
        setLoading(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [refresh]);

  const run = async (action: (id: string) => Promise<void>) => {
    const account = currentUser.current;
    if (!account || operation.current) return false;
    operation.current = true;
    setBusy(true);
    try {
      await action(account.id);
      if (currentUser.current === account) await refresh();
      return true;
    } catch (cause) {
      if (currentUser.current === account) showAlert('Could not save', errorMessage(cause));
      return false;
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };

  const value: ParentContext = {
    ...forAccount(snapshot, user?.id ?? null),
    user, loading, error, busy, refresh,
    saveTask: (title, id, dueDate) => run(uid => localStore.saveTask(uid, title, id, dueDate)),
    toggleTask: task => run(uid => localStore.toggleTask(uid, task.id)),
    deleteTask: id => run(uid => localStore.deleteTask(uid, id)),
    startFocus: (minutes, taskId) => run(uid => localStore.startFocus(uid, minutes, taskId)),
    setFocusPaused: paused => run(uid => localStore.setFocusPaused(uid, paused)),
    sendMessage: (childId, body, attachment) => run(uid => localStore.sendMessage(uid, childId, body, 'parent', attachment)),
    endFocus: (status = 'available') => run(uid => localStore.endFocus(uid, status)),
    answer: (id, status) => run(uid => localStore.answer(uid, id, status)),
    markRead: id => run(uid => localStore.markRead(uid, id)),
    logout: async () => {
      try {
        await localStore.signOut();
        router.replace('/');
      } catch (cause) {
        showAlert('Could not log out', errorMessage(cause));
      }
    },
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useParent() {
  const value = useContext(Context);
  if (!value) throw new Error('ParentProvider is required');
  return value;
}
