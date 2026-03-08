import { useState, useId } from 'react';
import type { TabsProps, TabPanelProps } from './Tabs.types';
import './Tabs.css';

export function Tabs({ items, value, defaultValue, onChange, variant = 'underline', className = '' }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.id ?? '');
  const isControlled = value !== undefined;
  const activeId = isControlled ? value : internalValue;

  const handleSelect = (id: string) => {
    if (!isControlled) setInternalValue(id);
    onChange?.(id);
  };

  return (
    <div
      className={[`pxd-tabs--${variant}`, className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label="Tabs"
    >
      {items.map(({ id, label, icon, disabled, count }) => (
        <button
          key={id}
          role="tab"
          id={`pxd-tab-${id}`}
          aria-selected={activeId === id}
          aria-controls={`pxd-panel-${id}`}
          className={['pxd-tab', activeId === id ? 'pxd-tab--active' : ''].filter(Boolean).join(' ')}
          onClick={() => !disabled && handleSelect(id)}
          disabled={disabled}
          tabIndex={activeId === id ? 0 : -1}
          onKeyDown={(e) => {
            const idx = items.findIndex(i => i.id === id);
            if (e.key === 'ArrowRight') { const next = items[idx + 1]; if (next && !next.disabled) handleSelect(next.id); }
            if (e.key === 'ArrowLeft') { const prev = items[idx - 1]; if (prev && !prev.disabled) handleSelect(prev.id); }
          }}
        >
          {icon && <span aria-hidden="true">{icon}</span>}
          {label}
          {count !== undefined && <span className="pxd-tab__count">{count}</span>}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, activeId, children, className = '' }: TabPanelProps) {
  return (
    <div
      id={`pxd-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`pxd-tab-${id}`}
      className={['pxd-tab-panel', className].filter(Boolean).join(' ')}
      hidden={id !== activeId}
    >
      {children}
    </div>
  );
}
