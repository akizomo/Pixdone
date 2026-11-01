import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { SoundKey } from '../../foundations/sound.tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerOutline' | 'dangerGhost' | 'reward' | 'signup' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  /** Icon shown before the label (e.g. `<PixelIcon name="pause" />`). Sized to the button size; hidden while `loading`. */
  leadingIcon?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  soundKey?: SoundKey;
}
