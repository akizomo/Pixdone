import { useRef, useEffect } from 'react';
import type { List } from '../types/list';

export interface ListTabsProps {
  lists: List[];
  activeListId: string | null;
  onSelect: (listId: string) => void;
  onAddList: () => void;
  getTabLabel: (list: List) => string;
  getTabCount?: (list: List) => number;
}

export function ListTabs({
  lists,
  activeListId,
  onSelect,
  onAddList,
  getTabLabel,
  getTabCount,
}: ListTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    const btn = activeRef.current;
    if (!container || !btn) return;
    const containerCenter = container.clientWidth / 2;
    const btnCenter = btn.offsetLeft + btn.offsetWidth / 2;
    container.scrollTo({ left: btnCenter - containerCenter, behavior: 'smooth' });
  }, [activeListId]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div
        ref={scrollRef}
        role="tablist"
        className="pd-list-tabs-scroll"
        style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, minWidth: 0, overflowX: 'auto' }}
      >
        {lists.map((list) => {
          const isActive = list.id === activeListId;
          const count = getTabCount?.(list);
          const showCount = count !== undefined && list.id !== 'smash-list' && list.name !== '💥 Smash List';
          return (
            <button
              key={list.id}
              ref={isActive ? activeRef : null}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={showCount ? `${getTabLabel(list)}, ${count} tasks` : undefined}
              onClick={() => onSelect(list.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 8px',
                borderBottom: `2px solid ${isActive ? 'var(--pd-color-accent-default)' : 'transparent'}`,
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                background: 'none',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                fontSize: '0.875rem',
                fontFamily: 'var(--pd-font-body)',
                color: isActive ? 'var(--pd-color-text-primary)' : 'var(--pd-color-text-secondary)',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--pd-color-background-hover)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--pd-color-text-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
                (e.currentTarget as HTMLButtonElement).style.color = isActive ? 'var(--pd-color-text-primary)' : 'var(--pd-color-text-secondary)';
              }}
            >
              <span>{getTabLabel(list)}</span>
              {showCount && (
                <span
                  aria-hidden="true"
                  style={{
                    marginLeft: '2px',
                    padding: '1px 4px',
                    fontSize: '0.6875rem',
                    borderRadius: 0,
                    border: `1px solid ${isActive ? 'var(--pd-color-accent-default)' : 'var(--pxd-color-border-interactive)'}`,
                    background: isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-background-elevated)',
                    color: isActive ? 'var(--pd-color-accent-text)' : 'var(--pd-color-text-secondary)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onAddList}
        aria-label="Add list"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          flexShrink: 0,
          border: '1px solid var(--pxd-color-border-interactive)',
          borderRadius: 0,
          background: 'none',
          color: 'var(--pd-color-text-secondary)',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--pd-color-background-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--pd-color-text-primary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'none';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--pd-color-text-secondary)';
        }}
      >
        +
      </button>
    </div>
  );
}
