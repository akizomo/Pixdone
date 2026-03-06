import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';

const meta: Meta<typeof TextField> = {
  title: 'PixDone/Design System/TextField',
  component: TextField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Enter text' },
};

export const WithLabel: Story = {
  args: { label: 'Email', placeholder: 'you@example.com' },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    value: 'invalid',
    error: 'Please enter a valid email address.',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
    passwordToggle: true,
  },
};

export const Disabled: Story = {
  args: { label: 'Disabled', value: 'Read only', disabled: true },
};
