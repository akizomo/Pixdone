import type { ReactNode } from 'react';

export interface PopoverMenuItem {
  id: string;
  label: string;
  icon?: string;
  /** Danger-styled item (e.g. delete). */
  danger?: boolean;
  disabled?: boolean;
  /** Renders a trailing checkmark in accent color (e.g. selected sort mode). */
  selected?: boolean;
}

export interface PopoverMenuProps {
  /** Menu items to render. */
  items: PopoverMenuItem[];
  /** Called when a menu item is selected. */
  onSelect: (id: string) => void;
  /** Called when the menu should close (outside click, Escape, or item selection). */
  onClose: () => void;
  /** Optional header label rendered at top of the menu. */
  header?: string;
  /** Anchor side. @default 'right' */
  align?: 'left' | 'right';
  /** Additional className on the container. */
  className?: string;
  /** Extra content rendered above items (e.g. user info). */
  children?: ReactNode;
}
