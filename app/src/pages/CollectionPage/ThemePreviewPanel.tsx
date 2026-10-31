import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeHomePreview } from './ThemeHomePreview';
import { themes } from '../../design-system/themes/themeRegistry';
import type { ThemeKey } from '../../design-system/themes/themeRegistry';
import { getRandomThemeLimitedEffectKey } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { playSound } from '../../services/sound';
import './ThemePreviewPanel.css';

function ensureFontLink(url: string): void {
  const id = `pd-font-${btoa(url).slice(0, 16)}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

interface ThemePreviewPanelProps {
  themeKey: ThemeKey;
  activeTheme: ThemeKey;
  isPremium: boolean;
  colorMode: 'light' | 'dark';
  changeTheme: (key: ThemeKey) => void;
  lang: 'en' | 'ja';
  /** Desktop right-panel preview should hide the bottom title row */
  isDesktop?: boolean;
}

export function ThemePreviewPanel({
  themeKey, activeTheme, isPremium, colorMode, changeTheme, lang, isDesktop = false,
}: ThemePreviewPanelProps) {
  const navigate = useNavigate();

  const theme = themes[themeKey];
  const isActive = themeKey === activeTheme;
  const isLocked = theme.isPremium && !isPremium;

  useEffect(() => {
    if (theme.fontImportUrl) ensureFontLink(theme.fontImportUrl);
  }, [theme.fontImportUrl]);

  const previewVars = theme.cssVariables[colorMode]
    ?? theme.cssVariables.dark
    ?? theme.cssVariables.light
    ?? {};

  const triggerDemo = useCallback((taskEl: HTMLElement) => {
    playSound('buttonClick');
    playDemoEffect(getRandomThemeLimitedEffectKey(themeKey), taskEl);
  }, [themeKey]);

  const handleAction = () => {
    if (isLocked) { playSound('buttonClick'); navigate('/pricing'); return; }
    if (!isActive) { playSound('taskComplete'); changeTheme(themeKey); }
  };

  const bgColor = previewVars['--pd-color-background-default']
    ?? (previewVars as Record<string, string>)['--pd-sw-navy-950']
    ?? (previewVars as Record<string, string>)['--pd-fb-night-950']
    ?? 'var(--pd-color-background-default)';

  return (
    <div className="theme-preview-panel__col-1">
      {/* Demo area — theme vars applied as inline styles */}
      <div
        style={{
          ...(previewVars as React.CSSProperties),
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          background: bgColor,
        }}
      >
        <ThemeHomePreview
          lang={lang}
          onTriggerEffect={triggerDemo}
        />
      </div>

      {/* Info + CTA */}
      <div className="theme-preview-panel__info-cta">
        {/* Desktop: hide only the title row (theme name) */}
        {!isDesktop && (
          <div className="theme-preview-panel__row-1">
            <span className="theme-preview-panel__text-1">
              {theme.icon} {theme.name}
            </span>
            {theme.isPremium && (
              <span className="theme-preview-panel__text-2">
                PixDone+
              </span>
            )}
          </div>
        )}

        {theme.description && (
          <p className="theme-preview-panel__text-3">
            {theme.description[lang]}
          </p>
        )}

        <button
          type="button"
          onClick={handleAction}
          disabled={isActive}
          style={{
            padding: '10px 12px',
            fontFamily: 'var(--pd-font-brand)',
            fontSize: 'var(--pd-font-size-sm)',
            letterSpacing: '2px',
            cursor: isActive ? 'default' : 'pointer',
            background: isActive
              ? 'var(--pd-color-accent-subtle)'
              : isLocked
                ? 'var(--pd-color-background-elevated)'
                : 'var(--pd-color-accent-default)',
            color: isActive
              ? 'var(--pd-color-accent-default)'
              : isLocked
                ? 'var(--pd-color-text-primary)'
                : 'var(--pd-color-background-default)',
            border: `2px solid ${isActive || isLocked ? 'var(--pd-color-border-default)' : 'transparent'}`,
          }}
        >
          {isActive
            ? (lang === 'ja' ? '使用中' : 'ACTIVE')
            : isLocked
              ? (lang === 'ja' ? 'PixDone+ で解除' : 'UNLOCK WITH PIXDONE+')
              : (lang === 'ja' ? 'このテーマを使う' : 'SET ACTIVE')}
        </button>
      </div>
    </div>
  );
}
