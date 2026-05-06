import type { EmptyStateProps } from './EmptyState.types';
import './EmptyState.css';

/**
 * EmptyState — shown when a list has no items.
 *
 * The 'sleeping' variant (default) shows a pixel-art speech bubble with "zzz"
 * — the canonical "all done, take a rest" state from the main app's
 * TasksScreen. The 'ready' variant is a compact text-only layout suitable for
 * first-time / onboarding emptiness.
 */
export function EmptyState({
  variant = 'sleeping',
  title,
  description,
  action,
  className = '',
  ...rest
}: EmptyStateProps) {
  return (
    <div
      className={['pxd-empty-state', className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      {...rest}
    >
      {variant === 'sleeping' && (
        <div className="pxd-empty-state__illustration" aria-hidden="true">
          <div className="pxd-empty-character">
            <div className="pxd-empty-bubble">
              <div className="pxd-empty-bubble__text">zzz...</div>
            </div>
          </div>
        </div>
      )}
      {title ? <p className="pxd-empty-state__title">{title}</p> : null}
      {description ? <p className="pxd-empty-state__description">{description}</p> : null}
      {action ? <div className="pxd-empty-state__action">{action}</div> : null}
    </div>
  );
}
