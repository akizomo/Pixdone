import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within, expect } from 'storybook/test';
import { SubPageHeader } from './SubPageHeader';

const meta: Meta<typeof SubPageHeader> = {
  title: 'PixDone/App/SubPageHeader',
  component: SubPageHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Sticky header for full-page sub screens (account, pricing, feedback), built on the DS `TopAppBar`. iOS: HIG navigation bar (centered title, chevron + "Back"). Elsewhere: Material 3 small top app bar (arrow icon, start-aligned title). The back button plays `taskCancel`.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    isJa: { control: 'boolean' },
    platform: { control: 'inline-radio', options: ['auto', 'ios', 'material'] },
  },
  args: { title: 'ACCOUNT', isJa: false, onBack: fn(), platform: 'material' },
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

export const English: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('ACCOUNT')).toBeTruthy();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    expect(args.onBack).toHaveBeenCalledOnce();
  },
};

export const Japanese: Story = {
  args: { title: 'アカウント', isJa: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('button', { name: '戻る' })).toBeTruthy();
  },
};

export const LongTitle: Story = {
  args: { title: 'PIXDONE+ BILLING AND SUBSCRIPTION SETTINGS', isJa: false },
};

export const IOS: Story = {
  args: { platform: 'ios' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('button', { name: 'Back' }).textContent).toContain('Back');
  },
};

export const IOSJapanese: Story = {
  args: { platform: 'ios', title: 'アカウント', isJa: true },
};

export const IOSLongTitle: Story = {
  args: { platform: 'ios', title: 'PIXDONE+ BILLING AND SUBSCRIPTION SETTINGS' },
};
