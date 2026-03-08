import type { ListItemProps } from './ListItem.types';
import './ListItem.css';

export function ListItem({ label, description, leading, trailing, interactive = false, selected = false, disabled = false, onClick, className = '' }: ListItemProps) {
  const classes = [
    'pxd-list-item',
    interactive ? 'pxd-list-item--interactive' : '',
    selected ? 'pxd-list-item--selected' : '',
    disabled ? 'pxd-list-item--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive && !disabled ? 0 : undefined}
      aria-selected={interactive ? selected : undefined}
      aria-disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={interactive && !disabled && onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {leading && <div className="pxd-list-item__leading">{leading}</div>}
      <div className="pxd-list-item__content">
        <div className="pxd-list-item__label">{label}</div>
        {description && <div className="pxd-list-item__description">{description}</div>}
      </div>
      {trailing && <div className="pxd-list-item__trailing">{trailing}</div>}
    </div>
  );
}
