import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';

const meta: Meta<typeof TextField> = {
  title: 'Components/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**When to use:** Form fields for text, email, password, search. **Accessibility:** Associate label via `htmlFor`/`id`; use `aria-describedby` for helper/error; `aria-invalid` when error. **Visual:** Clear default border, stronger border on hover, focus ring (3px soft blue); error state uses danger border and red helper text. Min height 44px for touch.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  args: { placeholder: 'Enter text' },
};

export const WithLabel: Story = {
  args: { label: 'Email', placeholder: 'you@example.com', type: 'email' },
};

export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'username',
    helperText: 'Choose a unique username.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    placeholder: '••••••••',
    type: 'password',
    errorText: 'Password must be at least 8 characters.',
  },
};

export const Disabled: Story = {
  args: { label: 'Disabled', placeholder: 'Disabled field', disabled: true },
};

export const Required: Story = {
  args: { label: 'Required field', placeholder: 'Required', required: true },
};

export const SearchField: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search…',
    type: 'search',
    helperText: 'Search by name or ID.',
  },
};

export const StateComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pxd-space-6)', maxWidth: 320 }}>
      <TextField label="Default" placeholder="Placeholder" />
      <TextField label="Filled" defaultValue="Some value" />
      <TextField label="Error" errorText="This field is required." placeholder="Required" />
      <TextField label="Disabled" placeholder="Disabled" disabled />
    </div>
  ),
  parameters: { docs: { description: { story: 'Default, filled, error, and disabled states.' } } },
};

export const SmallField: Story = {
  args: {
    label: 'Subtask (sm)',
    placeholder: 'Add subtask…',
    size: 'sm',
  },
  parameters: { docs: { description: { story: 'Compact small text field used for subtask input.' } } },
};
