export type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'brand';
export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps {
  /** 0-100 */
  value: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label override */
  label?: string;
  /** Screen reader description */
  'aria-label'?: string;
  /** Animated fill */
  animated?: boolean;
  className?: string;
}
