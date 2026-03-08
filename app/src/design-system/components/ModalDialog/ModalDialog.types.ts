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
  'aria-label'?: string;
}
