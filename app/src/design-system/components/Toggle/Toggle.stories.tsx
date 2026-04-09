import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Design System/Toggle',
  component: Toggle,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Toggle>;

function Controlled(args: React.ComponentProps<typeof Toggle>) {
  const [checked, setChecked] = useState(args.checked ?? false);
  return <Toggle {...args} checked={checked} onChange={setChecked} />;
}

export const Off: Story = {
  render: (args) => <Controlled {...args} />,
  args: { label: 'ACTIVE', showLabel: true, checked: false },
};

export const On: Story = {
  render: (args) => <Controlled {...args} />,
  args: { label: 'ACTIVE', showLabel: true, checked: true },
};

export const Disabled: Story = {
  render: (args) => <Controlled {...args} />,
  args: { label: 'ACTIVE', showLabel: true, checked: true, disabled: true },
};

export const NoLabel: Story = {
  render: (args) => <Controlled {...args} />,
  args: { label: 'Sound', checked: false },
};
