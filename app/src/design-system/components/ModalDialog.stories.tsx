import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ModalDialog } from './ModalDialog';

const meta: Meta<typeof ModalDialog> = {
  title: 'PixDone/Design System/ModalDialog',
  component: ModalDialog,
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
    title: 'Confirm',
    children: <p>Modal content</p>,
  },
};

export const Open: Story = {
  args: {
    open: true,
    title: 'Delete Task?',
    children: <p>Are you sure you want to delete this task? This action cannot be undone.</p>,
    actions: [
      { label: 'Cancel', onClick: fn(), variant: 'secondary' as const },
      { label: 'Delete', onClick: fn(), variant: 'destructive' as const },
    ],
  },
};

export const WithForm: Story = {
  args: {
    open: true,
    title: 'Create New List',
    children: (
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="List name"
          className="w-full px-3 py-2 border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] text-[var(--pd-color-text-primary)]"
        />
      </form>
    ),
    actions: [
      { label: 'Cancel', onClick: fn(), variant: 'secondary' as const },
      { label: 'Create', onClick: fn(), variant: 'primary' as const },
    ],
  },
};
