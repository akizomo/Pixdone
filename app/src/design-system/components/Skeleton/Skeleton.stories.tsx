import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Skeleton** — Animated loading placeholder that mirrors content structure. **Anatomy:** Single span with shimmer gradient + `role="status"`. Multi-line text uses a wrapper div. **Accessibility:** `aria-label="Loading…"` announces loading state. Shimmer animation pauses with reduced-motion preference. **Best practice:** Match skeleton dimensions to actual content to reduce layout shift.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['text', 'rect', 'circle'] },
  },
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const TextLine: Story = { args: { variant: 'text', width: 200 } };
export const MultipleLines: Story = { args: { variant: 'text', lines: 3 } };
export const Rectangle: Story = { args: { variant: 'rect', width: 240, height: 140 } };
export const Circle: Story = { args: { variant: 'circle', width: 48, height: 48 } };

export const CardSkeleton: Story = {
  render: () => (
    <div style={{ background: 'var(--pxd-color-surface-primary)', borderRadius: 8, border: '1px solid var(--pxd-color-border-subtle)', padding: 20, maxWidth: 340 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <Skeleton variant="circle" width={40} height={40} />
        <div style={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rect" height={100} />
      <div style={{ marginTop: 12 }}>
        <Skeleton variant="text" lines={2} />
      </div>
    </div>
  ),
  parameters: { docs: { description: { story: 'Card-shaped skeleton matching a task card layout.' } } },
};

export const ListSkeleton: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--pxd-color-border-subtle)' }}>
          <Skeleton variant="rect" width={16} height={16} />
          <Skeleton variant="text" width={`${60 + i * 8}%`} />
        </div>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'Task list loading skeleton.' } } },
};
