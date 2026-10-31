import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within, expect } from 'storybook/test';
import { useState } from 'react';
import { DetailViewHeader } from './SubPageHeader';
import { Toggle } from '../design-system';

const meta: Meta<typeof DetailViewHeader> = {
  title: 'PixDone/App/DetailViewHeader',
  component: DetailViewHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Icon-only back button + title bar for full-screen detail overlays (effect / theme detail). Right-aligned content is passed as `children`. The back button is a DS `IconButton` (44px tap target) and plays `taskCancel`.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    isJa: { control: 'boolean' },
  },
  args: { title: 'BOMB', isJa: false, onBack: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 375 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('BOMB')).toBeTruthy();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    expect(args.onBack).toHaveBeenCalledOnce();
  },
};

export const Japanese: Story = {
  args: { title: '🌲 FORESTBIT', isJa: true },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole('button', { name: '戻る' })).toBeTruthy();
  },
};

function RarityAndToggle() {
  const [active, setActive] = useState(true);
  return (
    <>
      <span style={{ fontFamily: 'var(--pd-font-brand)', fontSize: 'var(--pd-font-size-sm)', letterSpacing: 1, color: 'var(--pd-color-accent-default)', flexShrink: 0 }}>
        EPIC
      </span>
      <Toggle checked={active} onChange={setActive} label="ACTIVE" />
    </>
  );
}

/** Same layout as the effect detail screen: rarity label + active toggle on the right. */
export const WithRarityAndToggle: Story = {
  render: (args) => (
    <DetailViewHeader {...args}>
      <RarityAndToggle />
    </DetailViewHeader>
  ),
};

export const LongTitleWithTrailing: Story = {
  args: { title: 'VERY LONG EFFECT NAME THAT MUST TRUNCATE GRACEFULLY' },
  render: (args) => (
    <DetailViewHeader {...args}>
      <RarityAndToggle />
    </DetailViewHeader>
  ),
};
