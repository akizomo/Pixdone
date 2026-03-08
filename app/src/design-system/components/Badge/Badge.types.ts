export type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'brand' | 'epic' | 'legendary';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  /** Visual style of the badge */
  variant?: BadgeVariant;
  /** Size */
  size?: BadgeSize;
  /** Text content */
  children: React.ReactNode;
  /** Accessible label (when badge conveys status, include in screen reader text) */
  'aria-label'?: string;
  className?: string;
}
