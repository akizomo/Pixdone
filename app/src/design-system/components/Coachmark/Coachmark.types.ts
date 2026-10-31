import type { ReactNode } from 'react';
import type { Placement } from '@floating-ui/react';

export type CoachmarkPlacement = Placement;

export interface CoachmarkProps {
  /** Element the bubble points at. Nothing renders while this is null. */
  anchorEl: HTMLElement | null;
  /** Bubble content — keep it to one or two short lines. */
  children: ReactNode;
  /**
   * Called on the first tap anywhere (including the anchor itself) or Escape.
   * The tap is not swallowed, so it still reaches whatever was tapped.
   */
  onDismiss: () => void;
  /** Preferred side; flips automatically when there is no room. @default 'bottom' */
  placement?: CoachmarkPlacement;
  /** Additional className on the bubble. */
  className?: string;
}
