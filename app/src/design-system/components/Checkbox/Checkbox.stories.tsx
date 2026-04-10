import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Design System/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

function Controlled(args: React.ComponentProps<typeof Checkbox>) {
  const [checked, setChecked] = useState(args.checked ?? false);
  return <Checkbox {...args} checked={checked} onChange={setChecked} />;
}

export const Unchecked: Story = {
  render: (args) => <Controlled {...args} />,
  args: { checked: false, 'aria-label': 'Complete task' },
};

export const Checked: Story = {
  render: (args) => <Controlled {...args} />,
  args: { checked: true, 'aria-label': 'Complete task' },
};

export const SizeSm: Story = {
  name: 'Size: sm (18px)',
  render: (args) => <Controlled {...args} />,
  args: { checked: false, size: 'sm', 'aria-label': 'Subtask' },
};

export const SizeMd: Story = {
  name: 'Size: md (24px)',
  render: (args) => <Controlled {...args} />,
  args: { checked: false, size: 'md', 'aria-label': 'Task' },
};

export const AllStates: Story = {
  name: 'All States',
  render: () => {
    const [states, setStates] = useState([false, true, false, true]);
    const toggle = (i: number) => setStates((s) => s.map((v, j) => (j === i ? !v : v)));
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Checkbox size="sm" checked={states[0]} onChange={() => toggle(0)} aria-label="sm unchecked" />
        <Checkbox size="sm" checked={states[1]} onChange={() => toggle(1)} aria-label="sm checked" />
        <Checkbox size="md" checked={states[2]} onChange={() => toggle(2)} aria-label="md unchecked" />
        <Checkbox size="md" checked={states[3]} onChange={() => toggle(3)} aria-label="md checked" />
      </div>
    );
  },
};
