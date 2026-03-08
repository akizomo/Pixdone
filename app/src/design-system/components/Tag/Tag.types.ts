export type TagVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface TagProps {
  variant?: TagVariant;
  /** Show × dismiss button */
  dismissible?: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
  className?: string;
}
