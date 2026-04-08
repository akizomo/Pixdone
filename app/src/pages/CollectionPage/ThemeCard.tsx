import type { VisualTheme } from '../../design-system/themes/themeRegistry';

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
    vars['--pxd-sw-navy-950'],
    vars['--pxd-sw-navy-800'],
    vars['--pxd-fb-night-950'],
    vars['--pxd-fb-night-700'],
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        background: isActive
          ? 'var(--pd-color-accent-subtle)'
          : 'var(--pd-color-background-elevated)',
        border: `2px solid ${isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-border-default)'}`,
        borderRadius: 0,
        cursor: 'pointer',
        textAlign: 'left',
        opacity: isLocked ? 0.7 : 1,
        width: '100%',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Theme icon */}
      <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{theme.icon}</span>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.9375rem',
            letterSpacing: '1px',
            color: isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
            marginBottom: '6px',
          }}
        >
          {theme.name}
        </div>
        {/* Color swatches */}
        {swatches.length > 0 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {swatches.map((color, i) => (
              <span
                key={i}
                style={{
                  width: '16px',
                  height: '16px',
                  background: color,
                  border: '1px solid var(--pd-color-border-default)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right badge */}
      {isActive && (
        <span
          style={{
            fontSize: '0.625rem',
            fontFamily: 'var(--pd-font-brand)',
            letterSpacing: '1px',
            color: 'var(--pd-color-accent-default)',
            flexShrink: 0,
          }}
        >
          ▶ ACTIVE
        </span>
      )}
      {isLocked && (
        <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>🔒</span>
      )}
      {!isActive && !isLocked && (
        <span
          style={{
            fontSize: '0.625rem',
            color: 'var(--pd-color-text-secondary)',
            fontFamily: 'var(--pd-font-brand)',
            letterSpacing: '1px',
            flexShrink: 0,
          }}
        >
          TAP →
        </span>
      )}
    </button>
  );
}
