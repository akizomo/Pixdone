import { useRef, useEffect, useState, useMemo } from 'react';
import type { List } from '../types/list';
import { playSound } from '../services/sound';
import { PopoverMenu } from '../design-system';
import type { PopoverMenuItem } from '../design-system/components/PopoverMenu/PopoverMenu.types';
import { t } from '../lib/i18n';
import './ListTabs.css';

export interface ListTabsProps {
  lists: List[];
  activeListId: string | null;
  onSelect: (listId: string) => void;
  onAddList: () => void;
  getTabLabel: (list: List) => string;
  getTabCount?: (list: List) => number;
  /** Optional — enables right-click context menu for rename/delete on eligible tabs. */
  lang?: 'en' | 'ja';
  onRenameList?: (listId: string) => void;
  onDeleteList?: (listId: string) => void;
  /** Tabs that return false are not eligible for the context menu (smash list, tutorial, …). */
  canContextMenu?: (list: List) => boolean;
}

export function ListTabs({
  lists,
  activeListId,
  onSelect,
  onAddList,
  getTabLabel,
  getTabCount,
  lang = 'en',
  onRenameList,
  onDeleteList,
  canContextMenu,
}: ListTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const contextMenuEnabled = !!(onRenameList || onDeleteList);
  const [contextMenu, setContextMenu] = useState<{ listId: string; x: number; y: number } | null>(null);

  const contextMenuItems = useMemo<PopoverMenuItem[]>(() => {
    const items: PopoverMenuItem[] = [];
    if (onRenameList) items.push({ id: 'rename', label: t('rename', lang), icon: 'edit' });
    if (onDeleteList) items.push({ id: 'delete', label: t('deleteList', lang), icon: 'delete', danger: true });
    return items;
  }, [onRenameList, onDeleteList, lang]);

  const handleTabContextMenu = (e: React.MouseEvent<HTMLButtonElement>, list: List) => {
    if (!contextMenuEnabled) return;
    if (canContextMenu && !canContextMenu(list)) return;
    e.preventDefault();
    // Clamp so the ~180px menu stays in viewport
    const menuWidth = 180;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
    const y = e.clientY;
    playSound('buttonClick');
    setContextMenu({ listId: list.id, x, y });
  };

  const handleContextMenuSelect = (id: string) => {
    const listId = contextMenu?.listId;
    setContextMenu(null);
    if (!listId) return;
    if (id === 'rename') onRenameList?.(listId);
    if (id === 'delete') onDeleteList?.(listId);
  };

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
              onContextMenu={(e) => handleTabContextMenu(e, list)}
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

      {contextMenu && contextMenuItems.length > 0 && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            width: 0,
            height: 0,
            zIndex: 300,
          }}
        >
          <PopoverMenu
            items={contextMenuItems}
            onSelect={handleContextMenuSelect}
            onClose={() => { playSound('taskCancel'); setContextMenu(null); }}
            align="left"
          />
        </div>
      )}
    </div>
  );
}
