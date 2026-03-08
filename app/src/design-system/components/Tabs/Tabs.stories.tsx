import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabPanel } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Tabs** — Horizontal navigation between related content panels. **Variants:** underline (default, for main nav), pill (for segmented control / filter). **Anatomy:** `role="tablist"` + tab buttons + `TabPanel` components. **Accessibility:** Full ARIA tabs pattern. Arrow keys navigate between tabs. `aria-selected` + `aria-controls` linkage. **When to use:** Content with multiple related views at the same level of hierarchy.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['underline', 'pill'] },
  },
};
export default meta;
type Story = StoryObj<typeof Tabs>;

const LIST_TABS = [
  { id: 'all', label: 'All', count: 12 },
  { id: 'today', label: 'Today', count: 4 },
  { id: 'upcoming', label: 'Upcoming', count: 8 },
  { id: 'done', label: 'Done' },
];

export const Underline: Story = {
  args: { items: LIST_TABS, variant: 'underline', defaultValue: 'all' },
};

export const Pill: Story = {
  args: { items: [
    { id: 'list', label: 'List' },
    { id: 'board', label: 'Board' },
    { id: 'calendar', label: 'Calendar' },
  ], variant: 'pill', defaultValue: 'list' },
};

export const WithPanels: Story = {
  render: () => {
    const [active, setActive] = useState('all');
    const items = [
      { id: 'all', label: 'All', count: 12 },
      { id: 'today', label: 'Today', count: 4 },
      { id: 'done', label: 'Done' },
    ];
    return (
      <div>
        <Tabs items={items} value={active} onChange={setActive} />
        <TabPanel id="all" activeId={active}><p style={{ fontSize: 14, color: 'var(--pxd-color-text-secondary)' }}>Showing all 12 tasks across all lists.</p></TabPanel>
        <TabPanel id="today" activeId={active}><p style={{ fontSize: 14, color: 'var(--pxd-color-text-secondary)' }}>4 tasks due today.</p></TabPanel>
        <TabPanel id="done" activeId={active}><p style={{ fontSize: 14, color: 'var(--pxd-color-text-secondary)' }}>No completed tasks yet today.</p></TabPanel>
      </div>
    );
  },
  parameters: { docs: { description: { story: 'Tabs + TabPanel with controlled state.' } } },
};

export const WithIcons: Story = {
  args: { items: [
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'lists', label: 'Lists', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ], defaultValue: 'tasks' },
};
