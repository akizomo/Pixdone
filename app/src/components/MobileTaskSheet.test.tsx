import { render, screen, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { MobileTaskSheet, type MobileTaskSheetHandle } from './MobileTaskSheet';
import type { Task } from '../types/task';
import { describe, it, expect, vi, afterEach } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Existing task',
    completed: false,
    dueDate: null,
    listId: 'list-1',
  },
];

const LISTS = [
  { id: 'list-1', name: 'My List' },
  { id: 'list-2', name: 'Work' },
];

function setup(overrides: { tasks?: Task[] } = {}) {
  const ref = createRef<MobileTaskSheetHandle>();
  const onAddTask = vi.fn();
  const onUpdateTask = vi.fn();
  const onDeleteRequest = vi.fn();
  const onMoveToList = vi.fn();

  const result = render(
    <MobileTaskSheet
      ref={ref}
      lang="en"
      tasks={overrides.tasks ?? TASKS}
      currentListId="list-1"
      onAddTask={onAddTask}
      onUpdateTask={onUpdateTask}
      onDeleteRequest={onDeleteRequest}
      onMoveToList={onMoveToList}
      availableLists={LISTS}
    />,
  );

  return { ref, onAddTask, onUpdateTask, onDeleteRequest, onMoveToList, ...result };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('MobileTaskSheet', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    setup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens add mode via imperative ref', () => {
    const { ref } = setup();
    act(() => ref.current!.openAdd());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add a task')).toBeInTheDocument();
  });

  it('opens edit mode via imperative ref', () => {
    const { ref } = setup();
    act(() => ref.current!.openEdit('task-1'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit task')).toBeInTheDocument();
  });

  it('onClose is ONLY setOpen(false) — close button does not trigger save', async () => {
    const { ref, onAddTask, onUpdateTask } = setup();
    act(() => ref.current!.openAdd());

    // Click close button — should just close, not call save
    const closeButton = screen.getByLabelText('Close');
    await userEvent.click(closeButton);

    expect(onAddTask).not.toHaveBeenCalled();
    expect(onUpdateTask).not.toHaveBeenCalled();
  });

  it('save button in add mode calls onAddTask then closes', async () => {
    const { ref, onAddTask } = setup();
    act(() => ref.current!.openAdd());

    // Type a title into contenteditable
    const titleInput = screen.getByRole('dialog').querySelector('[contenteditable]') as HTMLElement;
    expect(titleInput).toBeTruthy();
    // Use fireEvent for contenteditable — userEvent.keyboard has space issues in jsdom
    titleInput.textContent = 'New task';
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Click save
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onAddTask).toHaveBeenCalledTimes(1);
    expect(onAddTask).toHaveBeenCalledWith(
      'list-1',
      expect.objectContaining({ title: 'New task' }),
    );
  });

  it('cancel button closes without saving', async () => {
    const { ref, onAddTask } = setup();
    act(() => ref.current!.openAdd());

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onAddTask).not.toHaveBeenCalled();
  });

  it('edit mode save calls onUpdateTask', async () => {
    const { ref, onUpdateTask } = setup();
    act(() => ref.current!.openEdit('task-1'));

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onUpdateTask).toHaveBeenCalledTimes(1);
    expect(onUpdateTask).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({ title: 'Existing task' }),
    );
  });

  it('imperative close() works', async () => {
    const { ref } = setup();
    act(() => ref.current!.openAdd());
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close imperatively — BottomSheet uses a 350ms timer to unmount
    act(() => ref.current!.close());

    // After close animation time, dialog should be gone
    await vi.waitFor(
      () => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      { timeout: 500 },
    );
  });

  it('save then close does not call save twice', async () => {
    const { ref, onAddTask } = setup();
    act(() => ref.current!.openAdd());

    const titleInput = screen.getByRole('dialog').querySelector('[contenteditable]') as HTMLElement;
    titleInput.textContent = 'My task';
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Save
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onAddTask).toHaveBeenCalledTimes(1);

    // Even if close is triggered again, save should not fire again
    onAddTask.mockClear();
    act(() => ref.current!.close());

    expect(onAddTask).not.toHaveBeenCalled();
  });
});
