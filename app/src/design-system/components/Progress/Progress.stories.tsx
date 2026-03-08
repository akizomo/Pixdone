import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Progress** — Linear progress bar for task completion, XP, loading states. **Anatomy:** Header (label + value) + Track + Fill. **Accessibility:** Uses `role="progressbar"` with `aria-valuenow/min/max` and `aria-label`. **Variants:** default (brand purple), success (green), warning (amber), danger (red), brand (gradient). **Animated** mode adds striped motion — disabled by reduced-motion preference.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'brand'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = { args: { value: 60, showLabel: true, 'aria-label': 'Task completion' } };
export const WithLabel: Story = { args: { value: 72, label: 'Daily XP', showLabel: true } };
export const Success: Story = { args: { value: 100, variant: 'success', label: 'Streak', showLabel: true } };
export const Warning: Story = { args: { value: 85, variant: 'warning', label: 'Storage used', showLabel: true } };
export const Danger: Story = { args: { value: 95, variant: 'danger', label: 'At risk', showLabel: true } };
export const BrandGradient: Story = { args: { value: 45, variant: 'brand', label: 'Level Progress', showLabel: true, size: 'lg' } };
export const Animated: Story = { args: { value: 65, animated: true, label: 'Processing…' } };

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <Progress value={60} size="sm" label="Small" showLabel />
      <Progress value={60} size="md" label="Medium" showLabel />
      <Progress value={60} size="lg" label="Large" showLabel />
    </div>
  ),
};

export const TaskCompletion: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      {[
        { label: 'Design', value: 100, variant: 'success' as const },
        { label: 'Development', value: 65, variant: 'default' as const },
        { label: 'Testing', value: 20, variant: 'warning' as const },
        { label: 'Deployment', value: 0, variant: 'default' as const },
      ].map(({ label, value, variant }) => (
        <Progress key={label} label={label} value={value} variant={variant} showLabel size="md" />
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'Progress bars representing project phases.' } } },
};
