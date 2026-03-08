import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Alert** — Inline contextual message for feedback within a form or view. **Anatomy:** Colored left border + Icon + Content (title + body) + optional dismiss. **Accessibility:** Uses `role="alert"` with `aria-live="polite"` for dynamic alerts. **Variants:** info, success, warning, danger — always paired with icon for non-color signal. **When to use:** Form validation results, operation feedback, system notices within a page context (not for toasts).',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'danger'] },
  },
};
export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = { args: { variant: 'info', title: 'Tip', children: 'You can reorder tasks by dragging the handle on the left.' } };
export const Success: Story = { args: { variant: 'success', title: 'Saved!', children: 'Your changes have been saved and synced across all devices.' } };
export const Warning: Story = { args: { variant: 'warning', title: 'Streak at risk', children: 'You have 3 hours left to complete a task and maintain your streak.' } };
export const Danger: Story = { args: { variant: 'danger', title: 'Sync failed', children: 'Unable to sync your tasks. Check your connection and try again.' } };
export const Dismissible: Story = { args: { variant: 'info', title: 'New feature', children: 'You can now group tasks by priority.', dismissible: true } };
export const NoTitle: Story = { args: { variant: 'warning', children: 'This list will be permanently deleted in 7 days.' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Alert variant="info" title="Info">A helpful tip or contextual information.</Alert>
      <Alert variant="success" title="Success">Action completed successfully.</Alert>
      <Alert variant="warning" title="Warning">Review this before proceeding.</Alert>
      <Alert variant="danger" title="Error">Something went wrong. Please try again.</Alert>
    </div>
  ),
};
