import { playSound } from '../../../services/sound';
import { PixelIcon } from '../PixelIcon/PixelIcon';
import type { ListRowProps } from './ListRow.types';
import './ListRow.css';

/**
 * One row of a settings / navigation list.
 * - onClick → the whole row is a <button> (chevron by default)
 * - href    → the whole row is an external <a>
 * - neither → static row; put interactive controls (Toggle, Chip) in `trailing`
 */
export function ListRow({
  icon,
  label,
  description,
  trailing,
  onClick,
  href,
  variant = 'default',
  soundKey = 'buttonClick',
  disabled = false,
  className = '',
}: ListRowProps) {
  const navigable = !!onClick || !!href;
  const classes = [
    'pxd-list-row',
    navigable ? 'pxd-list-row--interactive' : '',
    variant === 'danger' ? 'pxd-list-row--danger' : '',
    disabled ? 'pxd-list-row--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {icon && <PixelIcon name={icon} size="md" className="pxd-list-row__icon" />}
      <span className="pxd-list-row__text">
        <span className="pxd-list-row__label">{label}</span>
        {description && <span className="pxd-list-row__description">{description}</span>}
      </span>
      {trailing !== undefined ? (
        <span className="pxd-list-row__trailing">{trailing}</span>
      ) : navigable ? (
        <PixelIcon name="chevron_right_2" size="sm" className="pxd-list-row__chevron" />
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={disabled || undefined}
        onClick={(e) => {
          if (disabled) { e.preventDefault(); return; }
          if (soundKey) playSound(soundKey);
          onClick?.();
        }}
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        disabled={disabled}
        onClick={() => { if (soundKey) playSound(soundKey); onClick(); }}
      >
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
