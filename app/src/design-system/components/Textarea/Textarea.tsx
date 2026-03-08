import { useState, useId } from 'react';
import type { TextareaProps } from './Textarea.types';
import './Textarea.css';

export function Textarea({ value, defaultValue = '', placeholder, onChange, disabled = false, error = false, errorMessage, label, helperText, rows = 4, maxLength, showCount = false, resize = 'vertical', id, className = '' }: TextareaProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const autoId = useId();
  const inputId = id || autoId;
  const charCount = currentValue.length;
  const isNearLimit = maxLength !== undefined && charCount >= maxLength * 0.8;
  const isOverLimit = maxLength !== undefined && charCount > maxLength;

  const countClass = ['pxd-textarea__count', isOverLimit ? 'pxd-textarea__count--over' : isNearLimit ? 'pxd-textarea__count--near' : ''].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  const resizeClass = resize === 'none' ? 'pxd-textarea--no-resize' : resize === 'vertical' ? 'pxd-textarea--vertical' : '';

  return (
    <div className={['pxd-textarea-wrapper', className].filter(Boolean).join(' ')}>
      {label && <label className="pxd-textarea__label" htmlFor={inputId}>{label}</label>}
      <textarea
        id={inputId}
        className={['pxd-textarea', error ? 'pxd-textarea--error' : '', resizeClass].filter(Boolean).join(' ')}
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error}
        aria-describedby={[(error && errorMessage ? `${inputId}-error` : ''), (helperText ? `${inputId}-helper` : '')].filter(Boolean).join(' ') || undefined}
      />
      {(helperText || errorMessage || showCount) && (
        <div className="pxd-textarea__footer">
          <div>
            {error && errorMessage ? (
              <span id={`${inputId}-error`} className="pxd-textarea__error-msg" role="alert">{errorMessage}</span>
            ) : helperText ? (
              <span id={`${inputId}-helper`} className="pxd-textarea__helper">{helperText}</span>
            ) : null}
          </div>
          {showCount && maxLength && (
            <span className={countClass}>{charCount}/{maxLength}</span>
          )}
        </div>
      )}
    </div>
  );
}
