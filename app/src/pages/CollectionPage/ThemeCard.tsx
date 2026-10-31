import type { VisualTheme } from '../../design-system/themes/themeRegistry';
import './ThemeCard.css';

interface ThemeCardProps {
  theme: VisualTheme;
  isActive: boolean;
  isPremium: boolean;
  colorMode: 'light' | 'dark';
  onClick: () => void;
}

/** Extract up to 3 representative colors from theme CSS variables for the swatch strip */
function getSwatchColors(theme: VisualTheme, colorMode: 'light' | 'dark'): string[] {
  const vars = theme.cssVariables[colorMode] ?? theme.cssVariables.dark ?? theme.cssVariables.light ?? {};
  // Try to pick background, surface, and accent colors
  const candidates = [
    vars['--pd-color-background-default'],
    vars['--pd-color-background-elevated'],
    vars['--pd-color-accent-default'],
    vars['--pd-sw-navy-950'],
    vars['--pd-sw-navy-800'],
    vars['--pd-fb-night-950'],
    vars['--pd-fb-night-700'],
  ].filter(Boolean) as string[];
  return candidates.slice(0, 3);
}

export function ThemeCard({ theme, isActive, isPremium, colorMode, onClick }: ThemeCardProps) {
  const isLocked = theme.isPremium && !isPremium;
  const swatches = getSwatchColors(theme, colorMode);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`theme-card__row-4${isActive ? ' theme-card__row-4--is-active' : ''}${isLocked ? ' theme-card__row-4--is-locked' : ''}`}
    >
      {/* Theme icon */}
      <span className="theme-card__theme-icon">{theme.icon}</span>

      {/* Info */}
      <div className="theme-card__info">
        <div
          className={`theme-card__text-5${isActive ? ' theme-card__text-5--is-active' : ''}`}
        >
          {theme.name}
        </div>
        {/* Color swatches */}
        {swatches.length > 0 && (
          <div className="theme-card__row-1">
            {swatches.map((color, i) => (
              <span
                key={i}
                className="theme-card__box-6"
                style={{ background: color }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right badge */}
      {isActive && (
        <span
          className="theme-card__text-1"
        >
          ACTIVE
        </span>
      )}
      {isLocked && (
        <span className="theme-card__text-2">🔒</span>
      )}
      {!isActive && !isLocked && (
        <span
          className="theme-card__text-3"
        >
          TAP
        </span>
      )}
    </button>
  );
}
