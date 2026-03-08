export type BannerVariant = 'info' | 'success' | 'warning' | 'danger' | 'brand';

export interface BannerProps {
  variant: BannerVariant;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}
