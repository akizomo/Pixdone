import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RichTextField } from './RichTextField';

const meta: Meta<typeof RichTextField> = {
  title: 'Components/RichTextField',
  component: RichTextField,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof RichTextField>;

export const Default: Story = {
  args: { placeholder: 'Task title' },
  render: (args) => {
    const [value, setValue] = useState(args.value ?? '');
    return <RichTextField {...args} value={value} onChange={setValue} />;
  },
};

export const WithLink: Story = {
  args: { label: 'Title', value: 'Example: [PixDone](https://example.com)' },
  render: (args) => {
    const [value, setValue] = useState(args.value ?? '');
    return <RichTextField {...args} value={value} onChange={setValue} />;
  },
};

export const Error: Story = {
  args: { label: 'Title', value: 'Something', errorText: 'This is an error' },
  render: (args) => {
    const [value, setValue] = useState(args.value ?? '');
    return <RichTextField {...args} value={value} onChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: { label: 'Title', value: 'Disabled', disabled: true },
};

export const Small: Story = {
  args: { label: 'Small', placeholder: 'Subtask…', size: 'sm' },
  render: (args) => {
    const [value, setValue] = useState(args.value ?? '');
    return <RichTextField {...args} value={value} onChange={setValue} />;
  },
};

