import type { ReactNode } from 'react';
import type { Placement } from '@floating-ui/react';

export type PopoverPlacement = Placement;

export interface PopoverMenuItem {
  id: string;
  label: string;
  icon?: string;
  /** Danger-styled item (e.g. delete). */
  danger?: boolean;
  disabled?: boolean;
  /** Renders a trailing checkmark in accent color (e.g. selected sort mode). */
  selected?: boolean;
  /** Group key — items in the same group have no divider between them. */
  group?: string;
  /** Custom trailing content (rendered instead of label on the right side). */
  trailing?: ReactNode;
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
  /**
   * Anchor side for the legacy (non-portalled) layout. Ignored when `anchorEl`
   * or `anchorRect` is provided. @default 'right'
   * @deprecated Prefer `anchorEl` + `placement` — this remains for back-compat.
   */
  align?: 'left' | 'right';
  /**
   * Anchor element for floating positioning. When provided (or `anchorRect`
   * is provided) the menu is portalled to `document.body`, positioned with
   * Floating UI (autoUpdate + flip + shift) so it escapes ancestor overflow
   * and always fits the viewport.
   */
  anchorEl?: HTMLElement | null;
  /**
   * Alternative to `anchorEl`: explicit viewport-relative rect (e.g. right-click
   * context menu anchored at the cursor).
   */
  anchorRect?: { top: number; left: number; width?: number; height?: number };
  /**
   * Floating UI placement — only effective when using `anchorEl`/`anchorRect`.
   * @default 'bottom-end' (matches legacy `align='right'`)
   */
  placement?: PopoverPlacement;
  /** Additional className on the container. */
  className?: string;
  /** Extra content rendered above items (e.g. user info). */
  children?: ReactNode;
  /** Extra content rendered below items (e.g. footer links). */
  footer?: ReactNode;
}
