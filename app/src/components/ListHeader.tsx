import { useState, useRef, useEffect } from 'react';
import { t } from '../lib/i18n';
import { playSound } from '../services/sound';

export interface ListHeaderProps {
  title: string;
  showMenu: boolean;
  lang?: 'en' | 'ja';
  onRename?: () => void;
  onDelete?: () => void;
}

export function ListHeader({ title, showMenu, lang = 'en', onRename, onDelete }: ListHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div
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
        <div ref={menuRef} style={{ position: 'relative' }}>
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
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                zIndex: 200,
                background: 'var(--pd-color-background-elevated)',
                border: '2px solid var(--pd-color-border-default)',
                boxShadow: '3px 3px 0 var(--pd-color-shadow-default)',
                minWidth: '150px',
              }}
            >
              {onRename && (
                <button
                  type="button"
                  onClick={() => { playSound('buttonClick'); setMenuOpen(false); onRename(); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', background: 'none',
                    border: 'none', borderBottom: '1px solid var(--pd-color-border-default)',
                    color: 'var(--pd-color-text-primary)',
                    fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pd-color-background-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  <span className="material-icons" style={{ fontSize: '16px', lineHeight: 1, verticalAlign: 'middle', marginRight: '6px' }}>edit</span>{t('rename', lang)}
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => { playSound('buttonClick'); setMenuOpen(false); onDelete(); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', background: 'none',
                    border: 'none',
                    color: 'var(--pd-color-semantic-danger, #ef4444)',
                    fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pd-color-background-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  <span className="material-icons" style={{ fontSize: '16px', lineHeight: 1, verticalAlign: 'middle', marginRight: '6px' }}>delete</span>{t('deleteList', lang)}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
