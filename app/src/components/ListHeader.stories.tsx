import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ListHeader } from './ListHeader';

const meta: Meta<typeof ListHeader> = {
  title: 'PixDone/App/ListHeader',
  component: ListHeader,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    showMenu: { control: 'boolean' },
  },
  args: { onMenuClick: fn() },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const MyTasks: Story = {
  args: { title: 'My Tasks', showMenu: false },
};

export const WithMenu: Story = {
  args: { title: 'Shopping', showMenu: true, onMenuClick: fn() },
};

export const SmashList: Story = {
  args: { title: '💥 Smash List', showMenu: false },
};
