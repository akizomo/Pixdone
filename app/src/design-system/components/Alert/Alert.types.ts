export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
  /** Show dismiss button */
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}
