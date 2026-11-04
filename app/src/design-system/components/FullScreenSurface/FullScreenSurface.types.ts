import type { HTMLAttributes, ReactNode } from 'react';

export interface FullScreenSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** Extra class for the safe-area content box (the flex column that holds children). */
  innerClassName?: string;
  children?: ReactNode;
}
