import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'PixDone/Design System/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    icon: <span>⋮</span>,
    'aria-label': 'Options',
    onClick: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { size: 'sm', icon: <span>+</span>, 'aria-label': 'Add' },
};

export const Medium: Story = {
  args: { size: 'md', icon: <span>×</span>, 'aria-label': 'Close' },
};

export const Large: Story = {
  args: { size: 'lg', icon: <span>☰</span>, 'aria-label': 'Menu' },
};
