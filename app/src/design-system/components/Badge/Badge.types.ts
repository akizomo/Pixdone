import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'default' | 'danger' | 'warning' | 'success';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Optional leading icon */
  icon?: ReactNode;
  children: ReactNode;
}
