import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { Button } from '../Button/Button';

const meta: Meta<typeof BottomSheet> = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**When to use:** Mobile-style actions, filters, or supplementary content. **Accessibility:** role="dialog", aria-modal, aria-labelledby when titled; ESC closes; close button has 44px target. **Visual:** Token spacing; handle bar when showHandle; smooth slide-up entrance; overlay fades in. **Sound (vanilla parity):** Close button / ESC → `taskCancel`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof BottomSheet>;

export const BasicSheet: Story = {
  render: function Basic() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open sheet</Button>
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Sheet title">
          <p>Content goes here. Touch-friendly spacing applied.</p>
        </BottomSheet>
      </>
    );
  },
};

export const ActionSheetStyle: Story = {
  render: function Action() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>Options</Button>
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Choose action">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pxd-space-2)' }}>
            <Button variant="primary" fullWidth onClick={() => setOpen(false)}>Save</Button>
            <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>Share</Button>
            <Button variant="ghost" fullWidth onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </BottomSheet>
      </>
    );
  },
};

export const LongContentSheet: Story = {
  render: function Long() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>Open long content</Button>
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Scrollable content">
          <div style={{ paddingBottom: 'var(--pxd-space-6)' }}>
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i}>Paragraph {i + 1}. Lorem ipsum dolor sit amet.</p>
            ))}
          </div>
        </BottomSheet>
      </>
    );
  },
};
