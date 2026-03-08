import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Components/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: '**Divider** — Visual separator between content sections. Supports horizontal, vertical, and labeled variants. Uses `<hr role="separator">` for semantic correctness.' } } },
};
export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = { args: {} };
export const WithLabel: Story = { args: { label: 'Today' } };
export const SmallSpacing: Story = { args: { spacing: 'sm' } };

export const InContext: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <div style={{ padding: '8px 0', fontSize: 14 }}>Task A</div>
      <Divider spacing="sm" />
      <div style={{ padding: '8px 0', fontSize: 14 }}>Task B</div>
      <Divider label="Yesterday" />
      <div style={{ padding: '8px 0', fontSize: 14 }}>Task C</div>
      <div style={{ padding: '8px 0', fontSize: 14 }}>Task D</div>
    </div>
  ),
};
