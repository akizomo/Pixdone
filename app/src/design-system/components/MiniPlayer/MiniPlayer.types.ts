import type { HTMLAttributes, ReactNode } from 'react';
import type { SoundKey } from '../../foundations/sound.tokens';

export interface MiniPlayerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** Short label for what is running, e.g. "Focus" or "Break". */
  title: string;
  /** Pre-formatted time/progress text shown next to the title, e.g. "12:34". */
  time: string;
  /** Accessible name for the tappable area that opens the full screen. */
  openLabel: string;
  /** Called when the title/time area is tapped (typically: go to the full screen). */
  onOpen: () => void;
  /** Control buttons on the right (use DS `Button` size="sm"). */
  actions?: ReactNode;
  /** True while the bottom nav is slid away (hide-on-scroll): the player drops to the screen edge. */
  navHidden?: boolean;
  /** Sound for the open tap. `null` disables it. */
  soundKey?: SoundKey | null;
}
