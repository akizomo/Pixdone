import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import { ChallengeMenu } from './ChallengeMenu';
import { EFFECTS_REGISTRY } from '../data/effectsRegistry';
import type { ActiveChallenge } from '../hooks/useActiveChallenge';

const punch = EFFECTS_REGISTRY.find((e) => e.key === 'fighter_punch')!;

const firstChallenge = (progress: number): ActiveChallenge => ({
  effect: punch,
  progress,
  threshold: 10,
  deadline: new Date(8640000000000000),
  daysLeft: Infinity,
  isUrgent: false,
  isCompleted: progress >= 10,
});

const meta: Meta<typeof ChallengeMenu> = {
  title: 'PixDone/App/ChallengeMenu',
  component: ChallengeMenu,
  parameters: {
    docs: {
      description: {
        component:
          'ヘッダーのチャレンジアイコン（進捗リング）と、開いたときのシート／ダイアログ。最初のチャレンジ（Fighter / Punch・10件・期限なし）。無料ユーザーには一番下に PixDone+ の1行。',
      },
    },
  },
  argTypes: { lang: { control: 'inline-radio', options: ['en', 'ja'] } },
  args: {
    challenges: [firstChallenge(3)],
    lang: 'ja',
    isPremium: false,
    onViewPlus: fn(),
    onPreviewEffect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /チャレンジ|Challenge/ }));
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FreeInProgress: Story = {};
/** 達成した状態（獲得済み＋プレビューが出る） */
export const Completed: Story = { args: { challenges: [firstChallenge(10)] } };
export const PremiumInProgress: Story = { args: { isPremium: true } };
/** アイコンだけ（開かない） */
export const HeaderIcon: Story = { play: async () => {} };
