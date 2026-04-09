import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { SoundKey } from '../../foundations/sound.tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerOutline' | 'reward' | 'signup' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  soundKey?: SoundKey;
}
