import type { HTMLAttributes, ReactNode } from 'react';

export type ChipVariant = 'neutral' | 'ghost' | 'accent' | 'success' | 'warning' | 'danger';
export type ChipSize = 'sm' | 'md';
export type ChipFont = 'brand' | 'body';

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: ChipVariant;
  size?: ChipSize;
  /** Font family. 'brand' = pixel font (default), 'body' = readable body font */
  font?: ChipFont;
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children?: ReactNode;
}
