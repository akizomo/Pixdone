import { useId } from 'react';
import type { TextFieldProps } from './TextField.types';
import './TextField.css';

export function TextField({
  label,
  placeholder,
  value,
  defaultValue,
  helperText,
  errorText,
  disabled = false,
  required = false,
  maxLength,
  onChange,
  type = 'text',
  id: idProp,
  className = '',
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hasError = Boolean(errorText);

  return (
    <div className={`pxd-text-field ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="pxd-text-field__label">
          {label}
          {required && <span className="pxd-text-field__required" aria-hidden> *</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        onChange={onChange}
        aria-invalid={hasError}
        aria-describedby={
          [helperText && `${id}-helper`, errorText && `${id}-error`].filter(Boolean).join(' ') || undefined
        }
        className={`pxd-text-field__input ${hasError ? 'pxd-text-field__input--error' : ''}`}
        {...rest}
      />
      {(helperText || errorText) && (
        <div id={`${id}-helper`} className="pxd-text-field__helper">
          {errorText && (
            <p id={`${id}-error`} className="pxd-text-field__helper-error" role="alert">
              {errorText}
            </p>
          )}
          {helperText && !errorText && <p>{helperText}</p>}
        </div>
      )}
    </div>
  );
}
