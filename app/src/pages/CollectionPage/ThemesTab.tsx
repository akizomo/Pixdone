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
              className={`themes-tab__row-7${isSelected ? ' themes-tab__row-7--is-selected' : ''}`}
            >
              <span className="themes-tab__text-1">
                {theme.icon}
              </span>
              <div className="themes-tab__box-2">
                <div className={`themes-tab__text-8${isSelected ? ' themes-tab__text-8--is-selected' : ''}`}>
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
            className={`themes-tab__row-9${isActive ? ' themes-tab__row-9--is-active' : ''}`}
          >
            <span className="themes-tab__text-4">
              {theme.icon}
            </span>
            <div className="themes-tab__box-2">
              <div className={`themes-tab__text-10${isActive ? ' themes-tab__text-10--is-active' : ''}`}>
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
