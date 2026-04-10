import type { ButtonHTMLAttributes } from 'react';
import type { SoundKey } from '../../foundations/sound.tokens';

export type CheckboxSize = 'sm' | 'md';

export interface CheckboxProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: CheckboxSize;
  /** Sound to play on toggle. Defaults to 'taskComplete'. Pass null to silence. */
  soundKey?: SoundKey | null;
  className?: string;
}
