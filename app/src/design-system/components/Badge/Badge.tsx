import type { BadgeProps } from './Badge.types';
import './Badge.css';

const variantMap = {
  default: 'pxd-badge--default',
  info: 'pxd-badge--info',
  success: 'pxd-badge--success',
  warning: 'pxd-badge--warning',
  danger: 'pxd-badge--danger',
  brand: 'pxd-badge--brand',
  epic: 'pxd-badge--epic',
  legendary: 'pxd-badge--legendary',
} as const;

const sizeMap = { sm: 'pxd-badge--sm', md: 'pxd-badge--md' } as const;

export function Badge({ variant = 'default', size = 'md', children, className = '', ...rest }: BadgeProps) {
  return (
    <span className={['pxd-badge', sizeMap[size], variantMap[variant], className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}
