import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TabBar } from './TabBar';

const meta: Meta<typeof TabBar> = {
  title: 'Components/TabBar',
  component: TabBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**TabBar** — Bottom navigation bar for mobile apps (60px). Uses `<nav>` landmark. **Anatomy:** Nav + items (icon + badge? + label). **Accessibility:** `aria-label` on nav. Active item has `aria-current="page"`. Badge count included in aria-label. **Usage:** 3–5 top-level destinations. Never use for secondary navigation — use Tabs instead.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof TabBar>;

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'tasks', label: 'Tasks', icon: '✅', badge: 4 },
  { id: 'lists', label: 'Lists', icon: '📋' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState('home');
    return (
      <div style={{ maxWidth: 375, border: '1px solid var(--pxd-color-border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: 20, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--pxd-color-text-tertiary)' }}>
          Active: {active}
        </div>
        <TabBar items={NAV_ITEMS} activeId={active} onChange={setActive} />
      </div>
    );
  },
};

export const ThreeItems: Story = {
  render: () => {
    const [active, setActive] = useState('tasks');
    return (
      <div style={{ maxWidth: 375 }}>
        <TabBar
          items={[
            { id: 'tasks', label: 'Tasks', icon: '✅' },
            { id: 'smash', label: 'Smash', icon: '💥' },
            { id: 'profile', label: 'Profile', icon: '👤' },
          ]}
          activeId={active}
          onChange={setActive}
        />
      </div>
    );
  },
};
