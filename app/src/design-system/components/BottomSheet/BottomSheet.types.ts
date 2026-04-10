import type { ReactNode } from 'react';

export interface BottomSheetProps {
  open: boolean;
  /**
   * Must be `() => setOpen(false)` and nothing else.
   * Do NOT add save/dismiss/sound logic here — it breaks CSS transitions.
   * Use onSave/useEffect for side-effects on close.
   */
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Optional extra class on the sheet container */
  className?: string;
  /** Optional extra class on the sheet body */
  bodyClassName?: string;
}
