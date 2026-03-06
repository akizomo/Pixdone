import { type ButtonHTMLAttributes } from 'react';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
  size?: IconButtonSize;
}

const sizeClass: Record<IconButtonSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export function IconButton({
  icon,
  'aria-label': ariaLabel,
  size = 'md',
  className = '',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center border-2 border-transparent rounded-none pd-pixel-ui bg-transparent text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-background-hover)] hover:text-[var(--pd-color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pd-color-accent-default)] ${sizeClass[size]} ${className}`}
      aria-label={ariaLabel}
      {...rest}
    >
      {icon}
    </button>
  );
}
