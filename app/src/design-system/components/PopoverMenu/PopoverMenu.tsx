import { useEffect, useRef } from 'react';
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
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          className={`pxd-popover-menu__item${item.danger ? ' pxd-popover-menu__item--danger' : ''}${item.selected ? ' pxd-popover-menu__item--selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item.id);
          }}
        >
          {item.icon && (
            <span className="material-icons pxd-popover-menu__icon">{item.icon}</span>
          )}
          <span className="pxd-popover-menu__label">{item.label}</span>
          {item.selected && (
            <span className="material-icons pxd-popover-menu__check" aria-hidden>check</span>
          )}
        </button>
      ))}
    </div>
  );
}
