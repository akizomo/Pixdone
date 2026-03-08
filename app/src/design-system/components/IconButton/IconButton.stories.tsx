import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';

const CloseIcon = () => <span aria-hidden>×</span>;
const PlusIcon = () => <span aria-hidden>+</span>;
const TrashIcon = () => <span aria-hidden>🗑</span>;

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**When to use:** Icon-only actions (close, add, delete, settings). **Accessibility:** `aria-label` is required. Min 44×44px for md/lg; focus-visible shows a 2px ring. **Visual:** Centered icon; same variant/size logic as Button; tactile press scale.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};
export default meta;

type Story = StoryObj<typeof IconButton>;

export const Primary: Story = {
  args: { variant: 'primary', 'aria-label': 'Close', icon: <CloseIcon /> },
};
export const Secondary: Story = {
  args: { variant: 'secondary', 'aria-label': 'Add', icon: <PlusIcon /> },
};
export const Ghost: Story = {
  args: { variant: 'ghost', 'aria-label': 'More options', icon: <CloseIcon /> },
};
export const Danger: Story = {
  args: { variant: 'danger', 'aria-label': 'Delete', icon: <TrashIcon /> },
};

export const SizeSm: Story = {
  args: { size: 'sm', 'aria-label': 'Close', icon: <CloseIcon /> },
};
export const SizeMd: Story = {
  args: { size: 'md', 'aria-label': 'Close', icon: <CloseIcon /> },
};
export const SizeLg: Story = {
  args: { size: 'lg', 'aria-label': 'Close', icon: <CloseIcon /> },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, 'aria-label': 'Close', icon: <CloseIcon /> },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--pxd-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
      <IconButton variant="primary" aria-label="Close" icon={<CloseIcon />} />
      <IconButton variant="secondary" aria-label="Add" icon={<PlusIcon />} />
      <IconButton variant="ghost" aria-label="More" icon={<CloseIcon />} />
      <IconButton variant="danger" aria-label="Delete" icon={<TrashIcon />} />
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--pxd-space-4)', alignItems: 'center' }}>
      <IconButton size="sm" variant="secondary" aria-label="Small" icon={<CloseIcon />} />
      <IconButton size="md" variant="secondary" aria-label="Medium" icon={<CloseIcon />} />
      <IconButton size="lg" variant="secondary" aria-label="Large" icon={<CloseIcon />} />
    </div>
  ),
  parameters: { docs: { description: { story: 'Sm 36px, md 44px, lg 48px tap targets.' } } },
};
