import { useState, useMemo } from 'react';
import { t } from '../lib/i18n';
import { playSound } from '../services/sound';
import { PopoverMenu } from '../design-system';
import type { PopoverMenuItem } from '../design-system/components/PopoverMenu/PopoverMenu.types';
import './ListHeader.css';

export interface ListHeaderProps {
  title: string;
  showMenu: boolean;
  lang?: 'en' | 'ja';
  onRename?: () => void;
  onDelete?: () => void;
}

export function ListHeader({ title, showMenu, lang = 'en', onRename, onDelete }: ListHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const items = useMemo(() => {
    const list: PopoverMenuItem[] = [];
    if (onRename) list.push({ id: 'rename', label: t('rename', lang), icon: 'edit' });
    if (onDelete) list.push({ id: 'delete', label: t('deleteList', lang), icon: 'delete', danger: true });
    return list;
  }, [onRename, onDelete, lang]);

  const handleSelect = (id: string) => {
    playSound('buttonClick');
    setMenuOpen(false);
    if (id === 'rename') onRename?.();
    if (id === 'delete') onDelete?.();
  };

  return (
    <div className="pd-list-header">
      <h2 className="pd-list-header__title">{title}</h2>

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
  );
}
