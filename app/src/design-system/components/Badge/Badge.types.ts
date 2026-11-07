import type { HTMLAttributes, ReactNode } from 'react';

/** `common` / `rare` / `epic` are effect rarities (border + tint use the `--pd-color-rarity-*` tokens). */
export type BadgeVariant = 'default' | 'danger' | 'warning' | 'success' | 'common' | 'rare' | 'epic';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Optional leading icon */
  icon?: ReactNode;
  children: ReactNode;
}
