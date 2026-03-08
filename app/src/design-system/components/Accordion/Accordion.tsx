import { useState } from 'react';
import type { AccordionProps } from './Accordion.types';
import './Accordion.css';

export function Accordion({ items, multiple = false, defaultOpen, className = '' }: AccordionProps) {
  const initOpen = (): Set<string> => {
    if (!defaultOpen) return new Set();
    if (typeof defaultOpen === 'string') return new Set([defaultOpen]);
    return new Set(defaultOpen);
  };
  const [openItems, setOpenItems] = useState<Set<string>>(initOpen);

  const toggle = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={['pxd-accordion', className].filter(Boolean).join(' ')}>
      {items.map(({ id, title, children, disabled }) => {
        const isOpen = openItems.has(id);
        return (
          <div key={id} className="pxd-accordion__item">
            <button
              className="pxd-accordion__trigger"
              onClick={() => !disabled && toggle(id)}
              aria-expanded={isOpen}
              aria-controls={`pxd-acc-panel-${id}`}
              id={`pxd-acc-trigger-${id}`}
              disabled={disabled}
            >
              <span>{title}</span>
              <span className={['pxd-accordion__chevron', isOpen ? 'pxd-accordion__chevron--open' : ''].filter(Boolean).join(' ')} aria-hidden="true">▼</span>
            </button>
            <div
              id={`pxd-acc-panel-${id}`}
              className="pxd-accordion__panel"
              role="region"
              aria-labelledby={`pxd-acc-trigger-${id}`}
              hidden={!isOpen}
              style={isOpen ? { display: 'block' } : { display: 'none' }}
            >
              <div className="pxd-accordion__panel-inner">{children}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
