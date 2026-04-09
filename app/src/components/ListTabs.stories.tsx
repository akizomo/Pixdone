import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ListTabs } from './ListTabs';
import type { List } from '../types/list';

const mockLists: List[] = [
  { id: 'smash-list', name: '💥 Smash List', tasks: [] },
  { id: 'default', name: 'Tutorial', tasks: [{ id: 't1', title: 'Task', completed: false, dueDate: null, listId: 'default' }] },
  { id: 'list-2', name: 'Shopping', tasks: [] },
];

const meta: Meta<typeof ListTabs> = {
  title: 'PixDone/App/ListTabs',
  component: ListTabs,
  tags: ['autodocs'],
  args: {
    onSelect: fn(),
    onAddList: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    lists: mockLists,
    activeListId: 'default',
    getTabLabel: (list) => (list.id === 'smash-list' ? '💥' : list.name),
    getTabCount: (list) => list.tasks.filter((t) => !t.completed).length,
  },
};

export const SmashActive: Story = {
  args: {
    lists: mockLists,
    activeListId: 'smash-list',
    getTabLabel: (list) => (list.id === 'smash-list' ? '💥' : list.name),
    getTabCount: (list) => list.tasks.filter((t) => !t.completed).length,
  },
};
