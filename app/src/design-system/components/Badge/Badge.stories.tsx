import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Badge** — Inline status or category label. Use for: status indicators (info, success, warning, danger), rarity tiers (brand, epic, legendary), and category tags. **Never** use a badge as an interactive element. **Anatomy:** Container (pill) + text. **Accessibility:** Use `aria-label` to describe the status when the badge value alone is not sufficient. Color is supplemented by the label text.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'info', 'success', 'warning', 'danger', 'brand', 'epic', 'legendary'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { variant: 'default', children: 'Default' } };
export const Info: Story = { args: { variant: 'info', children: 'In Progress' } };
export const Success: Story = { args: { variant: 'success', children: 'Complete' } };
export const Warning: Story = { args: { variant: 'warning', children: 'At Risk' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Overdue' } };
export const Brand: Story = { args: { variant: 'brand', children: 'New' } };
export const Epic: Story = { args: { variant: 'epic', children: 'Epic' } };
export const Legendary: Story = { args: { variant: 'legendary', children: 'Legendary' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {(['default', 'info', 'success', 'warning', 'danger', 'brand', 'epic', 'legendary'] as const).map(v => (
        <Badge key={v} variant={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</Badge>
      ))}
    </div>
  ),
};

export const StatusUseCase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { label: 'Design Review', status: 'info', statusText: 'In Progress' },
        { label: 'User Testing', status: 'success', statusText: 'Complete' },
        { label: 'Q3 Launch', status: 'warning', statusText: 'At Risk' },
        { label: 'Legacy Migration', status: 'danger', statusText: 'Blocked' },
      ].map(({ label, status, statusText }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--pxd-color-surface-secondary)', borderRadius: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
          <Badge variant={status as any}>{statusText}</Badge>
        </div>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'Status badges in a task list context.' } } },
};

export const RaritySystem: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Badge variant="default">Common</Badge>
      <Badge variant="info">Rare</Badge>
      <Badge variant="epic">Epic</Badge>
      <Badge variant="legendary">Legendary</Badge>
    </div>
  ),
  parameters: { docs: { description: { story: 'Badge variants mapped to the Pixdone rarity system.' } } },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Badge size="sm" variant="brand">SM</Badge>
      <Badge size="md" variant="brand">MD (Default)</Badge>
    </div>
  ),
};
