import { useEffect } from 'react';
import type { ToastProps } from './Toast.types';
import './Toast.css';

const DEFAULT_ICONS = { default: '🔔', success: '✓', warning: '⚠', danger: '✕', reward: '🎉' };

export function Toast({ variant = 'default', title, message, duration = 4000, onDismiss, icon, className = '' }: ToastProps) {
  useEffect(() => {
    if (duration > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div
      className={['pxd-toast', `pxd-toast--${variant}`, className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="pxd-toast__icon" aria-hidden="true">{icon || DEFAULT_ICONS[variant]}</span>
      <div className="pxd-toast__content">
        {title && <div className="pxd-toast__title">{title}</div>}
        <div className="pxd-toast__message">{message}</div>
      </div>
      {onDismiss && (
        <button className="pxd-toast__dismiss" onClick={onDismiss} aria-label="Dismiss notification">✕</button>
      )}
    </div>
  );
}
