import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

afterEach(cleanup);

const mockPlaySound = vi.fn();
vi.mock('../services/sound', () => ({
  playSound: (...args: unknown[]) => mockPlaySound(...args),
}));

import { TaskForm } from './TaskForm';
import type { Task } from '../types/task';

// ---- helpers ----

function renderForm(overrides: Partial<Parameters<typeof TaskForm>[0]> = {}) {
  const props = {
    lang: 'en' as const,
    listId: 'list-1',
    onSave: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  const result = render(<TaskForm {...props} />);
  return { ...result, ...props };
}

function getTitleField() {
  return screen.getByRole('textbox', { name: /task/i }) ?? document.getElementById('task-title');
}

describe('TaskForm — Enter key to save (②)', () => {
  describe('title field', () => {
    it('calls onSave when Enter is pressed (not composing)', () => {
      const { onSave } = renderForm();
      const title = document.getElementById('task-title')!;

      // Type a title first
      title.textContent = 'Buy milk';
      fireEvent.input(title);

      fireEvent.keyDown(title, { key: 'Enter', isComposing: false });

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Buy milk' }),
      );
    });

    it('does NOT call onSave when Enter is pressed during IME composing', () => {
      const { onSave } = renderForm();
      const title = document.getElementById('task-title')!;
      title.textContent = '牛乳';
      fireEvent.input(title);

      fireEvent.keyDown(title, { key: 'Enter', isComposing: true });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('calls onCancel when Escape is pressed (existing behavior)', () => {
      const { onCancel } = renderForm();
      const title = document.getElementById('task-title')!;

      fireEvent.keyDown(title, { key: 'Escape' });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does NOT insert a newline when Enter is pressed', () => {
      renderForm();
      const title = document.getElementById('task-title')!;
      title.textContent = 'Hello';
      fireEvent.input(title);

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      title.dispatchEvent(event);

      // Enter should be prevented (no newline)
      expect(event.defaultPrevented).toBe(true);
    });

    it('calls onCancel (not onSave) when Enter pressed on empty title', () => {
      const { onSave, onCancel } = renderForm();
      const title = document.getElementById('task-title')!;
      title.textContent = '';
      fireEvent.input(title);

      fireEvent.keyDown(title, { key: 'Enter', isComposing: false });

      // handleSave with empty title calls onCancel
      expect(onSave).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('details (memo) field', () => {
    it('calls onSave when Enter is pressed without Shift', () => {
      const { onSave } = renderForm();
      const title = document.getElementById('task-title')!;
      title.textContent = 'Task title';
      fireEvent.input(title);

      // Find the details/memo field (RichTextArea role=textbox with aria-multiline)
      const detailsField = screen.getAllByRole('textbox').find(
        (el) => el.getAttribute('aria-multiline') === 'true',
      )!;

      fireEvent.keyDown(detailsField, { key: 'Enter', shiftKey: false, isComposing: false });

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onSave when Shift+Enter is pressed (allows newline)', () => {
      const { onSave } = renderForm();
      const detailsField = screen.getAllByRole('textbox').find(
        (el) => el.getAttribute('aria-multiline') === 'true',
      )!;

      fireEvent.keyDown(detailsField, { key: 'Enter', shiftKey: true, isComposing: false });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('does NOT call onSave when Enter pressed during IME composing', () => {
      const { onSave } = renderForm();
      const detailsField = screen.getAllByRole('textbox').find(
        (el) => el.getAttribute('aria-multiline') === 'true',
      )!;

      fireEvent.keyDown(detailsField, { key: 'Enter', shiftKey: false, isComposing: true });

      expect(onSave).not.toHaveBeenCalled();
    });
  });
});

// ── Close-to-Save Tests ────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Buy milk',
    completed: false,
    dueDate: null,
    listId: 'default',
    details: '',
    repeat: 'none',
    subtasks: [],
    ...overrides,
  };
}

function renderEditForm(
  taskOverrides: Partial<Task> = {},
  propOverrides: Record<string, unknown> = {},
) {
  const props = {
    lang: 'en' as const,
    listId: 'list-1',
    task: makeTask(taskOverrides),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onClose: vi.fn(),
    ...propOverrides,
  };
  const result = render(<TaskForm {...props} />);
  return { ...result, ...props };
}

describe('TaskForm — Close-to-Save', () => {
  beforeEach(() => mockPlaySound.mockClear());

  // ── Escape key on edited task → auto-save ──

  describe('Escape key triggers close-to-save for edited task', () => {
    it('auto-saves when Escape pressed with dirty title', () => {
      const { onSave, onCancel } = renderEditForm();
      const title = document.getElementById('task-title')!;

      // Change the title
      title.textContent = 'Buy eggs';
      fireEvent.input(title);

      fireEvent.keyDown(title, { key: 'Escape' });

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Buy eggs' }),
      );
      // onCancel should NOT be called — this is a save-close, not a discard
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('explicitly calls onClose after auto-save (does not rely on onSave to close)', () => {
      const { onSave, onClose } = renderEditForm();
      const title = document.getElementById('task-title')!;

      title.textContent = 'Changed';
      fireEvent.input(title);

      fireEvent.keyDown(title, { key: 'Escape' });

      expect(onSave).toHaveBeenCalledTimes(1);
      // onClose must also be called to explicitly dismiss the form
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('auto-saves when Escape pressed with dirty details', () => {
      const { onSave } = renderEditForm();
      const title = document.getElementById('task-title')!;

      const detailsField = screen.getAllByRole('textbox').find(
        (el) => el.getAttribute('aria-multiline') === 'true',
      )!;
      detailsField.textContent = 'Added a note';
      fireEvent.input(detailsField);

      fireEvent.keyDown(title, { key: 'Escape' });

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Buy milk', details: 'Added a note' }),
      );
    });

    it('does NOT save on Escape when nothing changed (dirty=false)', () => {
      const { onSave, onClose } = renderEditForm();
      const title = document.getElementById('task-title')!;

      fireEvent.keyDown(title, { key: 'Escape' });

      expect(onSave).not.toHaveBeenCalled();
      // Should close without saving — calls onClose (not onCancel)
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT save on Escape when title is emptied', () => {
      const { onSave, onClose } = renderEditForm();
      const title = document.getElementById('task-title')!;

      title.textContent = '';
      fireEvent.input(title);

      fireEvent.keyDown(title, { key: 'Escape' });

      // Empty title → don't save, just close
      expect(onSave).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── Escape key on new task → traditional cancel ──

  describe('Escape key on new task form (no auto-save)', () => {
    it('calls onCancel (not onSave) even with typed content', () => {
      const props = {
        lang: 'en' as const,
        listId: 'list-1',
        onSave: vi.fn(),
        onCancel: vi.fn(),
        onClose: vi.fn(),
      };
      render(<TaskForm {...props} />);
      const title = document.getElementById('task-title')!;
      title.textContent = 'New task';
      fireEvent.input(title);

      fireEvent.keyDown(title, { key: 'Escape' });

      // New task: Escape calls onCancel (with sound), not silent onClose
      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onSave).not.toHaveBeenCalled();
      expect(props.onClose).not.toHaveBeenCalled();
    });
  });

  // ── Cancel button always discards ──

  describe('Cancel button discards changes', () => {
    it('calls onCancel without saving when cancel button clicked', () => {
      const { onSave, onCancel } = renderEditForm();
      const title = document.getElementById('task-title')!;

      // Make a change
      title.textContent = 'Changed title';
      fireEvent.input(title);

      fireEvent.click(screen.getByText('Cancel'));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  // ── handleClose (called by BottomSheet onClose / outside-click) ──

  describe('handleClose callback for parent integration', () => {
    it('calls onSave when parent triggers close on dirty edit form', () => {
      const { onSave } = renderEditForm();
      const title = document.getElementById('task-title')!;

      title.textContent = 'Updated';
      fireEvent.input(title);

      // Simulate BottomSheet/outside-click close by pressing Escape
      // (same code path as handleClose)
      fireEvent.keyDown(title, { key: 'Escape' });

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated' }),
      );
    });
  });

  // ── Dirty check edge cases ──

  describe('dirty check detects field changes correctly', () => {
    it('detects dueDate change', () => {
      const { onSave } = renderEditForm({ dueDate: null });

      // Click the "Today" chip button
      fireEvent.click(screen.getByText('Today'));

      const title = document.getElementById('task-title')!;
      fireEvent.keyDown(title, { key: 'Escape' });

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: '2026-04-09' }),
      );
    });

    it('is NOT dirty when whitespace-only change on details normalizes', () => {
      // details='' in task, user types only spaces → trim produces '' → not dirty
      const { onSave, onClose } = renderEditForm({ details: '' });

      const detailsField = screen.getAllByRole('textbox').find(
        (el) => el.getAttribute('aria-multiline') === 'true',
      )!;
      detailsField.textContent = '   ';
      fireEvent.input(detailsField);

      const title = document.getElementById('task-title')!;
      fireEvent.keyDown(title, { key: 'Escape' });

      // Whitespace-only details should normalize to '' → not dirty
      expect(onSave).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  // ── Sound behavior ──

  describe('sound effects', () => {
    it('plays taskAdd on auto-save close', () => {
      renderEditForm();
      mockPlaySound.mockClear();

      const title = document.getElementById('task-title')!;
      title.textContent = 'Changed';
      fireEvent.input(title);

      fireEvent.keyDown(title, { key: 'Escape' });

      expect(mockPlaySound).toHaveBeenCalledWith('taskAdd');
    });

    it('does NOT play any sound when closing unchanged edit form', () => {
      renderEditForm();
      mockPlaySound.mockClear();

      const title = document.getElementById('task-title')!;
      fireEvent.keyDown(title, { key: 'Escape' });

      // No sound — silent close
      expect(mockPlaySound).not.toHaveBeenCalled();
    });

    it('cancel button still triggers taskCancel sound (via DS Button)', () => {
      // The cancel button uses DS Button which handles sound internally,
      // but the handler itself should NOT duplicate sounds.
      // This test verifies onCancel is called (sound is Button's responsibility)
      const { onCancel } = renderEditForm();

      fireEvent.click(screen.getByText('Cancel'));

      expect(onCancel).toHaveBeenCalled();
    });
  });
});
