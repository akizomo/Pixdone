import { useId } from 'react';
import type { SelectProps } from './Select.types';
import './Select.css';

export function Select({
  label,
  options,
  value,
  defaultValue,
  helperText,
  errorText,
  placeholder,
  disabled = false,
  required = false,
  onChange,
  id: idProp,
  className = '',
  size = 'md',
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hasError = Boolean(errorText);

  return (
    <div className={`pxd-select pxd-select--${size} ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="pxd-select__label">
          {label}
          {required && <span className="pxd-select__required" aria-hidden> *</span>}
        </label>
      )}
      <div className="pxd-select__wrapper">
        <select
          id={id}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          required={required}
          onChange={onChange}
          aria-invalid={hasError}
          aria-describedby={
            [helperText && `${id}-helper`, errorText && `${id}-error`].filter(Boolean).join(' ') || undefined
          }
          className={`pxd-select__input${hasError ? ' pxd-select__input--error' : ''}`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pxd-select__chevron" aria-hidden>▼</span>
      </div>
      {(helperText || errorText) && (
        <div id={`${id}-helper`} className="pxd-select__helper">
          {errorText && (
            <p id={`${id}-error`} className="pxd-select__helper-error" role="alert">
              {errorText}
            </p>
          )}
          {helperText && !errorText && <p>{helperText}</p>}
        </div>
      )}
    </div>
  );
}
