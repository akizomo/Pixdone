import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  limitShift,
  size as floatingSize,
  useFloating,
  type Placement,
  type VirtualElement,
} from '@floating-ui/react';
import { PixelIcon } from '../PixelIcon/PixelIcon';
import type { PopoverMenuProps } from './PopoverMenu.types';
import './PopoverMenu.css';

/**
 * PopoverMenu — floating menu anchored to a trigger.
 *
 * **Anchored mode** (preferred): pass `anchorEl` (or `anchorRect`). The menu is
 * portalled to `document.body`, positioned with Floating UI (flip + shift +
 * auto-update), and escapes ancestor overflow / transform contexts. The menu
 * is kept `visibility: hidden` until Floating UI reports `isPositioned` so it
 * never flashes at the viewport origin before its final coords are known.
 *
 * **Legacy mode** (back-compat): no `anchorEl` / `anchorRect`. The menu renders
 * inline as a child of the caller with `position: absolute` anchored by the
 * `align` prop. This path does NOT auto-flip and clips inside overflow:hidden
 * ancestors. Use only when the caller provides its own positioned wrapper.
 */
export function PopoverMenu(props: PopoverMenuProps) {
  const {
    items,
    onSelect,
    onClose,
    header,
    align = 'right',
    className = '',
    children,
    footer,
    anchorEl,
    anchorRect,
    placement,
  } = props;

  const isAnchored = anchorEl != null || anchorRect != null;

  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape (both modes)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ── Anchored (floating) mode ─────────────────────────────────────────────
  const initialPlacement: Placement = useMemo(
    () => placement ?? (align === 'left' ? 'bottom-start' : 'bottom-end'),
    [placement, align],
  );

  // Build a stable virtual element for `anchorRect` so Floating UI can query
  // `getBoundingClientRect` on re-position. The identity only changes when the
  // rect inputs change, which also invalidates the useFloating positioning.
  const virtualElement = useMemo<VirtualElement | null>(() => {
    if (!anchorRect) return null;
    const width = anchorRect.width ?? 0;
    const height = anchorRect.height ?? 0;
    return {
      getBoundingClientRect: () => ({
        x: anchorRect.left,
        y: anchorRect.top,
        width,
        height,
        left: anchorRect.left,
        top: anchorRect.top,
        right: anchorRect.left + width,
        bottom: anchorRect.top + height,
        toJSON: () => ({}),
      }),
    };
  }, [anchorRect]);

  // Pass the reference **synchronously** via `elements.reference`. This is the
  // Floating UI idiomatic way to avoid the "flash at (0,0) before effect sets
  // the ref" jump that `refs.setReference()` in useEffect causes.
  const reference: Element | VirtualElement | null = virtualElement ?? anchorEl ?? null;

  const { refs, floatingStyles, isPositioned } = useFloating({
    placement: initialPlacement,
    strategy: 'fixed',
    open: isAnchored,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
    // Cast: Floating UI's runtime accepts VirtualElement here, but its TS signature
    // for `elements.reference` narrows to `Element | null`.
    elements: { reference: (reference ?? undefined) as Element | undefined },
    middleware: isAnchored
      ? [
          floatingOffset(4),
          flip({ fallbackAxisSideDirection: 'start', padding: 8 }),
          shift({ padding: 8, limiter: limitShift() }),
          floatingSize({
            padding: 8,
            apply({ availableHeight, elements }) {
              elements.floating.style.maxHeight = `${Math.max(120, availableHeight)}px`;
              elements.floating.style.overflowY = 'auto';
            },
          }),
        ]
      : [],
    whileElementsMounted: isAnchored ? autoUpdate : undefined,
  });

  // `visibility: hidden` until positioned — prevents the one-frame flash at
  // the viewport origin while Floating UI measures and places the menu.
  const anchoredStyle: React.CSSProperties | undefined = isAnchored
    ? {
        ...floatingStyles,
        visibility: isPositioned ? 'visible' : 'hidden',
      }
    : undefined;

  const menuBody = (
    <div
      ref={isAnchored ? refs.setFloating : menuRef}
      role="menu"
      data-positioned={isAnchored ? (isPositioned ? 'true' : 'false') : undefined}
      className={
        isAnchored
          ? `pxd-popover-menu pxd-popover-menu--floating ${className}`.trim()
          : `pxd-popover-menu pxd-popover-menu--${align} ${className}`.trim()
      }
      style={anchoredStyle}
    >
      {header && <div className="pxd-popover-menu__header">{header}</div>}
      {children}
      {items.map((item, i) => {
        const nextGroup = i < items.length - 1 ? items[i + 1].group : undefined;
        const sameGroupAsNext = item.group !== undefined && item.group === nextGroup;
        const prevGroup = i > 0 ? items[i - 1].group : undefined;
        const isGroupBoundary = i > 0 && item.group !== prevGroup;
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={
              `pxd-popover-menu__item` +
              `${item.danger ? ' pxd-popover-menu__item--danger' : ''}` +
              `${item.selected ? ' pxd-popover-menu__item--selected' : ''}` +
              `${isGroupBoundary ? ' pxd-popover-menu__item--group-start' : ''}` +
              `${sameGroupAsNext ? ' pxd-popover-menu__item--no-divider' : ''}`
            }
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item.id);
            }}
          >
            {item.icon && <PixelIcon name={item.icon} className="pxd-popover-menu__icon" />}
            <span className="pxd-popover-menu__label">{item.label}</span>
            {item.trailing}
            {!item.trailing && item.selected && (
              <PixelIcon name="check" className="pxd-popover-menu__check" />
            )}
          </button>
        );
      })}
      {footer}
    </div>
  );

  const backdrop = (
    <div
      className="pxd-popover-menu__backdrop"
      aria-hidden="true"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    />
  );

  if (isAnchored) {
    return createPortal(
      <>
        {backdrop}
        {menuBody}
      </>,
      document.body,
    );
  }

  return (
    <>
      {backdrop}
      {menuBody}
    </>
  );
}
