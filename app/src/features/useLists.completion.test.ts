import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/* ---- In-memory Firestore: updateDoc writes the server copy and re-emits snapshots ---- */
type Docs = Record<string, Record<string, unknown>>;
const server: { lists: Docs; tasks: Docs } = { lists: {}, tasks: {} };
const listeners: Record<string, ((snap: unknown) => void)[]> = { lists: [], tasks: [] };

function emit(col: 'lists' | 'tasks') {
  const snap = {
    docs: Object.entries(server[col]).map(([id, data]) => ({ id, data: () => ({ ...data }) })),
  };
  listeners[col].forEach((cb) => cb(snap));
}

vi.mock('firebase/firestore', () => {
  class Timestamp {
    private ms: number;
    constructor(ms: number) { this.ms = ms; }
    static now() { return new Timestamp(Date.now()); }
    toMillis() { return this.ms; }
    toDate() { return new Date(this.ms); }
  }
  return {
    Timestamp,
    collection: (_db: unknown, name: string) => ({ name }),
    query: (c: { name: string }) => c,
    where: () => null,
    doc: (_db: unknown, col: 'lists' | 'tasks', id: string) => ({ col, id }),
    onSnapshot: (q: { name: 'lists' | 'tasks' }, cb: (snap: unknown) => void) => {
      listeners[q.name].push(cb);
      return () => {
        listeners[q.name] = listeners[q.name].filter((l) => l !== cb);
      };
    },
    updateDoc: vi.fn(async (ref: { col: 'lists' | 'tasks'; id: string }, patch: Record<string, unknown>) => {
      server[ref.col][ref.id] = { ...server[ref.col][ref.id], ...patch };
      emit(ref.col);
    }),
    setDoc: vi.fn(async () => {}),
    addDoc: vi.fn(async () => ({ id: 'new' })),
    deleteDoc: vi.fn(async () => {}),
    deleteField: () => undefined,
    writeBatch: () => ({ update: () => {}, set: () => {}, delete: () => {}, commit: async () => {} }),
  };
});
vi.mock('../lib/firebase', () => ({ db: {} }));
// Stable object: a new user per render would re-run the Firestore subscription effect.
const authValue = { user: { uid: 'u1' } };
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => authValue }));
const entitlements = { isPremium: false };
vi.mock('../hooks/useThemeEntitlements', () => ({ useThemeEntitlements: () => entitlements }));

import { useLists } from './useLists';

const INBOX = 'inbox-u1';

function seed() {
  server.lists = { [INBOX]: { uid: 'u1', name: 'My Tasks', kind: 'inbox', createdAt: 0 } };
  server.tasks = {
    mail: { uid: 'u1', listId: INBOX, title: 'メール返信', completed: false, dueDate: '2026-11-04', repeat: 'daily', sortOrder: 0 },
    book: { uid: 'u1', listId: INBOX, title: '本を読む', completed: false, dueDate: '2026-11-04', repeat: 'daily', sortOrder: 1 },
    gym: { uid: 'u1', listId: INBOX, title: 'ジムに行く', completed: false, dueDate: '2026-11-04', repeat: { type: 'custom', interval: 1, unit: 'week', weekDays: [1, 3, 5] }, sortOrder: 2 },
    aiueo: { uid: 'u1', listId: INBOX, title: 'aiueo', completed: false, dueDate: null, repeat: 'none', sortOrder: 3 },
  };
}

async function flush() {
  await act(async () => { await Promise.resolve(); });
}

function inboxTasks(result: { current: ReturnType<typeof useLists> }) {
  return result.current.lists.find((l) => l.id === INBOX)!.tasks;
}

describe('useLists complete / undo', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 2, 12));
    listeners.lists = [];
    listeners.tasks = [];
    seed();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completing one task after undoing others completes only that task', async () => {
    const { result } = renderHook(() => useLists());
    act(() => { emit('lists'); emit('tasks'); });

    for (const id of ['mail', 'book', 'gym', 'aiueo']) {
      // The toast's undo holds the callback from before completeTask re-rendered.
      const staleUndo = result.current.uncompleteTask;
      act(() => result.current.completeTask(id));
      await flush();
      act(() => {
        // Another state update in the same event keeps React from running the updater eagerly.
        result.current.setActiveList(INBOX);
        staleUndo(id);
      });
      await flush();
    }

    expect(Object.values(server.tasks).every((t) => t.completed === false)).toBe(true);

    act(() => result.current.completeTask('mail'));
    await flush();

    const completed = inboxTasks(result).filter((t) => t.completed).map((t) => t.id);
    expect(completed).toEqual(['mail']);
  });

  it('undo restores the due date a repeating task had before completion', async () => {
    const { result } = renderHook(() => useLists());
    act(() => { emit('lists'); emit('tasks'); });

    act(() => result.current.completeTask('mail'));
    await flush();
    expect(server.tasks.mail.dueDate).toBe('2026-11-05');

    act(() => result.current.uncompleteTask('mail'));
    await flush();

    expect(server.tasks.mail.dueDate).toBe('2026-11-04');
    expect(inboxTasks(result).find((t) => t.id === 'mail')).toMatchObject({ completed: false, dueDate: '2026-11-04' });
  });
});
