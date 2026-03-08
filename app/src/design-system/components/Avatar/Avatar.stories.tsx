import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Avatar** — Visual user identifier. Shows image with graceful initials fallback. **Anatomy:** Container (circle or square) + image or initials text. **Accessibility:** Always provide `name` or `aria-label` for screen reader context. The container has `role="img"`. **Sizes:** xs(24) · sm(32) · md(40) · lg(56) · xl(72). **Pixel mode:** adds brand border and shadow for game-style profile displays.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['circle', 'square'] },
  },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithInitials: Story = { args: { name: 'Yuki Tanaka', size: 'md', shape: 'circle' } };
export const WithImage: Story = { args: { src: 'https://i.pravatar.cc/80', name: 'Alex Kim', size: 'md' } };
export const SquareShape: Story = { args: { name: 'Dev Bot', size: 'md', shape: 'square' } };
export const PixelMode: Story = { args: { name: 'Player One', size: 'lg', pixel: true } };

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => (
        <Avatar key={size} size={size} name="Yuki Tanaka" />
      ))}
    </div>
  ),
};

export const GroupStack: Story = {
  render: () => {
    const names = ['Alex Kim', 'Yuki Tanaka', 'Sam Rivera', 'Jordan Lee'];
    return (
      <div style={{ display: 'flex' }}>
        {names.map((name, i) => (
          <div key={name} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: names.length - i }}>
            <Avatar name={name} size="sm" />
          </div>
        ))}
        <div style={{ marginLeft: -8, zIndex: 0 }}>
          <Avatar initials="+3" size="sm" />
        </div>
      </div>
    );
  },
  parameters: { docs: { description: { story: 'Overlapping avatar stack with overflow count.' } } },
};
