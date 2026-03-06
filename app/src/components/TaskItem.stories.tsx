import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
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
};

export const Completed: Story = {
  args: { task: { ...defaultTask, completed: true } },
};

export const SmashMode: Story = {
  args: {
    task: { ...defaultTask, title: 'Smash me!' },
    isSmash: true,
  },
};

export const WithDelete: Story = {
  args: {
    task: defaultTask,
    onDelete: fn(),
  },
};
