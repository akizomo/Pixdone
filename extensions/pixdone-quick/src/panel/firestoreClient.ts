/// <reference types="chrome" />
/**
 * Content-script-safe Firestore client. Sends `PIXDONE_FS_*` messages to the
 * background service worker, which performs the actual Firestore REST call
 * with the extension's privileged origin.
 */
import type { Task } from '@app/types/task';
import type { List } from '@app/types/list';
import type { CreateTaskInput } from '../firestore/tasks';

async function send<T>(message: Record<string, unknown>): Promise<T> {
  const resp = await chrome.runtime.sendMessage(message);
  if (!resp || typeof resp !== 'object') throw new Error('no response');
  if (resp.ok === false) throw new Error(resp.error ?? 'unknown_error');
  return resp as T;
}

export async function fetchLists(): Promise<List[]> {
  const { lists } = await send<{ ok: true; lists: List[] }>({
    type: 'PIXDONE_FS_FETCH_LISTS',
  });
  return lists;
}

export async function fetchTasks(): Promise<Task[]> {
  const { tasks } = await send<{ ok: true; tasks: Task[] }>({
    type: 'PIXDONE_FS_FETCH_TASKS',
  });
  return tasks;
}

export async function createTask(input: Omit<CreateTaskInput, 'uid'>): Promise<Task> {
  const { task } = await send<{ ok: true; task: Task }>({
    type: 'PIXDONE_FS_CREATE_TASK',
    payload: input,
  });
  return task;
}

export async function updateTask(
  taskId: string,
  updates: Partial<Pick<Task, 'title' | 'details' | 'dueDate' | 'priority' | 'completed' | 'repeat' | 'listId' | 'subtasks' | 'sortOrder'>>,
): Promise<Task> {
  const { task } = await send<{ ok: true; task: Task }>({
    type: 'PIXDONE_FS_UPDATE_TASK',
    taskId,
    updates,
  });
  return task;
}

export async function deleteTask(taskId: string): Promise<void> {
  await send<{ ok: true }>({ type: 'PIXDONE_FS_DELETE_TASK', taskId });
}
