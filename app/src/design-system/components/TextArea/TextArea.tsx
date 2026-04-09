import { useId } from 'react';
import type { TextAreaProps } from './TextArea.types';
import './TextArea.css';

export function TextArea({
  label,
  value,
  defaultValue,
  helperText,
  errorText,
  disabled = false,
  onChange,
  id: idProp,
  className = '',
  rows = 3,
  ...rest
}: TextAreaProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hasError = Boolean(errorText);

  return (
    <div className={`pxd-text-area ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="pxd-text-area__label">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={onChange}
        aria-invalid={hasError}
        className={`pxd-text-area__input ${hasError ? 'pxd-text-area__input--error' : ''}`}
        rows={rows}
        {...rest}
      />
      {(helperText || errorText) && (
        <div className="pxd-text-area__helper">
          {errorText && <p className="pxd-text-area__helper-error" role="alert">{errorText}</p>}
          {helperText && !errorText && <p>{helperText}</p>}
        </div>
      )}
    </div>
  );
}

