export interface EmptyStateProps {
  /** Large emoji or icon */
  icon?: string;
  title: string;
  description?: string;
  /** Primary action label */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary action label */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}
