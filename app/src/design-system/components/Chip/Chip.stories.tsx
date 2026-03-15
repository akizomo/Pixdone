import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**When to use:** Filters, status labels, tags. **Accessibility:** Removable chips use a button with aria-label="Remove" (min 24px hit area). Selected state is conveyed visually and via aria-selected when used as an option. **Visual:** Compact padding; selected shows focus ring; variants use semantic colors with light tint backgrounds. **Sound (vanilla parity):** Select → `buttonClick`; Remove → `taskCancel`.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['neutral', 'accent', 'success', 'warning', 'danger'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
};
export default meta;

type Story = StoryObj<typeof Chip>;

export const Neutral: Story = { args: { variant: 'neutral', children: 'Neutral' } };
export const Accent: Story = { args: { variant: 'accent', children: 'Accent' } };
export const Success: Story = { args: { variant: 'success', children: 'Done' } };
export const Warning: Story = { args: { variant: 'warning', children: 'Pending' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Error' } };

export const Selected: Story = { args: { variant: 'accent', selected: true, children: 'Selected' } };

export const Removable: Story = {
  args: { variant: 'neutral', removable: true, onRemove: () => {}, children: 'Removable' },
};

export const SizeSm: Story = { args: { size: 'sm', children: 'Small' } };
export const SizeMd: Story = { args: { size: 'md', children: 'Medium' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pxd-space-2)' }}>
      <Chip variant="neutral">Neutral</Chip>
      <Chip variant="accent">Accent</Chip>
      <Chip variant="success">Success</Chip>
      <Chip variant="warning">Warning</Chip>
      <Chip variant="danger">Danger</Chip>
      <Chip variant="accent" selected>Selected</Chip>
      <Chip variant="neutral" removable onRemove={() => {}}>Removable</Chip>
    </div>
  ),
};

export const FilterExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pxd-space-2)' }}>
      <Chip variant="accent" selected>All</Chip>
      <Chip variant="neutral">Active</Chip>
      <Chip variant="neutral">Completed</Chip>
    </div>
  ),
  parameters: { docs: { description: { story: 'Filter chips with one selected.' } } },
};
