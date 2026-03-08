import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Spinner** — Circular loading indicator. **Anatomy:** Container with `role="status"` + animated ring. **Accessibility:** `aria-label` announces the loading state to screen readers. **When to use:** Inline loading (button loading state, content fetch). Use Progress bar for determinate loading. **Reduced motion:** animation pauses; spinner remains visible but static.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    variant: { control: 'select', options: ['default', 'brand', 'inverse'] },
  },
};
export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = { args: { size: 'md', variant: 'default' } };
export const Brand: Story = { args: { size: 'md', variant: 'brand' } };
export const Inverse: Story = {
  args: { size: 'md', variant: 'inverse' },
  decorators: [(Story) => <div style={{ background: 'var(--pxd-color-surface-inverse)', padding: 24, borderRadius: 8, display: 'inline-block' }}><Story /></div>],
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
        <div key={size} style={{ textAlign: 'center' }}>
          <Spinner size={size} variant="brand" />
          <div style={{ fontSize: 11, color: 'var(--pxd-color-text-tertiary)', marginTop: 8 }}>{size}</div>
        </div>
      ))}
    </div>
  ),
};

export const InlineLoading: Story = {
  render: () => (
    <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--pxd-color-brand-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 16px', fontFamily: 'var(--pxd-font-body)', fontWeight: 600, fontSize: 14, cursor: 'not-allowed', opacity: 0.8 }}>
      <Spinner size="sm" variant="inverse" label="Saving" />
      Saving…
    </button>
  ),
  parameters: { docs: { description: { story: 'Spinner inside a button during async action.' } } },
};
