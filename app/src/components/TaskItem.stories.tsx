import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within, expect } from 'storybook/test';
import { TaskItem } from './TaskItem';
import type { Task } from '../types/task';

const defaultTask: Task = {
  id: 'task-1',
  title: 'Buy groceries',
  completed: false,
  dueDate: null,
  listId: 'default',
};

const meta: Meta<typeof TaskItem> = {
  title: 'PixDone/App/TaskItem',
  component: TaskItem,
  tags: ['autodocs'],
  argTypes: {
    isSmash: { control: 'boolean' },
  },
  args: {
    onComplete: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { task: defaultTask },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // Title is visible
    expect(canvas.getByText('Buy groceries')).toBeTruthy();
    // Checkbox is rendered
    const checkbox = canvas.getByRole('checkbox');
    expect(checkbox).toBeTruthy();
    // Click checkbox calls onComplete
    await userEvent.click(checkbox);
    expect(args.onComplete).toHaveBeenCalledWith('task-1');
  },
};

export const Completed: Story = {
  args: { task: { ...defaultTask, completed: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  },
};

export const SmashMode: Story = {
  args: {
    task: { ...defaultTask, title: 'Smash me!' },
    isSmash: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // No delete button in smash mode
    const deleteBtn = canvasElement.querySelector('[aria-label="Delete task"]');
    expect(deleteBtn).toBeNull();
    expect(canvas.getByText('Smash me!')).toBeTruthy();
  },
};

export const WithDelete: Story = {
  args: {
    task: defaultTask,
    onDelete: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const deleteBtn = canvas.getByLabelText('Delete task');
    await userEvent.click(deleteBtn);
    expect(args.onDelete).toHaveBeenCalledWith('task-1');
  },
};

export const WithDueDate: Story = {
  args: {
    task: { ...defaultTask, dueDate: '2030-06-15' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Date badge is present (6/15 format)
    expect(canvas.getByText(/6\/15/)).toBeTruthy();
  },
};

export const WithRepeat: Story = {
  args: {
    task: { ...defaultTask, repeat: 'weekly' },
    lang: 'en',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Weekly/)).toBeTruthy();
  },
};
