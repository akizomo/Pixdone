import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**When to use:** Primary actions (Save, Submit), secondary actions (Cancel, Back), or low-emphasis actions (Skip). Use **primary** for the single main CTA; **secondary** for alternatives; **ghost** for tertiary; **danger** for destructive actions; **reward** for success/completion. **Accessibility:** Min 44px height for md/lg; focus-visible shows a 2px ring; disabled remains legible. **Visual:** Pixel shadow on primary/danger/reward; ghost is flat; press scale 0.96 for tactile feedback.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger', 'reward', 'signup', 'icon'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary', children: 'Save' } };
export const Secondary: Story = { args: { variant: 'secondary', children: 'Cancel' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Skip' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Delete' } };
export const Reward: Story = { args: { variant: 'reward', children: 'Done' } };

export const SizeSm: Story = { args: { size: 'sm', children: 'Small' } };
export const SizeMd: Story = { args: { size: 'md', children: 'Medium' } };
export const SizeLg: Story = { args: { size: 'lg', children: 'Large' } };

export const Disabled: Story = { args: { variant: 'primary', disabled: true, children: 'Disabled' } };
export const Loading: Story = { args: { variant: 'primary', loading: true, children: 'Saving…' } };
export const FullWidth: Story = { args: { variant: 'primary', fullWidth: true, children: 'Full width' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pxd-space-3)' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="reward">Reward</Button>
    </div>
  ),
};

export const HierarchyExample: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--pxd-space-3)', flexWrap: 'wrap' }}>
      <Button variant="primary">Confirm</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Skip</Button>
    </div>
  ),
  parameters: { docs: { description: { story: 'Primary CTA with secondary and ghost alternatives.' } } },
};

export const StateComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pxd-space-4)', alignItems: 'center' }}>
      <Button variant="primary">Default</Button>
      <Button variant="primary" disabled>Disabled</Button>
      <Button variant="primary" loading>Loading</Button>
    </div>
  ),
  parameters: { docs: { description: { story: 'Default, disabled, and loading states side by side.' } } },
};
