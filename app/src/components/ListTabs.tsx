import { useRef, useEffect } from 'react';
import type { List } from '../types/list';
import { playSound } from '../services/sound';
import './ListTabs.css';

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
    <div className="pd-list-tabs">
      <div
        ref={scrollRef}
        role="tablist"
        className="pd-list-tabs__scroll"
      >
        {lists.map((list) => {
          const isActive = list.id === activeListId;
          const count = getTabCount?.(list);
          const showCount = count !== undefined && list.id !== 'smash-list' && list.name !== '💥 Smash List';
          return (
            <button
              key={list.id}
              id={list.id === 'smash-list' ? 'pd-list-tab-smash' : undefined}
              ref={isActive ? activeRef : null}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={showCount ? `${getTabLabel(list)}, ${count} tasks` : undefined}
              className={`pd-list-tabs__tab${isActive ? ' pd-list-tabs__tab--active' : ''}`}
              onClick={() => { playSound('buttonClick'); onSelect(list.id); }}
            >
              <span>{getTabLabel(list)}</span>
              {showCount && (
                <span
                  aria-hidden="true"
                  className={`pd-list-tabs__count${isActive ? ' pd-list-tabs__count--active' : ''}`}
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
        className="pd-list-tabs__add"
        onClick={() => { playSound('taskAdd'); onAddList(); }}
        aria-label="Add list"
      >
        +
      </button>
    </div>
  );
}
