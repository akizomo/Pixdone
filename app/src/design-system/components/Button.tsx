import { type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'signup' | 'icon';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  loading?: boolean;
  children?: ReactNode;
}

const base =
  'pd-btn inline-flex items-center justify-center gap-2 border-2 border-solid cursor-pointer rounded-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[2px_2px_0px_var(--pd-color-shadow-default)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 pd-pixel-ui';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--pd-color-accent-default)] text-white border-[var(--pd-color-accent-default)] pd-shadow-sm pd-shadow-hover hover:bg-[var(--pd-color-accent-hover)] hover:border-[var(--pd-color-accent-hover)] pd-font-pixel',
  secondary:
    'bg-[var(--pd-color-background-elevated)] text-[var(--pd-color-text-primary)] border-[var(--pd-color-border-default)] pd-shadow-sm pd-shadow-hover hover:bg-[var(--pd-color-background-hover)] hover:border-[var(--pd-color-border-default)] pd-font-pixel',
  ghost:
    'bg-transparent text-[var(--pd-color-accent-default)] border-transparent hover:bg-[var(--pd-color-background-hover)] font-normal',
  destructive:
    'bg-[var(--pd-color-semantic-danger)] text-white border-[var(--pd-color-semantic-danger)] pd-shadow-sm pd-shadow-hover hover:opacity-90 pd-font-pixel',
  signup:
    'bg-[var(--pd-color-semantic-success)] text-white border-[var(--pd-color-semantic-success)] pd-shadow-sm pd-shadow-hover hover:bg-[var(--pd-color-semantic-successHover)] hover:border-[var(--pd-color-semantic-successHover)] pd-font-pixel',
  icon:
    'bg-transparent border-transparent text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-background-hover)] hover:text-[var(--pd-color-text-primary)] p-2',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isIcon = variant === 'icon';
  const sizeClass = isIcon ? 'p-2' : 'px-3 py-2 text-[0.875rem]';
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? '…' : children}
    </button>
  );
}
