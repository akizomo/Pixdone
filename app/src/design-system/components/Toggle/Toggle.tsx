import { playSound } from '../../../services/sound';
import type { ToggleProps } from './Toggle.types';
import './Toggle.css';

/**
 * Pixel-art toggle switch.
 * ON → plays taskAdd (activating something).
 * OFF → plays taskDelete (deactivating something).
 */
export function Toggle({
  checked,
  onChange,
  label,
  showLabel = false,
  disabled = false,
  className = '',
}: ToggleProps) {
  const handleClick = () => {
    if (disabled) return;
    playSound(checked ? 'taskDelete' : 'taskAdd');
    onChange(!checked);
  };

  const trackClass = [
    'pxd-toggle__track',
    checked ? 'pxd-toggle__track--on' : '',
  ].filter(Boolean).join(' ');

  const thumbClass = [
    'pxd-toggle__thumb',
    checked ? 'pxd-toggle__thumb--on' : '',
  ].filter(Boolean).join(' ');

  const wrapperClass = [
    'pxd-toggle',
    disabled ? 'pxd-toggle--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={wrapperClass}>
      {showLabel && label && (
        <span className="pxd-toggle__label">{label}</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={trackClass}
        onClick={handleClick}
      >
        <span className={thumbClass} />
      </button>
    </span>
  );
}
