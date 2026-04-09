import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RichTextArea } from './RichTextArea';

const meta: Meta<typeof RichTextArea> = {
  title: 'Components/RichTextArea',
  component: RichTextArea,
};

export default meta;
type Story = StoryObj<typeof RichTextArea>;

export const Default: Story = {
  args: {
    placeholder: 'Notes…',
    value: 'Select this and paste a URL to make a link.',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value ?? '');
    return <RichTextArea {...args} value={value} onChange={setValue} />;
  },
};

export const WithLink: Story = {
  args: {
    label: 'Memo',
    value: 'Example: [PixDone](https://example.com)\nSecond line.',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value ?? '');
    return <RichTextArea {...args} value={value} onChange={setValue} />;
  },
};

export const Error: Story = {
  args: {
    label: 'Memo',
    value: 'Something',
    errorText: 'This is an error',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value ?? '');
    return <RichTextArea {...args} value={value} onChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: {
    label: 'Memo',
    value: 'Disabled text',
    disabled: true,
  },
};

