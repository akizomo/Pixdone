import type { TagProps } from './Tag.types';
import './Tag.css';

export function Tag({ variant = 'default', dismissible = false, onDismiss, children, className = '' }: TagProps) {
  return (
    <span className={['pxd-tag', `pxd-tag--${variant}`, className].filter(Boolean).join(' ')}>
      {children}
      {dismissible && (
        <button className="pxd-tag__dismiss" onClick={onDismiss} aria-label={`Remove ${typeof children === 'string' ? children : 'tag'}`}>✕</button>
      )}
    </span>
  );
}
