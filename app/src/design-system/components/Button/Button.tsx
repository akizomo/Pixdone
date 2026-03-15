import { playSound } from '../../../services/sound';
import type { ButtonProps } from './Button.types';
import './Button.css';

const sizeMap = { sm: 'pxd-button--sm', md: 'pxd-button--md', lg: 'pxd-button--lg' } as const;
const variantMap = {
  primary: 'pxd-button--primary',
  secondary: 'pxd-button--secondary',
  ghost: 'pxd-button--ghost',
  danger: 'pxd-button--danger',
  reward: 'pxd-button--reward',
  signup: 'pxd-button--signup',
  icon: 'pxd-button--icon',
} as const;

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  type = 'button',
  className = '',
  onClick,
  ...rest
}: ButtonProps) {
  const classes = [
    'pxd-button',
    sizeMap[size],
    variantMap[variant],
    fullWidth ? 'pxd-button--full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      onClick={(e) => { playSound('buttonClick'); onClick?.(e); }}
      {...rest}
    >
      {loading ? '…' : children}
    </button>
  );
}
