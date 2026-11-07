import type { BadgeProps } from './Badge.types';
import './Badge.css';

const variantMap = {
  default: 'pxd-badge--default',
  danger: 'pxd-badge--danger',
  warning: 'pxd-badge--warning',
  success: 'pxd-badge--success',
  common: 'pxd-badge--common',
  rare: 'pxd-badge--rare',
  epic: 'pxd-badge--epic',
} as const;

export function Badge({
  variant = 'default',
  icon,
  children,
  className = '',
  ...rest
}: BadgeProps) {
  const classes = [
    'pxd-badge',
    variantMap[variant],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...rest}>
      {icon && <span className="pxd-badge__icon">{icon}</span>}
      {children}
    </span>
  );
}
