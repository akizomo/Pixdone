import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'PixDone/Design System/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive', 'icon'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { onClick: fn() },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Save' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancel' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Log in' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
};

export const Icon: Story = {
  args: { variant: 'icon', children: '×', 'aria-label': 'Close' },
};

export const Loading: Story = {
  args: { variant: 'primary', children: 'Saving...', loading: true },
};

export const Disabled: Story = {
  args: { variant: 'primary', children: 'Disabled', disabled: true },
};
