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
          'Back button + page title row for full-page sub screens (account, pricing, feedback). The back button is a DS ghost `Button` and plays `taskCancel`.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    isJa: { control: 'boolean' },
  },
  args: { title: 'ACCOUNT', isJa: false, onBack: fn() },
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
    await userEvent.click(canvas.getByRole('button', { name: /BACK/ }));
    expect(args.onBack).toHaveBeenCalledOnce();
  },
};

export const Japanese: Story = {
  args: { title: 'アカウント', isJa: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('button', { name: /もどる/ })).toBeTruthy();
  },
};

export const LongTitle: Story = {
  args: { title: 'PIXDONE+ BILLING AND SUBSCRIPTION SETTINGS', isJa: false },
};
