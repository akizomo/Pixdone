import type { Meta, StoryObj } from '@storybook/react-vite';
import { MiniPlayer } from './MiniPlayer';
import { Button } from '../Button/Button';

const meta: Meta<typeof MiniPlayer> = {
  title: 'Components/MiniPlayer',
  component: MiniPlayer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**When to use:** A long-running activity (the focus timer) continues on another screen — show a persistent mini controller above the mobile bottom navigation, like a music app. **Behavior:** Tapping the title/time opens the full screen; controls go in `actions` (DS `Button` size sm). **Layout:** Fixed above the BottomNav; while visible, put `data-mini-player="true"` on the app body so the FAB and scroll area make room. **Sound:** open tap → `buttonClick`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof MiniPlayer>;

const actions = (
  <>
    <Button variant="secondary" size="sm">Pause</Button>
    <Button variant="ghost" size="sm">Complete</Button>
  </>
);

export const Running: Story = {
  args: { title: 'Focus', time: '12:34', openLabel: 'Open focus timer', onOpen: () => {}, actions },
};

export const Break: Story = {
  args: {
    title: 'Break',
    time: '04:10',
    openLabel: 'Open focus timer',
    onOpen: () => {},
    actions: (
      <>
        <Button variant="secondary" size="sm">Pause</Button>
        <Button variant="ghost" size="sm">Skip</Button>
      </>
    ),
  },
};

export const WithoutActions: Story = {
  args: { title: 'Focus', time: '25:00', openLabel: 'Open focus timer', onOpen: () => {} },
};
