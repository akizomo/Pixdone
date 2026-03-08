export type NumberBadgeVariant = 'default' | 'brand' | 'danger' | 'success' | 'warning';
export type NumberBadgeSize = 'sm' | 'md';

export interface NumberBadgeProps {
  count: number;
  /** Max count before showing + */
  max?: number;
  variant?: NumberBadgeVariant;
  size?: NumberBadgeSize;
  /** When true, shows a dot instead of count */
  dot?: boolean;
  'aria-label'?: string;
  className?: string;
}
