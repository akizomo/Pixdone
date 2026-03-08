import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Textarea** — Multi-line text input with optional character count. **Anatomy:** Label + Textarea + Footer (helper/error + count). **Accessibility:** Label via `htmlFor`. Error uses `aria-invalid` + `aria-describedby`. Count updates in real time. **When to use:** Task descriptions, notes, long-form input. Use `showCount` + `maxLength` when there\'s a limit.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = { args: { label: 'Task description', placeholder: 'Describe this task…', rows: 3 } };
export const WithHelper: Story = { args: { label: 'Notes', helperText: 'These notes are only visible to you.', rows: 3 } };
export const WithCount: Story = { args: { label: 'Task description', maxLength: 200, showCount: true, rows: 4 } };
export const ErrorState: Story = { args: { label: 'Task description', error: true, errorMessage: 'Description cannot be empty.', rows: 3 } };
export const Disabled: Story = { args: { label: 'Notes', disabled: true, defaultValue: 'This field is read-only.', rows: 3 } };
