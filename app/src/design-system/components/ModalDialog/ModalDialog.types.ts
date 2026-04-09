import type { ReactNode } from 'react';

export interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Custom action buttons (e.g. Cancel / Confirm) */
  actions?: ReactNode;
  closeOnOverlayClick?: boolean;
  /** When set, called on overlay click instead of onClose (e.g. save then close) */
  onOverlayClick?: () => void;
  'aria-label'?: string;
}
