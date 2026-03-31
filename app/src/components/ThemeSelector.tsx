import { useNavigate } from 'react-router-dom';
import { useUserTheme } from '../hooks/useUserTheme';
import { themeList } from '../design-system';
import type { ThemeKey } from '../design-system';
import { playSound } from '../services/sound';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';

interface ThemeSelectorProps {
  onClose?: () => void;
}

export function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const { visualTheme, changeTheme, colorMode, toggleColorMode } = useUserTheme();
  const { isPremium } = useThemeEntitlements();
  const navigate = useNavigate();

  const handleSelect = (key: ThemeKey, isLocked: boolean) => {
    if (isLocked) {
      playSound('buttonClick');
      onClose?.();
      navigate('/pricing');
      return;
    }
    playSound('taskComplete');
    changeTheme(key);
    onClose?.();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '4px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p
          style={{
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.75rem',
            color: 'var(--pd-color-text-secondary)',
            letterSpacing: '1px',
            margin: 0,
          }}
        >
          SELECT THEME
        </p>
        <button
          type="button"
          onClick={() => { playSound('buttonClick'); toggleColorMode(); }}
          aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'var(--pd-color-background-elevated)',
            border: '2px solid var(--pd-color-border-default)',
            borderRadius: 0,
            cursor: 'pointer',
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.7rem',
            color: 'var(--pd-color-text-primary)',
            letterSpacing: '1px',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>
            {colorMode === 'dark' ? '☀' : '🌙'}
          </span>
          {colorMode === 'dark' ? 'LIGHT' : 'DARK'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {themeList.map((theme) => {
          const isActive = theme.key === visualTheme;
          const isComingSoon = theme.key === 'synthwave';
          const isLocked = !isComingSoon && (theme.isPremium ? !isPremium : false);

          return (
            <button
              key={theme.key}
              type="button"
              disabled={isComingSoon}
              onClick={() => !isComingSoon && handleSelect(theme.key as ThemeKey, isLocked)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: isActive
                  ? 'var(--pd-color-accent-subtle)'
                  : 'var(--pd-color-background-elevated)',
                border: `2px solid ${isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-border-default)'}`,
                borderRadius: '0',
                cursor: isComingSoon ? 'default' : 'pointer',
                opacity: isComingSoon ? 0.5 : isLocked ? 0.65 : 1,
                fontFamily: 'var(--pd-font-body)',
                textAlign: 'left',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{theme.icon}</span>
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--pd-font-brand)',
                    fontSize: '0.875rem',
                    color: isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                    letterSpacing: '1px',
                  }}
                >
                  {theme.name}
                </span>
                {isComingSoon && (
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--pd-font-brand)',
                      fontSize: '0.625rem',
                      letterSpacing: '1px',
                      color: 'var(--pd-color-text-muted)',
                      marginTop: '2px',
                    }}
                  >
                    COMING SOON
                  </span>
                )}
              </span>
              {isLocked && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--pd-color-text-secondary)',
                    background: 'var(--pd-color-background-default)',
                    border: '1px solid var(--pd-color-border-default)',
                    padding: '2px 6px',
                    fontFamily: 'var(--pd-font-brand)',
                    letterSpacing: '1px',
                  }}
                >
                  🔒 PRO
                </span>
              )}
              {isActive && !isLocked && !isComingSoon && (
                <span style={{ color: 'var(--pd-color-accent-default)', fontSize: '0.75rem' }}>▶</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
