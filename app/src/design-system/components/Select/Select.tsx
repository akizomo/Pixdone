import { useState, useId } from 'react';
import type { SelectProps } from './Select.types';
import './Select.css';

export function Select({ options, value, defaultValue = '', placeholder, onChange, disabled = false, error = false, errorMessage, label, id, className = '' }: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;
  const autoId = useId();
  const inputId = id || autoId;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  return (
    <div className={['pxd-select-wrapper', className].filter(Boolean).join(' ')}>
      {label && <label className="pxd-select__label" htmlFor={inputId}>{label}</label>}
      <div className="pxd-select__container">
        <select
          id={inputId}
          className={['pxd-select', error ? 'pxd-select--error' : ''].filter(Boolean).join(' ')}
          value={selectedValue}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={error && errorMessage ? `${inputId}-error` : undefined}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
          ))}
        </select>
        <span className="pxd-select__chevron" aria-hidden="true">▼</span>
      </div>
      {error && errorMessage && <span id={`${inputId}-error`} className="pxd-select__error-msg" role="alert">{errorMessage}</span>}
    </div>
  );
}
