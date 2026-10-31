import { useNavigate } from 'react-router-dom';
import { useUserTheme } from '../hooks/useUserTheme';
import { themeList, PixelIcon } from '../design-system';
import type { ThemeKey } from '../design-system';
import type { ColorModePreference } from '../design-system/tokens';
import { playSound } from '../services/sound';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import './ThemeSelector.css';

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
      className="theme-selector__col-1"
    >
      {/* ── Color Mode Section ─────────────────────────── */}
      <div className="theme-selector__color-mode-section">
        <p
          className="theme-selector__text-1"
        >
          COLOR MODE
        </p>
        <p
          className="theme-selector__text-2"
        >
          {lang === 'ja'
            ? 'ライト/ダーク、またはデバイス設定に連動'
            : 'Light, dark, or match your device settings'}
        </p>
        <div className="theme-selector__row-1">
          {COLOR_MODES.map((mode) => {
            const isActive = colorModePreference === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => { playSound('buttonClick'); setColorMode(mode.key); }}
                className={`theme-selector__text-5${isActive ? ' theme-selector__text-5--is-active' : ''}`}
              >
                <PixelIcon name={mode.icon} size="1rem" />
                {lang === 'ja' ? mode.labelJa : mode.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Theme List Section ─────────────────────────── */}
      <div className="theme-selector__color-mode-section">
        <p
          className="theme-selector__text-1"
        >
          SELECT THEME
        </p>
        <div className="theme-selector__color-mode-section">
          {themeList.map((theme) => {
            const isActive = theme.key === visualTheme;
            const isLocked = theme.isPremium ? !isPremium : false;

            return (
              <button
                key={theme.key}
                type="button"
                onClick={() => handleSelect(theme.key as ThemeKey, isLocked)}
                className={`theme-selector__text-6${isActive ? ' theme-selector__text-6--is-active' : ''}${isLocked ? ' theme-selector__text-6--is-locked' : ''}`}
              >
                <span className="theme-selector__text-3">
                  {theme.icon}
                </span>
                <span className="theme-selector__box-1">
                  <span
                    className={`theme-selector__text-7${isActive ? ' theme-selector__text-7--is-active' : ''}`}
                  >
                    {theme.name}
                  </span>
                </span>
                {isLocked && (
                  <span
                    className="theme-selector__text-4"
                  >
                    🔒 PRO
                  </span>
                )}
                {isActive && !isLocked && (
                  <span className="theme-selector__row-2"><PixelIcon name="play" size="sm" /></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
