import type { HTMLAttributes, ReactNode } from 'react';

export type EmptyStateVariant = 'sleeping' | 'ready';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  /**
   * Visual style:
   * - 'sleeping' (default): pixel sleeping character inside a speech bubble — used when the
   *   user has completed their tasks and there's nothing left to do.
   * - 'ready': a compact headline-only state used when the user has not created any tasks yet.
   */
  variant?: EmptyStateVariant;
  /** Primary message (large). Optional — omit to show only illustration. */
  title?: ReactNode;
  /** Secondary message (smaller, below the title). */
  description?: ReactNode;
  /** Call-to-action rendered under the description (typically a <Button />). */
  action?: ReactNode;
}
