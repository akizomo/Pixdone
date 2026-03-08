import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListItem } from './ListItem';
import { Badge } from '../Badge/Badge';
import { Avatar } from '../Avatar/Avatar';

const meta: Meta<typeof ListItem> = {
  title: 'Components/ListItem',
  component: ListItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**ListItem** — Flexible row component for lists, menus, and settings panels. **Anatomy:** Leading + Content (label + description) + Trailing. All sections optional. **Accessibility:** Interactive mode uses `role="button"` with keyboard support. `aria-selected` for selection state. **Use in:** Navigation menus, settings lists, task lists, option lists.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ListItem>;

export const Basic: Story = { args: { label: 'Complete onboarding' } };
export const WithDescription: Story = { args: { label: 'Design review', description: 'Due today · Work list' } };
export const Selected: Story = { args: { label: 'Work tasks', interactive: true, selected: true } };
export const Disabled: Story = { args: { label: 'Premium feature', description: 'Upgrade to access', disabled: true } };

export const WithLeadingAndTrailing: Story = {
  render: () => (
    <div style={{ background: 'var(--pxd-color-surface-primary)', borderRadius: 8, border: '1px solid var(--pxd-color-border-subtle)', overflow: 'hidden' }}>
      {[
        { label: 'Yuki Tanaka', description: '3 tasks today', trailing: <Badge variant="success">Active</Badge> },
        { label: 'Alex Kim', description: '1 task today', trailing: <Badge variant="default">Idle</Badge> },
        { label: 'Sam Rivera', description: '0 tasks today', trailing: <Badge variant="warning">At Risk</Badge> },
      ].map(({ label, description, trailing }) => (
        <ListItem
          key={label}
          label={label}
          description={description}
          leading={<Avatar name={label} size="sm" />}
          trailing={trailing}
          interactive
        />
      ))}
    </div>
  ),
};

export const SettingsList: Story = {
  render: () => (
    <div style={{ background: 'var(--pxd-color-surface-primary)', borderRadius: 8, border: '1px solid var(--pxd-color-border-subtle)', overflow: 'hidden' }}>
      {['Profile', 'Notifications', 'Privacy', 'Help & Feedback', 'Sign out'].map((label, i) => (
        <div key={label} style={{ borderBottom: i < 4 ? '1px solid var(--pxd-color-border-subtle)' : 'none' }}>
          <ListItem label={label} interactive trailing={<span style={{ color: 'var(--pxd-color-text-tertiary)', fontSize: 14 }}>›</span>} />
        </div>
      ))}
    </div>
  ),
};
