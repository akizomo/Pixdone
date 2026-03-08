import { useState, useId, useRef, useEffect } from 'react';
import type { CheckboxProps } from './Checkbox.types';
import './Checkbox.css';

export function Checkbox({
  checked,
  defaultChecked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  description,
  'aria-label': ariaLabel,
  id,
  className = '',
}: CheckboxProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;
  const autoId = useId();
  const inputId = id || autoId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const next = e.target.checked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  const boxClass = [
    'pxd-checkbox__box',
    indeterminate ? 'pxd-checkbox__box--indeterminate' : isChecked ? 'pxd-checkbox__box--checked' : '',
  ].filter(Boolean).join(' ');

  return (
    <label className={['pxd-checkbox', disabled ? 'pxd-checkbox--disabled' : '', className].filter(Boolean).join(' ')} htmlFor={inputId}>
      <input
        ref={inputRef}
        type="checkbox"
        id={inputId}
        className="pxd-checkbox__input"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        aria-label={!label ? ariaLabel : undefined}
        aria-checked={indeterminate ? 'mixed' : isChecked}
      />
      <span className={boxClass} />
      {(label || description) && (
        <span className="pxd-checkbox__content">
          {label && <span className="pxd-checkbox__label">{label}</span>}
          {description && <span className="pxd-checkbox__description">{description}</span>}
        </span>
      )}
    </label>
  );
}
