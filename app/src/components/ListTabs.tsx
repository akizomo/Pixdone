import type { List } from '../types/list';

export interface ListTabsProps {
  lists: List[];
  activeListId: string | null;
  onSelect: (listId: string) => void;
  onAddList: () => void;
  /** e.g. (list) => list.id === 'smash-list' for emoji-only tab */
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
  return (
    <div className="flex items-center gap-2 w-full overflow-hidden">
      <div className="pd-list-tabs-scroll flex items-center gap-0.5 flex-1 min-w-0 pb-0">
        {lists.map((list) => {
          const isActive = list.id === activeListId;
          const count = getTabCount?.(list);
          const showCount = count !== undefined && list.id !== 'smash-list' && list.name !== '💥 Smash List';
          return (
            <button
              key={list.id}
              type="button"
              className={`flex items-center gap-1 py-1.5 px-2 border-b-2 flex-shrink-0 whitespace-nowrap rounded-none text-[0.875rem] transition-all ${
                isActive
                  ? 'border-[var(--pd-color-accent-default)] text-[var(--pd-color-text-primary)] font-medium'
                  : 'border-transparent text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-background-hover)] hover:text-[var(--pd-color-text-primary)]'
              }`}
              style={{ fontFamily: 'var(--pd-font-body)' }}
              onClick={() => onSelect(list.id)}
            >
              <span>{getTabLabel(list)}</span>
              {showCount && (
                <span
                  className={`ml-1 px-1 py-0.5 text-xs rounded-none pd-pixel-ui border ${
                    isActive
                      ? 'bg-[var(--pd-color-accent-default)] border-[var(--pd-color-accent-default)] text-white'
                      : 'bg-[var(--pd-color-background-elevated)] border-[var(--pd-color-border-default)] text-[var(--pd-color-text-secondary)]'
                  }`}
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
        className="flex items-center justify-center w-7 h-7 flex-shrink-0 border border-[var(--pd-color-border-default)] rounded-none pd-pixel-ui text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-background-hover)] hover:text-[var(--pd-color-text-primary)]"
        onClick={onAddList}
        aria-label="Add list"
      >
        +
      </button>
    </div>
  );
}
