import type { ReactNode } from 'react';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Optional extra class on the sheet container */
  className?: string;
  /** Optional extra class on the sheet body */
  bodyClassName?: string;
  /** When true, backdrop/close-button do NOT play their own sound (caller handles it) */
  silent?: boolean;
}
