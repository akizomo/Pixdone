import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TopAppBar } from './TopAppBar';
import { IconButton } from '../IconButton/IconButton';
import { PixelIcon } from '../PixelIcon/PixelIcon';

const meta: Meta<typeof TopAppBar> = {
  title: 'Design System/TopAppBar',
  component: TopAppBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Platform-aware header for sub pages and detail screens.',
          '',
          '- **ios** — Apple HIG navigation bar: 44pt, centered title, accent-tinted chevron + label back button, hairline separator only when content scrolls under it.',
          '- **material** — Material 3 small top app bar: 64dp, 48dp arrow nav icon, start-aligned title, elevated surface when content scrolls under it.',
          '- **auto** (default) — `ios` on the iOS app / iOS browsers, `material` elsewhere.',
          '',
          'Sticky by default and extends under `safe-area-inset-top`. The back button plays `taskCancel`.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    platform: { control: 'inline-radio', options: ['auto', 'ios', 'material'] },
  },
  args: {
    title: 'ACCOUNT',
    backAriaLabel: 'Back',
    backLabel: 'Back',
    onBack: fn(),
    platform: 'material',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 390, height: 320, overflowY: 'auto', border: '1px solid var(--pd-color-border-default)' }}>
        <Story />
        <div style={{ padding: 16, height: 800, fontFamily: 'var(--pd-font-body)', color: 'var(--pd-color-text-secondary)' }}>
          Scroll to see the scrolled-under state.
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const moreAction = (
  <IconButton variant="ghost" size="md" aria-label="More" icon={<PixelIcon name="menu" size="md" />} />
);

export const Material: Story = {};

export const MaterialWithAction: Story = { args: { actions: moreAction } };

export const IOS: Story = { args: { platform: 'ios' } };

export const IOSWithAction: Story = { args: { platform: 'ios', actions: moreAction } };

export const IOSChevronOnly: Story = { args: { platform: 'ios', backLabel: undefined } };

export const IOSLongTitle: Story = {
  args: { platform: 'ios', title: 'PIXDONE+ BILLING AND SUBSCRIPTION SETTINGS' },
};

export const NoBackButton: Story = { args: { onBack: undefined } };
