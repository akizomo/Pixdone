import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Visual / layout convention the bar follows.
 * - `ios`: Apple HIG navigation bar — 44pt, centered title, chevron + text back button.
 * - `material`: Material 3 small top app bar — 64dp, leading arrow icon, start-aligned title.
 * - `auto`: `ios` on iOS (native app or iOS browser), `material` everywhere else.
 */
export type TopAppBarPlatform = 'auto' | 'ios' | 'material';

export interface TopAppBarProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Screen title. Truncated with an ellipsis when it does not fit. */
  title: ReactNode;
  /** Shows the back affordance when set. Plays `taskCancel`. */
  onBack?: () => void;
  /**
   * iOS only: text next to the back chevron (HIG: the previous screen's title, or "Back").
   * Omit to show the chevron alone.
   */
  backLabel?: string;
  /** Accessible name of the back button (used on both platforms). */
  backAriaLabel: string;
  /** Trailing content (IconButtons, Toggle, status text...). */
  actions?: ReactNode;
  /** Default `auto`. */
  platform?: TopAppBarPlatform;
  /**
   * Stick to the top of the nearest scroll container (default `true`).
   * The bar watches that container and shows its scrolled state
   * (iOS: hairline separator, Material: elevated surface) once content scrolls under it.
   */
  sticky?: boolean;
}
