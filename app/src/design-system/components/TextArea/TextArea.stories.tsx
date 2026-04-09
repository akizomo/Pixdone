import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
  title: 'Components/TextArea',
  component: TextArea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**When to use:** Multi-line notes or comments (e.g. task memo). **Accessibility:** Label via `htmlFor`/`id`; helper/error text via `aria-invalid` and `role=\"alert\"`. **Visual:** Same border and focus ring as TextField; vertical resize enabled for longer notes.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  args: { label: 'Notes', placeholder: 'Add notes…' },
};

export const WithHelper: Story = {
  args: {
    label: 'Notes',
    placeholder: 'Add notes…',
    helperText: 'Optional. Add any extra details for this task.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Notes',
    placeholder: 'Add notes…',
    errorText: 'Notes are too long.',
  },
};

