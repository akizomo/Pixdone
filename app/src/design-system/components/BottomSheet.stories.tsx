import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BottomSheet } from './BottomSheet';

const meta: Meta<typeof BottomSheet> = {
  title: 'PixDone/Design System/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
  },
  args: { onClose: fn() },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    open: false,
    title: 'New Task',
    children: <p>Sheet content</p>,
  },
};

export const Open: Story = {
  args: {
    open: true,
    title: 'Edit Task',
    children: (
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          className="w-full px-3 py-2 border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] text-[var(--pd-color-text-primary)]"
        />
        <textarea
          placeholder="Details"
          className="w-full px-3 py-2 border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] text-[var(--pd-color-text-primary)] min-h-[80px]"
        />
      </div>
    ),
  },
};
