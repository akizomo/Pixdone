export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'brand' | 'inverse';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  /** Screen reader label */
  label?: string;
  className?: string;
}
