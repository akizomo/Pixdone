import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { MiniPlayer } from './MiniPlayer';
import { IconButton } from '../IconButton/IconButton';
import { PixelIcon } from '../PixelIcon/PixelIcon';

const meta: Meta<typeof MiniPlayer> = {
  title: 'Components/MiniPlayer',
  component: MiniPlayer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**When to use:** A long-running activity (the focus timer) continues on another screen — show a persistent mini controller above the mobile bottom navigation, like a music app. **Behavior:** Tapping the title/time opens the full screen; controls go in `actions` (DS `IconButton` size sm, with an `aria-label`). **Layout:** Fixed above the BottomNav; while visible, put `data-mini-player="true"` on the app body so the FAB and scroll area make room. **Sound:** open tap → `buttonClick`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof MiniPlayer>;

type Mode = 'focus' | 'break';

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** The same controls the app puts in `actions` (FocusScreenContainer). */
function TimerActions({ mode, running, onToggle, onComplete, onSkip }: {
  mode: Mode;
  running: boolean;
  onToggle?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
}) {
  return (
    <>
      <IconButton
        variant="secondary"
        size="sm"
        aria-label={running ? 'Pause' : 'Resume'}
        icon={<PixelIcon name={running ? 'pause' : 'play'} />}
        onClick={onToggle}
      />
      {mode === 'break' ? (
        <IconButton variant="ghost" size="sm" soundKey="taskCancel" aria-label="Skip break" icon={<PixelIcon name="skip_next" />} onClick={onSkip} />
      ) : (
        <IconButton variant="ghost" size="sm" soundKey="taskComplete" aria-label="Complete" icon={<PixelIcon name="check" />} onClick={onComplete} />
      )}
    </>
  );
}

interface SimulatorArgs {
  initialMode: Mode;
  /** Seconds left when the story starts. Set it low to see the focus → break switch happen. */
  initialSeconds: number;
  initialRunning: boolean;
}

/** A working focus timer: counts down, pauses/resumes, and switches focus ⇄ break like the app. */
function TimerSimulator({ initialMode, initialSeconds, initialRunning }: SimulatorArgs) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(initialRunning);

  useEffect(() => {
    setMode(initialMode);
    setRemaining(initialSeconds);
    setRunning(initialRunning);
  }, [initialMode, initialSeconds, initialRunning]);

  const switchTo = (next: Mode) => {
    setMode(next);
    setRemaining(next === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && remaining === 0) switchTo(mode === 'focus' ? 'break' : 'focus');
  }, [running, remaining, mode]);

  return (
    <MiniPlayer
      title={mode === 'focus' ? 'Focus' : 'Break'}
      time={formatTime(remaining)}
      openLabel="Open focus timer"
      onOpen={() => {}}
      actions={
        <TimerActions
          mode={mode}
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onComplete={() => switchTo('break')}
          onSkip={() => switchTo('focus')}
        />
      }
    />
  );
}

/**
 * Try it: the time counts down; pause ⇄ resume swaps the icon; ✓ ends focus and starts a break;
 * ⏭ skips the break back to focus. Change `initialSeconds` in Controls to watch the auto switch.
 */
export const Interactive: StoryObj<SimulatorArgs> = {
  args: { initialMode: 'focus', initialSeconds: 10, initialRunning: true },
  argTypes: {
    initialMode: { control: 'inline-radio', options: ['focus', 'break'] },
    initialSeconds: { control: { type: 'number', min: 0, step: 5 } },
  },
  render: (args) => <TimerSimulator {...args} />,
};

/** Plays pause → resume → complete → skip in the Interactions panel. */
export const StateTransitions: StoryObj<SimulatorArgs> = {
  args: { initialMode: 'focus', initialSeconds: FOCUS_SECONDS, initialRunning: true },
  render: (args) => <TimerSimulator {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Pause', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Pause' }));
      await expect(canvas.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    });
    await step('Resume', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Resume' }));
      await expect(canvas.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    });
    await step('Complete focus → break starts', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Complete' }));
      await expect(canvas.getByText('Break')).toBeInTheDocument();
      await expect(canvas.getByText('05:00')).toBeInTheDocument();
    });
    await step('Skip break → focus starts', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Skip break' }));
      await expect(canvas.getByText('Focus')).toBeInTheDocument();
      await expect(canvas.getByText('25:00')).toBeInTheDocument();
    });
  },
};

export const Running: Story = {
  args: {
    title: 'Focus',
    time: '12:34',
    openLabel: 'Open focus timer',
    onOpen: () => {},
    actions: <TimerActions mode="focus" running />,
  },
};

export const Paused: Story = {
  args: {
    title: 'Focus',
    time: '12:34',
    openLabel: 'Open focus timer',
    onOpen: () => {},
    actions: <TimerActions mode="focus" running={false} />,
  },
};

export const Break: Story = {
  args: {
    title: 'Break',
    time: '04:10',
    openLabel: 'Open focus timer',
    onOpen: () => {},
    actions: <TimerActions mode="break" running />,
  },
};

export const WithoutActions: Story = {
  args: { title: 'Focus', time: '25:00', openLabel: 'Open focus timer', onOpen: () => {} },
};
