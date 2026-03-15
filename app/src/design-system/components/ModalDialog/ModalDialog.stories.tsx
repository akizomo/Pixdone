import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ModalDialog } from './ModalDialog';
import { Button } from '../Button/Button';

const meta: Meta<typeof ModalDialog> = {
  title: 'Components/ModalDialog',
  component: ModalDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**When to use:** Confirmations, forms, or focused content that must block the page. **Accessibility:** role="dialog", aria-modal, aria-labelledby/describedby; ESC closes; focus moves to first focusable inside; overlay click optional. **Visual:** Token spacing for title, description, body, actions; subtle open animation (opacity + scale). **Sound (vanilla parity):** Overlay click / ESC close → `taskCancel`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ModalDialog>;

export const BasicDialog: Story = {
  render: function Basic() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open dialog</Button>
        <ModalDialog open={open} onClose={() => setOpen(false)} title="Basic dialog">
          <p>This is the dialog body. You can put any content here.</p>
        </ModalDialog>
      </>
    );
  },
};

export const ConfirmationDialog: Story = {
  render: function Confirm() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
        <ModalDialog
          open={open}
          onClose={() => setOpen(false)}
          title="Delete item?"
          description="This action cannot be undone."
          actions={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setOpen(false)}>Delete</Button>
            </>
          }
        >
          <p>Are you sure you want to delete this item?</p>
        </ModalDialog>
      </>
    );
  },
};

export const LongContentDialog: Story = {
  render: function Long() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>Open long content</Button>
        <ModalDialog
          open={open}
          onClose={() => setOpen(false)}
          title="Terms and conditions"
          actions={<Button variant="primary" onClick={() => setOpen(false)}>I agree</Button>}
        >
          <div style={{ maxHeight: 280, overflow: 'auto' }}>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
            <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
          </div>
        </ModalDialog>
      </>
    );
  },
};
