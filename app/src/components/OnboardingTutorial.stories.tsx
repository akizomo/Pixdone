import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, within, expect } from 'storybook/test';
import { OnboardingTutorial } from './OnboardingTutorial';

const meta: Meta<typeof OnboardingTutorial> = {
  title: 'PixDone/App/OnboardingTutorial',
  component: OnboardingTutorial,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'First-run tutorial. Splash → story → smash 3 dummy tasks (Common → Rare → Epic) → **first mission** (clear 10 of your own tasks to earn Fighter / Punch) → first-task tour. No PixDone+ pitch here — PixDone+ is mentioned only when the first mission is complete. Check with the toolbar **Safe Area → iPhone**.',
      },
    },
  },
  argTypes: {
    lang: { control: 'inline-radio', options: ['en', 'ja'] },
    initialStep: { control: 'select', options: ['splash', 'intro', 'smash', 'mission'] },
  },
  args: {
    themeKey: 'arcade',
    lang: 'ja',
    onDone: fn(),
    onReachMission: fn(),
    onEnterFirstTask: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/** 最初の任務（ダミー3件を消した直後の画面） */
export const Mission: Story = {
  args: { initialStep: 'mission' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(await canvas.findByText('0 / 10')).toBeTruthy();
    expect(canvas.getByRole('button', { name: '任務を受ける' })).toBeTruthy();
    expect(args.onReachMission).toHaveBeenCalledTimes(1);
  },
};

export const MissionEnglish: Story = {
  args: { initialStep: 'mission', lang: 'en' },
};

/** 最初から通しで見る */
export const FullFlow: Story = {
  args: { initialStep: 'splash' },
};
