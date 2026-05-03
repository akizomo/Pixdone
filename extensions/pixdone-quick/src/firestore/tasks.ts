/**
 * High-level Firestore operations for PixDone Quick — matches the shape used
 * by the web app's `useLists` feature so TaskItem/TaskForm work natively.
 *
 * Runs in the extension-privileged context (background service worker);
 * content scripts call these via chrome.runtime.sendMessage.
 */
import type { Task, RepeatConfig, Subtask } from '@app/types/task';
import type { List } from '@app/types/list';
import { runQuery, createDocument, updateDocument, deleteDocument } from './rest';
import { dlog } from '../log';

interface RawTaskDoc extends Record<string, unknown> {
  id: string;
  uid?: string;
  listId?: string;
  title?: string;
  details?: string;
  dueDate?: string | null;
  priority?: string;
  repeat?: unknown;
  subtasks?: Subtask[];
  completed?: boolean;
  completedAt?: string;
  sortOrder?: number;
}

interface RawListDoc extends Record<string, unknown> {
  id: string;
  uid?: string;
  name?: string;
  kind?: 'inbox';
  sortMode?: string;
}

function hydrateTask(doc: RawTaskDoc): Task {
  const rawPriority = doc.priority;
  const priority: Task['priority'] =
    rawPriority === 'high' || rawPriority === 'medium' || rawPriority === 'low'
      ? rawPriority
      : undefined;
  return {
    id: doc.id,
    title: typeof doc.title === 'string' ? doc.title : '',
    details: typeof doc.details === 'string' ? doc.details : '',
    dueDate: typeof doc.dueDate === 'string' ? doc.dueDate : null,
    priority,
    repeat: (doc.repeat ?? 'none') as RepeatConfig,
    subtasks: Array.isArray(doc.subtasks) ? (doc.subtasks as Subtask[]) : [],
    completed: !!doc.completed,
    completedAt: typeof doc.completedAt === 'string' ? doc.completedAt : undefined,
    listId: typeof doc.listId === 'string' ? doc.listId : '',
    sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : undefined,
  };
}

function hydrateList(doc: RawListDoc): List {
  return {
    id: doc.id,
    name: typeof doc.name === 'string' ? doc.name : 'My Tasks',
    tasks: [],
    sortMode: (['manual', 'dueDate', 'priority', 'createdAt', 'alphabetical'] as const).includes(
      doc.sortMode as never,
    )
      ? (doc.sortMode as List['sortMode'])
      : undefined,
    kind: doc.kind === 'inbox' ? 'inbox' : undefined,
  };
}

export async function fetchLists(uid: string): Promise<List[]> {
  const rows = await runQuery('lists', { fieldPath: 'uid', op: 'EQUAL', value: uid });
  return rows.map((r) => hydrateList(r as RawListDoc));
}

export async function fetchTasks(uid: string): Promise<Task[]> {
  const rows = await runQuery('tasks', { fieldPath: 'uid', op: 'EQUAL', value: uid });
  const tasks = rows.map((r) => hydrateTask(r as RawTaskDoc));
  dlog(
    `[PixDone Quick/fs] fetchTasks returned ${tasks.length} rows — completed counts:`,
    {
      completed: tasks.filter((t) => t.completed).length,
      active: tasks.filter((t) => !t.completed).length,
    },
    'last 5:',
    tasks.slice(-5).map((t) => ({ id: t.id, title: t.title, completed: t.completed, dueDate: t.dueDate })),
  );
  return tasks;
}

export interface CreateTaskInput {
  uid: string;
  listId: string;
  title: string;
  details?: string;
  dueDate?: string | null;
  priority?: Task['priority'];
  repeat?: RepeatConfig;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const payload: Record<string, unknown> = {
    uid: input.uid,
    listId: input.listId,
    title: input.title,
    details: input.details ?? '',
    dueDate: input.dueDate ?? null,
    completed: false,
    repeat: input.repeat ?? 'none',
    createdAt: new Date().toISOString(),
  };
  if (input.priority) payload.priority = input.priority;
  const doc = await createDocument('tasks', payload);
  return hydrateTask(doc as RawTaskDoc);
}

export async function updateTask(
  taskId: string,
  updates: Partial<Pick<Task, 'title' | 'details' | 'dueDate' | 'priority' | 'completed' | 'repeat' | 'listId' | 'subtasks' | 'sortOrder'>>,
): Promise<Task> {
  // Normalize: Firestore rejects `undefined`; map to explicit null where the schema allows it.
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined) continue;
    payload[k] = v;
  }
  if (payload.completed === true && !('completedAt' in payload)) {
    payload.completedAt = new Date().toISOString();
  }
  const doc = await updateDocument('tasks', taskId, payload);
  return hydrateTask(doc as RawTaskDoc);
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDocument('tasks', taskId);
}
