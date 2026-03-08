import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberBadge } from './NumberBadge';

const meta: Meta<typeof NumberBadge> = {
  title: 'Components/NumberBadge',
  component: NumberBadge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**NumberBadge** — Notification count or dot indicator. Typically overlaid on icons or buttons. Hides at count=0. Caps at `max` (default 99) showing "99+". **Anatomy:** Round pill with count or dot. **Accessibility:** `role="status"` with descriptive `aria-label`. **Usage:** Overlay on icon using CSS `position: absolute` in a relative container.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'brand', 'danger', 'success', 'warning'] },
    size: { control: 'select', options: ['sm', 'md'] },
    count: { control: { type: 'number', min: 0, max: 200 } },
  },
};
export default meta;
type Story = StoryObj<typeof NumberBadge>;

export const Default: Story = { args: { count: 5, variant: 'brand' } };
export const MaxCount: Story = { args: { count: 127, max: 99, variant: 'danger' } };
export const DotMode: Story = { args: { count: 1, dot: true, variant: 'danger' } };

export const OnIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      {[
        { label: '🔔', count: 3, variant: 'brand' as const },
        { label: '✉', count: 12, variant: 'danger' as const },
        { label: '📋', count: 0, variant: 'brand' as const },
        { label: '⭐', count: 127, variant: 'warning' as const },
      ].map(({ label, count, variant }) => (
        <div key={label} style={{ position: 'relative', display: 'inline-flex' }}>
          <span style={{ fontSize: 28 }}>{label}</span>
          <div style={{ position: 'absolute', top: -4, right: -8 }}>
            <NumberBadge count={count} variant={variant} size="sm" />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'NumberBadge overlaid on icons using absolute positioning.' } } },
};
