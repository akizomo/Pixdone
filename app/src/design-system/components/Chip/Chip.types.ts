import type { HTMLAttributes, ReactNode } from 'react';

export type ChipVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type ChipSize = 'sm' | 'md';

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: ChipVariant;
  size?: ChipSize;
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children?: ReactNode;
}
