import { playSound } from '../../../services/sound';
import type { IconButtonProps } from './IconButton.types';
import './IconButton.css';

const sizeMap = { sm: 'pxd-icon-button--sm', md: 'pxd-icon-button--md', lg: 'pxd-icon-button--lg' } as const;
const variantMap = {
  primary: 'pxd-icon-button--primary',
  secondary: 'pxd-icon-button--secondary',
  ghost: 'pxd-icon-button--ghost',
  danger: 'pxd-icon-button--danger',
} as const;

export function IconButton({
  variant = 'primary',
  size = 'md',
  disabled = false,
  'aria-label': ariaLabel,
  icon,
  className = '',
  onClick,
  ...rest
}: IconButtonProps) {
  const classes = ['pxd-icon-button', sizeMap[size], variantMap[variant], className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={(e) => { playSound('buttonClick'); onClick?.(e); }}
      {...rest}
    >
      <span className="pxd-icon-button__icon" aria-hidden>
        {icon}
      </span>
    </button>
  );
}
