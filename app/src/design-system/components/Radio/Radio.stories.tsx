import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup } from './Radio';

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**RadioGroup** — Single-select option group wrapped in a semantic `<fieldset>`. **Anatomy:** Fieldset + Legend + Radio items (hidden input + circle + label + description). **Accessibility:** Uses native radio semantics. Group is navigable via arrow keys. Checked state is communicated via `aria-checked`. Always provide a `legend` for screen reader context.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof RadioGroup>;

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', description: 'Can be done whenever' },
  { value: 'medium', label: 'Medium', description: 'Should be done this week' },
  { value: 'high', label: 'High', description: 'Must be done today' },
  { value: 'critical', label: 'Critical', description: 'Drop everything and do this now', disabled: false },
];

export const Vertical: Story = {
  args: { name: 'priority', options: PRIORITY_OPTIONS, legend: 'Task Priority', defaultValue: 'medium' },
};

export const Horizontal: Story = {
  args: { name: 'view', options: [
    { value: 'list', label: 'List' },
    { value: 'board', label: 'Board' },
    { value: 'calendar', label: 'Calendar' },
  ], orientation: 'horizontal', legend: 'View mode', defaultValue: 'list' },
};

export const WithDisabled: Story = {
  args: { name: 'plan', options: [
    { value: 'free', label: 'Free', description: '3 lists, 10 tasks' },
    { value: 'pro', label: 'Pro', description: 'Unlimited everything' },
    { value: 'enterprise', label: 'Enterprise', description: 'Custom pricing', disabled: true },
  ], legend: 'Select a plan', defaultValue: 'free' },
};
