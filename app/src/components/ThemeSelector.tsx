import { useNavigate } from 'react-router-dom';
import { useUserTheme } from '../hooks/useUserTheme';
import { themeList } from '../design-system';
import type { ThemeKey } from '../design-system';
import type { ColorModePreference } from '../design-system/tokens';
import { playSound } from '../services/sound';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';

interface ThemeSelectorProps {
  onClose?: () => void;
  lang?: 'en' | 'ja';
}

const COLOR_MODES: { key: ColorModePreference; icon: string; labelEn: string; labelJa: string }[] = [
  { key: 'light',  icon: 'light_mode',      labelEn: 'LIGHT',  labelJa: 'ライト' },
  { key: 'dark',   icon: 'dark_mode',       labelEn: 'DARK',   labelJa: 'ダーク' },
  { key: 'system', icon: 'desktop_windows', labelEn: 'SYSTEM', labelJa: 'システム' },
];

export function ThemeSelector({ onClose, lang = 'en' }: ThemeSelectorProps) {
  const { visualTheme, changeTheme, colorModePreference, setColorMode } = useUserTheme();
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
        gap: '20px',
        padding: '4px 0',
      }}
    >
      {/* ── Color Mode Section ─────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p
          style={{
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.75rem',
            color: 'var(--pd-color-text-secondary)',
            letterSpacing: '1px',
            margin: 0,
          }}
        >
          COLOR MODE
        </p>
        <p
          style={{
            fontFamily: 'var(--pd-font-body)',
            fontSize: '0.75rem',
            color: 'var(--pd-color-text-secondary)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {lang === 'ja'
            ? 'ライト/ダーク、またはデバイス設定に連動'
            : 'Light, dark, or match your device settings'}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {COLOR_MODES.map((mode) => {
            const isActive = colorModePreference === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => { playSound('buttonClick'); setColorMode(mode.key); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 4px',
                  background: isActive
                    ? 'var(--pd-color-accent-subtle)'
                    : 'var(--pd-color-background-elevated)',
                  border: `2px solid ${isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-border-default)'}`,
                  borderRadius: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '0.7rem',
                  color: isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                  letterSpacing: '1px',
                  transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                }}
              >
                <span className="material-icons" style={{ fontSize: '1rem', lineHeight: 1 }}>{mode.icon}</span>
                {lang === 'ja' ? mode.labelJa : mode.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Theme List Section ─────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {themeList.map((theme) => {
            const isActive = theme.key === visualTheme;
            const isLocked = theme.isPremium ? !isPremium : false;

            return (
              <button
                key={theme.key}
                type="button"
                onClick={() => handleSelect(theme.key as ThemeKey, isLocked)}
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
                  cursor: 'pointer',
                  opacity: isLocked ? 0.65 : 1,
                  fontFamily: 'var(--pd-font-body)',
                  textAlign: 'left',
                  transition: 'background 0.15s, border-color 0.15s',
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
                <span style={{ flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--pd-font-brand)',
                      fontSize: '0.875rem',
                      color: isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                      letterSpacing: '1px',
                      lineHeight: 1.2,
                    }}
                  >
                    {theme.name}
                  </span>
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
                {isActive && !isLocked && (
                  <span style={{ color: 'var(--pd-color-accent-default)', fontSize: '0.75rem' }}>▶</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
