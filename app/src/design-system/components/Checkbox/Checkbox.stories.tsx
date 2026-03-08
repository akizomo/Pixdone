import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Checkbox** — Multi-select form control with tri-state support (unchecked, checked, indeterminate). **Anatomy:** Hidden native input + Custom visual box + Label + Description. **Accessibility:** Associated via `<label>`. Indeterminate state uses `aria-checked="mixed"`. Focus ring on the custom box. **When to use:** Form multi-select, feature lists, task selection, permission grants.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = { args: { label: 'I agree to the terms' } };
export const Checked: Story = { args: { checked: true, label: 'Notifications enabled', onChange: () => {} } };
export const Indeterminate: Story = { args: { indeterminate: true, label: 'Select all tasks' } };
export const WithDescription: Story = { args: { label: 'Daily digest emails', description: 'Receive a summary of your task completions every day at 8 AM.' } };
export const Disabled: Story = { args: { disabled: true, label: 'Premium feature' } };
export const DisabledChecked: Story = { args: { disabled: true, checked: true, label: 'Required consent', onChange: () => {} } };

export const TaskList: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Checkbox label="Design final mockups" checked={true} onChange={() => {}} />
      <Checkbox label="Run usability testing" />
      <Checkbox label="Write documentation" />
      <Checkbox label="Ship to production" disabled />
    </div>
  ),
  parameters: { docs: { description: { story: 'Checkboxes in a task list with mixed states.' } } },
};

export const SelectAll: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Checkbox label="Select all (3 of 5 selected)" indeterminate />
      <div style={{ paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Checkbox label="Task Alpha" checked={true} onChange={() => {}} />
        <Checkbox label="Task Beta" checked={true} onChange={() => {}} />
        <Checkbox label="Task Gamma" checked={true} onChange={() => {}} />
        <Checkbox label="Task Delta" />
        <Checkbox label="Task Epsilon" />
      </div>
    </div>
  ),
  parameters: { docs: { description: { story: 'Parent checkbox with indeterminate state drives child selection.' } } },
};
