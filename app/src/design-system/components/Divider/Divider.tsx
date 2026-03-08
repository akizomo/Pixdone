import type { DividerProps } from './Divider.types';
import './Divider.css';

export function Divider({ orientation = 'horizontal', label, spacing = 'md', className = '' }: DividerProps) {
  if (label) {
    return (
      <div
        className={['pxd-divider', 'pxd-divider--labeled', `pxd-divider--spacing-${spacing}`, className].filter(Boolean).join(' ')}
        role="separator"
        aria-label={label}
      >
        <span className="pxd-divider__label">{label}</span>
      </div>
    );
  }
  return (
    <hr
      className={['pxd-divider', `pxd-divider--${orientation}`, orientation === 'horizontal' ? `pxd-divider--spacing-${spacing}` : '', className].filter(Boolean).join(' ')}
      role="separator"
    />
  );
}
