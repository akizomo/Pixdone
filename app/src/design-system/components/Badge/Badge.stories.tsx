import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'repeat' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'overdue' },
};

export const Warning: Story = {
  args: { variant: 'warning', children: 'today' },
};

export const Success: Story = {
  args: { variant: 'success', children: 'done' },
};

export const WithIcon: Story = {
  args: {
    variant: 'warning',
    icon: <span className="material-icons" style={{ fontSize: 12 }}>calendar_today</span>,
    children: 'Apr 10',
  },
};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Badge>default</Badge>
      <Badge variant="danger">overdue</Badge>
      <Badge variant="warning">today</Badge>
      <Badge variant="success">done</Badge>
      <Badge icon={<span className="material-icons" style={{ fontSize: 12 }}>repeat</span>}>weekly</Badge>
    </div>
  ),
};
