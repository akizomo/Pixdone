import type { ProgressProps } from './Progress.types';
import './Progress.css';

export function Progress({ value, variant = 'default', size = 'md', showLabel = false, label, 'aria-label': ariaLabel, animated = false, className = '' }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={['pxd-progress', className].filter(Boolean).join(' ')}>
      {(showLabel || label) && (
        <div className="pxd-progress__header">
          {label && <span className="pxd-progress__label">{label}</span>}
          {showLabel && <span className="pxd-progress__value">{clamped}%</span>}
        </div>
      )}
      <div
        className={`pxd-progress__track pxd-progress__track--${size}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || label}
      >
        <div
          className={['pxd-progress__fill', `pxd-progress__fill--${variant}`, animated ? 'pxd-progress__fill--animated' : ''].filter(Boolean).join(' ')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
