import type { BannerProps } from './Banner.types';
import './Banner.css';

const ICONS = { info: 'ℹ', success: '✓', warning: '⚠', danger: '✕', brand: '★' };

export function Banner({ variant, title, children, dismissible = false, onDismiss, actionLabel, onAction, className = '' }: BannerProps) {
  return (
    <div className={['pxd-banner', `pxd-banner--${variant}`, className].filter(Boolean).join(' ')} role="banner" aria-live="polite">
      <span className="pxd-banner__icon" aria-hidden="true">{ICONS[variant]}</span>
      <div className="pxd-banner__content">
        {title && <span className="pxd-banner__title">{title}</span>}
        {children}
        {actionLabel && <button className="pxd-banner__action" onClick={onAction}>{actionLabel}</button>}
      </div>
      {dismissible && <button className="pxd-banner__dismiss" onClick={onDismiss} aria-label="Dismiss">✕</button>}
    </div>
  );
}
