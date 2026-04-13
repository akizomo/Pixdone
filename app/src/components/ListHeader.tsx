import { useState, useMemo } from 'react';
import { t } from '../lib/i18n';
import { playSound } from '../services/sound';
import { PopoverMenu } from '../design-system';
import type { PopoverMenuItem } from '../design-system/components/PopoverMenu/PopoverMenu.types';
import type { SortMode } from '../types/list';
import './ListHeader.css';

export interface ListHeaderProps {
  title: string;
  showMenu: boolean;
  lang?: 'en' | 'ja';
  sortMode?: SortMode;
  onRename?: () => void;
  onDelete?: () => void;
  onChangeSort?: (mode: SortMode) => void;
}

const SORT_OPTIONS: Array<{ id: SortMode; labelKey: string }> = [
  { id: 'manual',       labelKey: 'sortManual' },
  { id: 'dueDate',      labelKey: 'sortDueDate' },
  { id: 'priority',     labelKey: 'sortPriority' },
  { id: 'createdAt',    labelKey: 'sortCreatedAt' },
  { id: 'alphabetical', labelKey: 'sortAlphabetical' },
];

export function ListHeader({ title, showMenu, lang = 'en', sortMode = 'manual', onRename, onDelete, onChangeSort }: ListHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const items = useMemo(() => {
    const list: PopoverMenuItem[] = [];
    if (onRename) list.push({ id: 'rename', label: t('rename', lang), icon: 'edit' });
    if (onDelete) list.push({ id: 'delete', label: t('deleteList', lang), icon: 'delete', danger: true });
    return list;
  }, [onRename, onDelete, lang]);

  const sortItems = useMemo<PopoverMenuItem[]>(
    () => SORT_OPTIONS.map((o) => ({
      id: o.id,
      label: t(o.labelKey, lang),
      selected: sortMode === o.id,
    })),
    [lang, sortMode],
  );

  const handleSelect = (id: string) => {
    playSound('buttonClick');
    setMenuOpen(false);
    if (id === 'rename') onRename?.();
    if (id === 'delete') onDelete?.();
  };

  const handleSortSelect = (id: string) => {
    playSound('buttonClick');
    setSortOpen(false);
    onChangeSort?.(id as SortMode);
  };

  return (
    <div className="pd-list-header">
      <h2 className="pd-list-header__title">{title}</h2>

      <div className="pd-list-header__actions">
        {onChangeSort && (
          <div className="pd-list-header__menu">
            <button
              type="button"
              className="pd-list-header__menu-btn"
              onClick={() => { playSound('buttonClick'); setSortOpen((v) => !v); }}
              aria-label={t('sort', lang)}
              aria-expanded={sortOpen}
            >
              <span className="material-icons" style={{ fontSize: '20px', lineHeight: 1 }}>swap_vert</span>
            </button>
            {sortOpen && (
              <PopoverMenu
                header={t('sortBy', lang)}
                items={sortItems}
                onSelect={handleSortSelect}
                onClose={() => { playSound('taskCancel'); setSortOpen(false); }}
                align="right"
              />
            )}
          </div>
        )}

        {showMenu && (
          <div className="pd-list-header__menu">
            <button
              type="button"
              className="pd-list-header__menu-btn"
              onClick={() => { playSound('buttonClick'); setMenuOpen((v) => !v); }}
              aria-label="List options"
              aria-expanded={menuOpen}
            >
              <span className="material-icons" style={{ fontSize: '20px', lineHeight: 1 }}>more_vert</span>
            </button>

            {menuOpen && (
              <PopoverMenu
                items={items}
                onSelect={handleSelect}
                onClose={() => { playSound('taskCancel'); setMenuOpen(false); }}
                align="right"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
