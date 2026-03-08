import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavigationBar } from './NavigationBar';

const meta: Meta<typeof NavigationBar> = {
  title: 'Components/NavigationBar',
  component: NavigationBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**NavigationBar** — Top app bar (56px height). Follows iOS/Android navigation bar patterns. **Anatomy:** Leading (back/menu) + Title (centered) + Trailing (actions). **Accessibility:** Renders as `<header>` with `<h1>` title. All action buttons have `aria-label`. **Usage:** One per page/view at the top. Always visible on mobile. May be hidden on scroll on desktop.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof NavigationBar>;

export const Simple: Story = { args: { title: 'My Tasks' } };

export const WithBackButton: Story = {
  args: {
    title: 'Work List',
    leading: { icon: '←', 'aria-label': 'Go back', onClick: () => {} },
  },
};

export const WithActions: Story = {
  args: {
    title: 'Today',
    leading: { icon: '☰', 'aria-label': 'Open menu' },
    trailing: [
      { icon: '🔍', 'aria-label': 'Search' },
      { icon: '+', 'aria-label': 'Add task' },
    ],
  },
};

export const GameStyleBar: Story = {
  render: () => (
    <NavigationBar
      title="PIXDONE"
      leading={{ icon: '←', 'aria-label': 'Back' }}
      trailing={[
        { icon: '⭐', 'aria-label': 'XP: 1240' },
        { icon: '👤', 'aria-label': 'Profile' },
      ]}
    />
  ),
  parameters: { docs: { description: { story: 'Navigation bar styled for the Pixdone game layer.' } } },
};
