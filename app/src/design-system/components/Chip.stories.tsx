import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  title: 'PixDone/Design System/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    selected: { control: 'boolean' },
  },
  args: { onClick: fn() },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Unselected: Story = {
  args: { children: 'En', selected: false },
};

export const Selected: Story = {
  args: { children: 'Ja', selected: true },
};

export const LanguageChips: Story = {
  render: () => (
    <div className="flex gap-2">
      <Chip selected>En</Chip>
      <Chip selected={false}>Ja</Chip>
    </div>
  ),
};
