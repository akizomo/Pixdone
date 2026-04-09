import { useState, useMemo } from 'react';
import { t } from '../lib/i18n';
import { playSound } from '../services/sound';
import { PopoverMenu } from '../design-system';
import type { PopoverMenuItem } from '../design-system/components/PopoverMenu/PopoverMenu.types';

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
    <div
      className="pd-list-header"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        marginBottom: '4px',
      }}
    >
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--pd-color-text-primary)',
          margin: 0,
          fontFamily: 'var(--pd-font-brand)',
          imageRendering: 'pixelated',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          textShadow: '1px 1px 0px var(--pd-color-shadow-default)',
        }}
      >
        {title}
      </h2>

      {showMenu && (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); setMenuOpen((v) => !v); }}
            aria-label="List options"
            aria-expanded={menuOpen}
            style={{
              width: '28px',
              height: '28px',
              border: 'none',
              borderRadius: 0,
              background: 'transparent',
              color: 'var(--pd-color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              imageRendering: 'pixelated',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--pd-color-text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--pd-color-text-secondary)'; }}
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
