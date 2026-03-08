import type { ReactNode } from 'react';

export type BottomSheetSnap = 'content' | 'medium' | 'large';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  snap?: BottomSheetSnap;
  showHandle?: boolean;
  closeOnOverlayClick?: boolean;
}
