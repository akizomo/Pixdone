import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { SoundKey } from '../../foundations/sound.tokens';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  'aria-label': string;
  icon: ReactNode;
  soundKey?: SoundKey | null;
}
