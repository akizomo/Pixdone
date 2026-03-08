import type { AlertProps } from './Alert.types';
import './Alert.css';

const ICONS = { info: 'ℹ', success: '✓', warning: '⚠', danger: '✕' };

export function Alert({ variant, title, children, dismissible = false, onDismiss, className = '' }: AlertProps) {
  return (
    <div
      className={['pxd-alert', `pxd-alert--${variant}`, className].filter(Boolean).join(' ')}
      role="alert"
      aria-live="polite"
    >
      <span className="pxd-alert__icon" aria-hidden="true">{ICONS[variant]}</span>
      <div className="pxd-alert__content">
        {title && <div className="pxd-alert__title">{title}</div>}
        <div className="pxd-alert__body">{children}</div>
      </div>
      {dismissible && (
        <button className="pxd-alert__dismiss" onClick={onDismiss} aria-label="Dismiss alert">✕</button>
      )}
    </div>
  );
}
