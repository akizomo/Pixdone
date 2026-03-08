import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Toast** — Floating ephemeral notification. Position in a fixed container at bottom-center or bottom-right (z-index: 600). **Anatomy:** Icon + Content (title + message) + dismiss button. **Accessibility:** `role="status"` with `aria-live="polite"`. Auto-dismisses after `duration` ms (default 4000). Set `duration=0` for persistent toasts. **Reward** variant has green glow for celebration moments.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'reward'] },
  },
};
export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = { args: { message: 'Task created successfully.', duration: 0 } };
export const Success: Story = { args: { variant: 'success', title: 'Saved!', message: 'Changes saved to all devices.', duration: 0 } };
export const Warning: Story = { args: { variant: 'warning', title: 'Streak warning', message: '2 hours left to keep your streak alive.', duration: 0 } };
export const Danger: Story = { args: { variant: 'danger', title: 'Error', message: 'Failed to sync. Please try again.', duration: 0 } };
export const Reward: Story = { args: { variant: 'reward', title: '🎉 Level Up!', message: 'You reached Level 12. XP bonus unlocked!', duration: 0 } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Toast variant="default" message="Task created." duration={0} />
      <Toast variant="success" title="Done!" message="Task completed." duration={0} />
      <Toast variant="warning" title="Heads up" message="Streak expires in 1 hour." duration={0} />
      <Toast variant="danger" title="Error" message="Unable to save." duration={0} />
      <Toast variant="reward" title="Achievement!" message="10 tasks completed today." duration={0} />
    </div>
  ),
};
