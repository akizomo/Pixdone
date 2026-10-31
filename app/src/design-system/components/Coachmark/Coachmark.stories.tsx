import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Coachmark } from './Coachmark';
import { Chip } from '../Chip/Chip';
import { Button } from '../Button/Button';
import type { CoachmarkPlacement } from './Coachmark.types';

const meta: Meta<typeof Coachmark> = {
  title: 'Components/Coachmark',
  component: Coachmark,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**When to use:** Point at an existing element once to introduce it (e.g. the Smash List tab at the end of onboarding). **Non-modal:** no backdrop; the first tap anywhere or Escape dismisses it, and the tap still reaches its target. **Positioning:** Floating UI with flip + shift; the arrow follows the anchor. Keep copy to one or two short lines.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Coachmark>;

function Demo({ placement }: { placement?: CoachmarkPlacement }) {
  const [anchorEl, setAnchorEl] = useState<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(true);
  return (
    <div style={{ padding: '120px 160px' }}>
      <span ref={setAnchorEl}>
        <Chip>💥 Smash List</Chip>
      </span>
      {!open && <Button variant="secondary" onClick={() => setOpen(true)}>Show again</Button>}
      {open && (
        <Coachmark anchorEl={anchorEl} placement={placement} onDismiss={() => setOpen(false)}>
          {'ただ潰したい日は、ここへ。\n何度でも、潰し放題。'}
        </Coachmark>
      )}
    </div>
  );
}

export const Bottom: Story = { render: () => <Demo /> };
export const Top: Story = { render: () => <Demo placement="top" /> };
export const Right: Story = { render: () => <Demo placement="right" /> };
