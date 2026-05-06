import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState';
import { Button } from '../Button/Button';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const AllDone: Story = {
  args: {
    variant: 'sleeping',
    title: 'All caught up',
    description: 'Take a break — new tasks will show up here tomorrow.',
  },
};

export const Ready: Story = {
  args: {
    variant: 'ready',
    title: 'READY?',
    description: 'Press N to add your first task.',
  },
};

export const WithAction: Story = {
  args: {
    variant: 'sleeping',
    title: 'No quick tasks',
    description: 'Press n or click below to capture one.',
    action: (
      <Button variant="primary" size="sm">
        + Add your first task
      </Button>
    ),
  },
};
