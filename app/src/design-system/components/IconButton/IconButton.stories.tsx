import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';

const MI = ({ name }: { name: string }) => (
  <span className="material-icons" style={{ fontSize: '1em', lineHeight: 1 }}>{name}</span>
);

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**When to use:** Icon-only actions (close, add, delete, settings). **Accessibility:** `aria-label` is required. Min 44×44px for md/lg; focus-visible shows a 2px ring. **Visual:** Centered icon; same variant/size logic as Button; tactile press scale. **Sound (vanilla parity):** Click → `buttonClick`.',
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
  args: { variant: 'primary', 'aria-label': 'Close', icon: <MI name="close" /> },
};
export const Secondary: Story = {
  args: { variant: 'secondary', 'aria-label': 'Add', icon: <MI name="add" /> },
};
export const Ghost: Story = {
  args: { variant: 'ghost', 'aria-label': 'More options', icon: <MI name="more_vert" /> },
};
export const Danger: Story = {
  args: { variant: 'danger', 'aria-label': 'Delete', icon: <MI name="delete" /> },
};

export const SizeSm: Story = {
  args: { size: 'sm', 'aria-label': 'Close', icon: <MI name="close" /> },
};
export const SizeMd: Story = {
  args: { size: 'md', 'aria-label': 'Close', icon: <MI name="close" /> },
};
export const SizeLg: Story = {
  args: { size: 'lg', 'aria-label': 'Close', icon: <MI name="close" /> },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, 'aria-label': 'Close', icon: <MI name="close" /> },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--pxd-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
      <IconButton variant="primary" aria-label="Close" icon={<MI name="close" />} />
      <IconButton variant="secondary" aria-label="Add" icon={<MI name="add" />} />
      <IconButton variant="ghost" aria-label="More" icon={<MI name="more_vert" />} />
      <IconButton variant="danger" aria-label="Delete" icon={<MI name="delete" />} />
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--pxd-space-4)', alignItems: 'center' }}>
      <IconButton size="sm" variant="secondary" aria-label="Small" icon={<MI name="close" />} />
      <IconButton size="md" variant="secondary" aria-label="Medium" icon={<MI name="close" />} />
      <IconButton size="lg" variant="secondary" aria-label="Large" icon={<MI name="close" />} />
    </div>
  ),
  parameters: { docs: { description: { story: 'Sm 36px, md 44px, lg 48px tap targets.' } } },
};
