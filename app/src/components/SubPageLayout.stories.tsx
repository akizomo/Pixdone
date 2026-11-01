import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within, expect } from 'storybook/test';
import { SubPageLayout } from './SubPageLayout';

const meta: Meta<typeof SubPageLayout> = {
  title: 'PixDone/App/SubPageLayout',
  component: SubPageLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-page sub screen (account, pricing, feedback): a fixed DS `TopAppBar` above a scrolling body. The bar sits outside the scroll container, so it never moves. iOS: HIG navigation bar (centered title, chevron + "Back"). Elsewhere: Material 3 small top app bar. Back plays `taskCancel`.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    isJa: { control: 'boolean' },
    platform: { control: 'inline-radio', options: ['auto', 'ios', 'material'] },
  },
  args: {
    title: 'ACCOUNT',
    isJa: false,
    onBack: fn(),
    platform: 'material',
    children: (
      <div style={{ padding: '24px 0', height: 1200, fontFamily: 'var(--pd-font-body)', color: 'var(--pd-color-text-secondary)' }}>
        Scroll — the bar stays put.
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 390, height: 480, display: 'flex', flexDirection: 'column', ['--pd-main-gutter' as string]: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Material: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('heading', { name: 'ACCOUNT' })).toBeTruthy();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    expect(args.onBack).toHaveBeenCalledOnce();
  },
};

export const MaterialJapanese: Story = {
  args: { title: 'アカウント', isJa: true },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole('button', { name: '戻る' })).toBeTruthy();
  },
};

export const IOS: Story = { args: { platform: 'ios' } };

export const IOSJapanese: Story = { args: { platform: 'ios', title: 'アカウント', isJa: true } };

export const IOSLongTitle: Story = {
  args: { platform: 'ios', title: 'PIXDONE+ BILLING AND SUBSCRIPTION SETTINGS' },
};
