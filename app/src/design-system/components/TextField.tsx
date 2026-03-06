import { forwardRef, type InputHTMLAttributes } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  onClear?: () => void;
  /** Set to true for password with visibility toggle */
  passwordToggle?: boolean;
  containerClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, onClear, passwordToggle, containerClassName = '', id: idProp, ...rest },
  ref
) {
  const id = idProp ?? `text-field-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className={`block ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block mb-1 text-[var(--pd-color-text-primary)] text-[0.875rem] font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          className="w-full px-3 py-2 border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] text-[var(--pd-color-text-primary)] text-[1rem] rounded-none pd-pixel-ui focus:outline-none focus:border-[var(--pd-color-accent-default)] focus:shadow-[inset_2px_2px_0_var(--pd-color-focus-insetShadow),0_0_0_2px_var(--pd-color-focus-ring)] aria-invalid:border-[var(--pd-color-semantic-danger)]"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        {onClear && rest.value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--pd-color-text-muted)] hover:text-[var(--pd-color-text-primary)]"
            aria-label="Clear"
          >
            ×
          </button>
        )}
        {passwordToggle && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--pd-color-text-muted)]"
            aria-label="Toggle password visibility"
            tabIndex={-1}
          >
            👁
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[var(--pd-color-semantic-danger)] text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
