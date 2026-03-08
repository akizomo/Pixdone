export type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'reward';

export interface ToastProps {
  variant?: ToastVariant;
  title?: string;
  message: string;
  /** Auto-dismiss duration ms. 0 = persistent */
  duration?: number;
  onDismiss?: () => void;
  /** Icon override */
  icon?: string;
  className?: string;
}
