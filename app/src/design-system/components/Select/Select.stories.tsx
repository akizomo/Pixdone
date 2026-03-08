import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Select** — Native `<select>` with custom styling. Preserves native accessibility and keyboard behaviour. **Anatomy:** Label + Container + Native select + Chevron icon + Error message. **Accessibility:** Label associated via `htmlFor`. Error state sets `aria-invalid` and `aria-describedby` linking to error message. **When to use:** 5+ options, known list (not free-text).',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Select>;

const LIST_OPTIONS = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'learning', label: 'Learning' },
];

export const Default: Story = { args: { options: LIST_OPTIONS, label: 'Assign to list', placeholder: 'Select a list…', defaultValue: '' } };
export const WithValue: Story = { args: { options: LIST_OPTIONS, label: 'Assign to list', value: 'work', onChange: () => {} } };
export const ErrorState: Story = { args: { options: LIST_OPTIONS, label: 'Assign to list', error: true, errorMessage: 'Please select a list before continuing.' } };
export const Disabled: Story = { args: { options: LIST_OPTIONS, label: 'Assign to list', disabled: true, defaultValue: 'work' } };
