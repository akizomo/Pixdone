import { themeList } from '../../design-system/themes/themeRegistry';
import type { ThemeKey } from '../../design-system/themes/themeRegistry';
import { playSound } from '../../services/sound';

interface ThemesTabProps {
  activeTheme: ThemeKey;
  isPremium: boolean;
  colorMode: 'light' | 'dark';
  onSelect: (themeKey: ThemeKey) => void;
  /** Desktop only: which theme is currently shown in the right panel */
  selectedTheme?: ThemeKey | null;
  /** When true: renders in desktop flat-list style */
  isDesktop?: boolean;
}

export function ThemesTab({
  activeTheme, isPremium, onSelect,
  selectedTheme, isDesktop = false,
}: ThemesTabProps) {
  if (isDesktop) {
    return (
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {themeList.map(theme => {
          const isSelected = selectedTheme === theme.key;
          const isActive = theme.key === activeTheme;
          const isLocked = theme.isPremium && !isPremium;

          return (
            <button
              key={theme.key}
              type="button"
              onClick={() => { playSound('buttonClick'); onSelect(theme.key as ThemeKey); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 12px',
                textAlign: 'left',
                background: isSelected ? 'var(--pd-color-accent-subtle)' : 'none',
                border: 'none',
                borderLeft: `3px solid ${isSelected ? 'var(--pd-color-accent-default)' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'background 0.1s',
                gap: '8px',
              }}
            >
              <span style={{
                width: '28px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                lineHeight: 1,
                flexShrink: 0,
              }}>
                {theme.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  color: isSelected ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  lineHeight: 1.2,
                }}>
                  {theme.name}
                  {isActive && <span style={{ fontSize: '0.5rem', color: 'var(--pd-color-accent-default)' }}>▶</span>}
                  {isLocked && <span style={{ fontSize: '0.625rem' }}>🔒</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Mobile: vertical list (same structure, slightly more padding)
  return (
    <div style={{ padding: '8px 0' }}>
      {themeList.map(theme => {
        const isActive = theme.key === activeTheme;
        const isLocked = theme.isPremium && !isPremium;

        return (
          <button
            key={theme.key}
            type="button"
            onClick={() => onSelect(theme.key as ThemeKey)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '12px 16px',
              textAlign: 'left',
              background: isActive ? 'var(--pd-color-accent-subtle)' : 'none',
              border: 'none',
              borderLeft: `3px solid ${isActive ? 'var(--pd-color-accent-default)' : 'transparent'}`,
              cursor: 'pointer',
              gap: '10px',
            }}
          >
            <span style={{
              width: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              lineHeight: 1,
              flexShrink: 0,
            }}>
              {theme.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--pd-font-brand)',
                fontSize: '0.875rem',
                letterSpacing: '0.5px',
                color: isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                lineHeight: 1.2,
              }}>
                {theme.name}
                {isActive && <span style={{ fontSize: '0.5625rem', color: 'var(--pd-color-accent-default)' }}>▶ ACTIVE</span>}
                {isLocked && <span style={{ fontSize: '0.75rem' }}>🔒</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
