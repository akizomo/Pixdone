import { PixelIcon } from '../../design-system';
import { themeList } from '../../design-system/themes/themeRegistry';
import type { ThemeKey } from '../../design-system/themes/themeRegistry';
import { playSound } from '../../services/sound';
import './ThemesTab.css';

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
      <div className="themes-tab__box-1">
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
              <span className="themes-tab__text-1">
                {theme.icon}
              </span>
              <div className="themes-tab__box-2">
                <div style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: 'var(--pd-font-size-sm)',
                  letterSpacing: '0.5px',
                  color: isSelected ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  lineHeight: 1.2,
                }}>
                  {theme.name}
                  {isActive && <span className="themes-tab__text-2"><PixelIcon name="play" size="sm" /></span>}
                  {isLocked && <span className="themes-tab__text-3">🔒</span>}
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
    <div className="themes-tab__box-3">
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
            <span className="themes-tab__text-4">
              {theme.icon}
            </span>
            <div className="themes-tab__box-2">
              <div style={{
                fontFamily: 'var(--pd-font-brand)',
                fontSize: 'var(--pd-font-size-sm)',
                letterSpacing: '0.5px',
                color: isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                lineHeight: 1.2,
              }}>
                {theme.name}
                {isActive && <span className="themes-tab__text-5">ACTIVE</span>}
                {isLocked && <span className="themes-tab__text-6">🔒</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
