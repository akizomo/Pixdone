import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  'aria-label': string;
  icon: ReactNode;
}
