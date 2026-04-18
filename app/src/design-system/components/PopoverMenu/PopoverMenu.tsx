import { useEffect, useRef } from 'react';
import { PixelIcon } from '../PixelIcon/PixelIcon';
import type { PopoverMenuProps } from './PopoverMenu.types';
import './PopoverMenu.css';

export function PopoverMenu({
  items,
  onSelect,
  onClose,
  header,
  align = 'right',
  className = '',
  children,
  footer,
}: PopoverMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onClose]);

  // Close on Escape
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

  return (
    <div
      ref={menuRef}
      role="menu"
      className={`pxd-popover-menu pxd-popover-menu--${align} ${className}`.trim()}
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
          className={`pxd-popover-menu__item${item.danger ? ' pxd-popover-menu__item--danger' : ''}${item.selected ? ' pxd-popover-menu__item--selected' : ''}${isGroupBoundary ? ' pxd-popover-menu__item--group-start' : ''}${sameGroupAsNext ? ' pxd-popover-menu__item--no-divider' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item.id);
          }}
        >
          {item.icon && (
            <PixelIcon name={item.icon} className="pxd-popover-menu__icon" />
          )}
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
}
