import { useState, useId } from 'react';
import type { ToggleProps } from './Toggle.types';
import './Toggle.css';

export function Toggle({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  label,
  labelPosition = 'right',
  'aria-label': ariaLabel,
  className = '',
}: ToggleProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const next = e.target.checked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  const trackClass = ['pxd-toggle__track', isChecked ? 'pxd-toggle__track--checked' : ''].filter(Boolean).join(' ');
  const wrapClass = ['pxd-toggle', disabled ? 'pxd-toggle--disabled' : '', className].filter(Boolean).join(' ');

  const trackEl = (
    <span className={trackClass}>
      <span className="pxd-toggle__thumb" aria-hidden="true" />
    </span>
  );

  return (
    <label className={wrapClass} htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        role="switch"
        className="pxd-toggle__input"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        aria-checked={isChecked}
        aria-label={!label ? ariaLabel : undefined}
      />
      {label && labelPosition === 'left' && <span className="pxd-toggle__label">{label}</span>}
      {trackEl}
      {label && labelPosition === 'right' && <span className="pxd-toggle__label">{label}</span>}
    </label>
  );
}
