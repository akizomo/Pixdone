import type { ReactNode } from 'react';
import type { SoundKey } from '../../foundations/sound.tokens';

export type ListRowVariant = 'default' | 'danger';

export interface ListRowProps {
  /** PixelIcon name shown on the left. */
  icon?: string;
  label: ReactNode;
  /** Secondary line under the label. */
  description?: ReactNode;
  /**
   * Right-aligned content (Chip group, Toggle, Badge, value text…).
   * When omitted on a navigable row (onClick / href), a chevron is shown.
   */
  trailing?: ReactNode;
  /** Makes the whole row a button. */
  onClick?: () => void;
  /** Makes the whole row an external link (opens in a new tab). */
  href?: string;
  variant?: ListRowVariant;
  /** Sound played on press (navigable rows only). Default: buttonClick. */
  soundKey?: SoundKey;
  disabled?: boolean;
  className?: string;
}
