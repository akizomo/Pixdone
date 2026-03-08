import type { EmptyStateProps } from './EmptyState.types';
import { Button } from '../Button/Button';
import './EmptyState.css';

export function EmptyState({ icon, title, description, actionLabel, onAction, secondaryActionLabel, onSecondaryAction, className = '' }: EmptyStateProps) {
  return (
    <div className={['pxd-empty-state', className].filter(Boolean).join(' ')} aria-live="polite">
      {icon && <div className="pxd-empty-state__icon" aria-hidden="true">{icon}</div>}
      <h3 className="pxd-empty-state__title">{title}</h3>
      {description && <p className="pxd-empty-state__description">{description}</p>}
      {(actionLabel || secondaryActionLabel) && (
        <div className="pxd-empty-state__actions">
          {actionLabel && <Button variant="primary" onClick={onAction}>{actionLabel}</Button>}
          {secondaryActionLabel && <Button variant="secondary" onClick={onSecondaryAction}>{secondaryActionLabel}</Button>}
        </div>
      )}
    </div>
  );
}
