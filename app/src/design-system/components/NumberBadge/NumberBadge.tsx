import type { NumberBadgeProps } from './NumberBadge.types';
import './NumberBadge.css';

export function NumberBadge({ count, max = 99, variant = 'brand', size = 'md', dot = false, 'aria-label': ariaLabel, className = '' }: NumberBadgeProps) {
  const display = dot ? '' : count > max ? `${max}+` : String(count);
  const label = ariaLabel || (dot ? 'Notification' : `${count} notification${count !== 1 ? 's' : ''}`);

  if (count === 0 && !dot) return null;

  return (
    <span
      className={['pxd-number-badge', `pxd-number-badge--${variant}`, `pxd-number-badge--${size}`, dot ? 'pxd-number-badge--dot' : '', className].filter(Boolean).join(' ')}
      aria-label={label}
      role="status"
    >
      {display}
    </span>
  );
}
