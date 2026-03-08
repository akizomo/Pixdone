import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Tag** — Compact label for categories, filters, and metadata. Supports dismiss for removable tags. **Vs Badge:** Tags are for categories/filters; Badges are for status/count. **Anatomy:** Container + label text + optional dismiss button. **Accessibility:** Dismiss button has `aria-label` describing what is being removed.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'brand', 'success', 'warning', 'danger', 'info'] },
  },
};
export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = { args: { children: 'Design' } };
export const Brand: Story = { args: { variant: 'brand', children: 'High Priority' } };
export const Dismissible: Story = { args: { children: 'Frontend', dismissible: true } };

export const TagCloud: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[
        { label: 'Design', variant: 'brand' as const },
        { label: 'Frontend', variant: 'info' as const },
        { label: 'Backend', variant: 'default' as const },
        { label: 'Testing', variant: 'warning' as const },
        { label: 'Done', variant: 'success' as const },
        { label: 'Blocked', variant: 'danger' as const },
      ].map(({ label, variant }) => (
        <Tag key={label} variant={variant}>{label}</Tag>
      ))}
    </div>
  ),
};

export const DismissibleGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {['React', 'TypeScript', 'CSS Modules', 'Storybook'].map(tag => (
        <Tag key={tag} dismissible onDismiss={() => alert(`Removed: ${tag}`)}>{tag}</Tag>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'Dismissible tags for filter/input chip patterns.' } } },
};
