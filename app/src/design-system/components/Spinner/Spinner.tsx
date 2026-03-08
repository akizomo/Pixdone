import type { SpinnerProps } from './Spinner.types';
import './Spinner.css';

export function Spinner({ size = 'md', variant = 'default', label = 'Loading…', className = '' }: SpinnerProps) {
  return (
    <div
      className={['pxd-spinner', `pxd-spinner--${size}`, `pxd-spinner--${variant}`, className].filter(Boolean).join(' ')}
      role="status"
      aria-label={label}
    >
      <span className="pxd-spinner__ring" aria-hidden="true" />
    </div>
  );
}
