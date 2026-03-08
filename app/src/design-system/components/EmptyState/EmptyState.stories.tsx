import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**EmptyState** — Zero-data placeholder that guides users toward action. **Anatomy:** Icon + Title + Description + Action button(s). **Accessibility:** Container uses `aria-live="polite"` to announce state changes. **Design tips:** Use the icon to reinforce the context (📋 for empty list). Title should be encouraging, not just "Nothing here". Always offer a primary action.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoTasks: Story = {
  args: { icon: '✅', title: 'All clear!', description: 'You have no tasks due today. Add one to get started and earn your first XP.', actionLabel: 'Add a task' },
};
export const NoResults: Story = {
  args: { icon: '🔍', title: 'No results', description: 'No tasks match your search. Try different keywords or clear the filter.', actionLabel: 'Clear search', secondaryActionLabel: 'Add a task' },
};
export const OfflineState: Story = {
  args: { icon: '📡', title: 'You\'re offline', description: 'Tasks will sync automatically when your connection is restored.', actionLabel: 'Retry' },
};
export const FirstUse: Story = {
  args: { icon: '🎮', title: 'Start your adventure', description: 'Create your first task list and begin earning XP. Complete tasks to level up!', actionLabel: 'Create first list' },
};
