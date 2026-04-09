import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TutorialPanel } from './TutorialPanel';

const meta: Meta<typeof TutorialPanel> = {
  title: 'PixDone/App/TutorialPanel',
  component: TutorialPanel,
  tags: ['autodocs'],
  args: { onSignUp: fn() },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const English: Story = {
  args: {
    headline: "You've completed the tutorial!",
    subtext: 'Sign up to save your own tasks and sync across devices.',
    buttonLabel: 'Sign up',
  },
};

export const Japanese: Story = {
  args: {
    headline: 'チュートリアル完了！',
    subtext: 'サインアップしてタスクを保存し、デバイス間で同期しましょう。',
    buttonLabel: 'サインアップ',
  },
};
