import { type ButtonHTMLAttributes } from 'react';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selected?: boolean;
  children: React.ReactNode;
}

export function Chip({ selected = false, children, className = '', ...rest }: ChipProps) {
  return (
    <button
      type="button"
      role="button"
      aria-pressed={selected}
      className={`inline-flex items-center justify-center px-2 py-0.5 border-2 rounded-none text-[0.875rem] font-semibold transition-all pd-pixel-ui min-w-[28px] pd-font-pixel ${
        selected
          ? 'border-[var(--pd-color-border-default)] bg-[var(--pd-color-accent-subtle)] text-[var(--pd-color-accent-default)] pd-shadow-sm'
          : 'border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-elevated)] text-[var(--pd-color-text-secondary)] pd-shadow-xs hover:bg-[var(--pd-color-background-hover)]'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
