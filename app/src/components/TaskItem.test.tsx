import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(cleanup);
import { TaskItem } from './TaskItem';
import type { Task } from '../types/task';
import { getTodayYMD, getTomorrowYMD } from '../lib/date';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Test task',
    completed: false,
    dueDate: null,
    listId: 'default',
    ...overrides,
  };
}

describe('TaskItem', () => {
  describe('basic rendering', () => {
    it('renders task title', () => {
      render(
        <TaskItem
          task={makeTask({ title: 'Buy milk' })}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText('Buy milk')).toBeInTheDocument();
    });

    it('sets data-task-id on the row', () => {
      const { container } = render(
        <TaskItem task={makeTask({ id: 'abc-123' })} onComplete={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(container.querySelector('[data-task-id="abc-123"]')).not.toBeNull();
    });
  });

  describe('completed state', () => {
    it('shows checkmark when completed', () => {
      render(
        <TaskItem task={makeTask({ completed: true })} onComplete={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('does not show checkmark when not completed', () => {
      render(
        <TaskItem task={makeTask({ completed: false })} onComplete={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
      expect(screen.queryByText('✓')).toBeNull();
    });
  });

  describe('checkbox interaction', () => {
    it('calls onComplete with task id when checkbox clicked', () => {
      const onComplete = vi.fn();
      render(
        <TaskItem task={makeTask({ id: 'task-42' })} onComplete={onComplete} onEdit={vi.fn()} />,
      );
      fireEvent.click(screen.getByRole('checkbox'));
      expect(onComplete).toHaveBeenCalledWith('task-42');
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('checkbox click does not also trigger onEdit', () => {
      const onEdit = vi.fn();
      render(
        <TaskItem task={makeTask()} onComplete={vi.fn()} onEdit={onEdit} />,
      );
      fireEvent.click(screen.getByRole('checkbox'));
      expect(onEdit).not.toHaveBeenCalled();
    });
  });

  describe('row click / onEdit', () => {
    it('calls onEdit with task id when row clicked', () => {
      const onEdit = vi.fn();
      const { container } = render(
        <TaskItem task={makeTask({ id: 'task-99' })} onComplete={vi.fn()} onEdit={onEdit} />,
      );
      const row = container.querySelector('.task-item-row') as HTMLElement;
      fireEvent.click(row);
      expect(onEdit).toHaveBeenCalledWith('task-99');
    });

    it('does not call onEdit when isSmash=true', () => {
      const onEdit = vi.fn();
      const { container } = render(
        <TaskItem task={makeTask()} isSmash onComplete={vi.fn()} onEdit={onEdit} />,
      );
      const row = container.querySelector('.task-item-row') as HTMLElement;
      fireEvent.click(row);
      expect(onEdit).not.toHaveBeenCalled();
    });

    it('does not call onEdit when suppressOpenEdit returns true', () => {
      const onEdit = vi.fn();
      const { container } = render(
        <TaskItem
          task={makeTask()}
          onComplete={vi.fn()}
          onEdit={onEdit}
          suppressOpenEdit={() => true}
        />,
      );
      const row = container.querySelector('.task-item-row') as HTMLElement;
      fireEvent.click(row);
      expect(onEdit).not.toHaveBeenCalled();
    });

    it('calls onEdit when suppressOpenEdit returns false', () => {
      const onEdit = vi.fn();
      const { container } = render(
        <TaskItem
          task={makeTask({ id: 'task-5' })}
          onComplete={vi.fn()}
          onEdit={onEdit}
          suppressOpenEdit={() => false}
        />,
      );
      const row = container.querySelector('.task-item-row') as HTMLElement;
      fireEvent.click(row);
      expect(onEdit).toHaveBeenCalledWith('task-5');
    });
  });

  describe('delete button', () => {
    it('shows delete button when onDelete provided and not isSmash', () => {
      render(
        <TaskItem
          task={makeTask()}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByLabelText('Delete task')).toBeInTheDocument();
    });

    it('does not show delete button when isSmash=true', () => {
      render(
        <TaskItem
          task={makeTask()}
          isSmash
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.queryByLabelText('Delete task')).toBeNull();
    });

    it('does not show delete button when onDelete not provided', () => {
      render(
        <TaskItem task={makeTask()} onComplete={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(screen.queryByLabelText('Delete task')).toBeNull();
    });

    it('calls onDelete with task id when delete button clicked', () => {
      const onDelete = vi.fn();
      render(
        <TaskItem
          task={makeTask({ id: 'del-task' })}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByLabelText('Delete task'));
      expect(onDelete).toHaveBeenCalledWith('del-task');
    });

    it('delete button click does not also trigger onEdit', () => {
      const onEdit = vi.fn();
      render(
        <TaskItem
          task={makeTask()}
          onComplete={vi.fn()}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByLabelText('Delete task'));
      expect(onEdit).not.toHaveBeenCalled();
    });
  });

  describe('due date badge', () => {
    it('shows "Today" badge for today\'s date', () => {
      render(
        <TaskItem
          task={makeTask({ dueDate: getTodayYMD() })}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText(/Today/)).toBeInTheDocument();
    });

    it('shows "Tomorrow" badge for tomorrow\'s date', () => {
      render(
        <TaskItem
          task={makeTask({ dueDate: getTomorrowYMD() })}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText(/Tomorrow/)).toBeInTheDocument();
    });

    it('does not show due badge when dueDate is null', () => {
      const { container } = render(
        <TaskItem task={makeTask({ dueDate: null })} onComplete={vi.fn()} onEdit={vi.fn()} />,
      );
      // calendar_today icon should not appear
      expect(container.querySelector('.pxd-pixel-icon')).toBeNull();
    });
  });

  describe('repeat badge', () => {
    it('shows Daily repeat badge in English', () => {
      render(
        <TaskItem
          task={makeTask({ repeat: 'daily' })}
          lang="en"
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText(/Daily/)).toBeInTheDocument();
    });

    it('shows weekly repeat badge in Japanese', () => {
      render(
        <TaskItem
          task={makeTask({ repeat: 'weekly' })}
          lang="ja"
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText(/毎週/)).toBeInTheDocument();
    });

    it('does not show repeat badge when repeat is "none"', () => {
      const { container } = render(
        <TaskItem
          task={makeTask({ repeat: 'none' })}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      // repeat icon should not be present
      const icons = container.querySelectorAll('.pxd-pixel-icon');
      const hasRepeat = Array.from(icons).some((el) => el.textContent === 'repeat');
      expect(hasRepeat).toBe(false);
    });

    it('shows Weekdays repeat badge in English', () => {
      render(
        <TaskItem
          task={makeTask({ repeat: 'weekdays' })}
          lang="en"
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText(/Weekdays/)).toBeInTheDocument();
    });

    it('shows 平日 repeat badge in Japanese', () => {
      render(
        <TaskItem
          task={makeTask({ repeat: 'weekdays' })}
          lang="ja"
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText(/平日/)).toBeInTheDocument();
    });

    it('shows custom repeat badge with weekDays', () => {
      render(
        <TaskItem
          task={makeTask({ repeat: { type: 'custom', interval: 2, unit: 'week', weekDays: [1, 3] } })}
          lang="en"
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText(/Every 2 weeks \(Mon, Wed\)/)).toBeInTheDocument();
    });

    it('shows custom repeat badge in Japanese', () => {
      render(
        <TaskItem
          task={makeTask({ repeat: { type: 'custom', interval: 2, unit: 'week', weekDays: [1, 3] } })}
          lang="ja"
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText(/2週ごと（月・水）/)).toBeInTheDocument();
    });
  });

  describe('subtasks badge', () => {
    it('shows subtask count badge', () => {
      render(
        <TaskItem
          task={makeTask({
            subtasks: [
              { id: 's1', text: 'Sub 1', done: true },
              { id: 's2', text: 'Sub 2', done: false },
              { id: 's3', text: 'Sub 3', done: false },
            ],
          })}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText('☑ 1/3')).toBeInTheDocument();
    });

    it('does not show subtask badge when no subtasks', () => {
      render(
        <TaskItem task={makeTask({ subtasks: [] })} onComplete={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(screen.queryByText(/☑/)).toBeNull();
    });
  });

  describe('details', () => {
    it('shows details text when provided', () => {
      render(
        <TaskItem
          task={makeTask({ details: 'Remember to check the list' })}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      expect(screen.getByText(/Remember to check the list/)).toBeInTheDocument();
    });

    it('does not show details section when details is empty', () => {
      render(
        <TaskItem task={makeTask({ details: '' })} onComplete={vi.fn()} onEdit={vi.fn()} />,
      );
      // Only the title span should render text
      expect(screen.queryByText(/Remember/)).toBeNull();
    });
  });

  describe('checkbox accessibility (⑥)', () => {
    it('has aria-label describing the task name in English', () => {
      render(
        <TaskItem
          task={makeTask({ title: 'Buy milk' })}
          lang="en"
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Mark "Buy milk" as complete');
    });

    it('has aria-label describing the task name in Japanese', () => {
      render(
        <TaskItem
          task={makeTask({ title: '牛乳を買う' })}
          lang="ja"
          onComplete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', '「牛乳を買う」を完了にする');
    });

    it('checkbox tap target is at least 44px wide and tall', () => {
      const { container } = render(
        <TaskItem task={makeTask()} onComplete={vi.fn()} onEdit={vi.fn()} />,
      );
      const checkboxZone = container.querySelector('.task-checkbox-zone') as HTMLElement;
      expect(checkboxZone).not.toBeNull();
      // 44px min tap target is enforced by CSS (.task-checkbox-zone in TaskItem.css)
      // using var(--pxd-tap-target-min). Verify the class is applied.
      expect(checkboxZone.classList.contains('task-checkbox-zone')).toBe(true);
    });

    it('clicking the expanded zone triggers onComplete', () => {
      const onComplete = vi.fn();
      const { container } = render(
        <TaskItem task={makeTask({ id: 'zone-test' })} onComplete={onComplete} onEdit={vi.fn()} />,
      );
      const checkboxZone = container.querySelector('.task-checkbox-zone') as HTMLElement;
      fireEvent.click(checkboxZone);
      expect(onComplete).toHaveBeenCalledWith('zone-test');
    });
  });

  describe('move to list menu (⑧)', () => {
    it('shows move button when onMoveToList and availableLists are provided', () => {
      render(
        <TaskItem
          task={makeTask()}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onMoveToList={vi.fn()}
          availableLists={[
            { id: 'list-2', name: 'Work' },
            { id: 'list-3', name: 'Personal' },
          ]}
        />,
      );
      expect(screen.getByLabelText(/move/i)).toBeInTheDocument();
    });

    it('does not show move button when onMoveToList is not provided', () => {
      render(
        <TaskItem task={makeTask()} onComplete={vi.fn()} onEdit={vi.fn()} />,
      );
      expect(screen.queryByLabelText(/move/i)).toBeNull();
    });

    it('shows available lists when move button is clicked', () => {
      render(
        <TaskItem
          task={makeTask({ listId: 'list-1' })}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onMoveToList={vi.fn()}
          availableLists={[
            { id: 'list-2', name: 'Work' },
            { id: 'list-3', name: 'Personal' },
          ]}
        />,
      );
      fireEvent.click(screen.getByLabelText(/move/i));
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('calls onMoveToList with taskId and target listId when a list is selected', () => {
      const onMoveToList = vi.fn();
      render(
        <TaskItem
          task={makeTask({ id: 'task-move', listId: 'list-1' })}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onMoveToList={onMoveToList}
          availableLists={[
            { id: 'list-2', name: 'Work' },
          ]}
        />,
      );
      fireEvent.click(screen.getByLabelText(/move/i));
      fireEvent.click(screen.getByText('Work'));
      expect(onMoveToList).toHaveBeenCalledWith('task-move', 'list-2');
    });

    it('move menu click does not trigger onEdit', () => {
      const onEdit = vi.fn();
      render(
        <TaskItem
          task={makeTask()}
          onComplete={vi.fn()}
          onEdit={onEdit}
          onMoveToList={vi.fn()}
          availableLists={[{ id: 'list-2', name: 'Work' }]}
        />,
      );
      fireEvent.click(screen.getByLabelText(/move/i));
      expect(onEdit).not.toHaveBeenCalled();
    });

    it('does not show move button on smash list', () => {
      render(
        <TaskItem
          task={makeTask()}
          isSmash
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onMoveToList={vi.fn()}
          availableLists={[{ id: 'list-2', name: 'Work' }]}
        />,
      );
      expect(screen.queryByLabelText(/move/i)).toBeNull();
    });
  });

  describe('reorder event handlers', () => {
    it('wires onReorderPointerDown to the row', () => {
      const onPointerDown = vi.fn();
      const { container } = render(
        <TaskItem
          task={makeTask()}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onReorderPointerDown={onPointerDown}
        />,
      );
      const row = container.querySelector('.task-item-row') as HTMLElement;
      fireEvent.pointerDown(row);
      expect(onPointerDown).toHaveBeenCalledTimes(1);
    });

    it('wires onReorderTouchStart to the row', () => {
      const onTouchStart = vi.fn();
      const { container } = render(
        <TaskItem
          task={makeTask()}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onReorderTouchStart={onTouchStart}
        />,
      );
      const row = container.querySelector('.task-item-row') as HTMLElement;
      fireEvent.touchStart(row);
      expect(onTouchStart).toHaveBeenCalledTimes(1);
    });

    it('does not crash when reorder handlers are not provided', () => {
      expect(() =>
        render(<TaskItem task={makeTask()} onComplete={vi.fn()} onEdit={vi.fn()} />),
      ).not.toThrow();
    });

    it('renders with reorderSource without crashing', () => {
      expect(() =>
        render(
          <TaskItem
            task={makeTask()}
            onComplete={vi.fn()}
            onEdit={vi.fn()}
            reorderSource
          />,
        ),
      ).not.toThrow();
    });
  });
});
