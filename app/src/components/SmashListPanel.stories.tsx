import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SmashListPanel } from './SmashListPanel';
import type { Task } from '../types/task';

const mockTasks: Task[] = [
  { id: 's1', title: 'Smash me first', completed: false, dueDate: null, listId: 'smash-list' },
  { id: 's2', title: 'Then me', completed: false, dueDate: null, listId: 'smash-list' },
  { id: 's3', title: 'And me!', completed: false, dueDate: null, listId: 'smash-list' },
];

const meta: Meta<typeof SmashListPanel> = {
  title: 'PixDone/App/SmashListPanel',
  component: SmashListPanel,
  tags: ['autodocs'],
  args: {
    onSmash: fn(),
    getDisplayTitle: (t) => t.title,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    subtitle: 'This list exists only to let you tap and smash tasks for pure satisfaction. No saving, no planning—just smashing.',
    hint: 'Press Space to smash a task',
    tasks: mockTasks,
  },
};

export const Japanese: Story = {
  args: {
    subtitle: 'このリストはタスクを叩いてスッキリするためだけにあります。保存も計画もなし。ただスマッシュ。',
    hint: 'Space キーでタスクをスマッシュ',
    tasks: mockTasks,
    getDisplayTitle: (t) => t.title,
  },
};
