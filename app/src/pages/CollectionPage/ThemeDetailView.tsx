import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeHomePreview } from './ThemeHomePreview';
import { FullScreenSurface } from '../../design-system';
import { themes } from '../../design-system/themes/themeRegistry';
import type { ThemeKey } from '../../design-system/themes/themeRegistry';
import { getRandomThemeLimitedEffectKey } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { playSound } from '../../services/sound';
import { DetailViewHeader } from '../../components/SubPageHeader';
import { pricingPath } from '../../services/analytics';
import './ThemeDetailView.css';

function ensureFontLink(url: string): void {
  const id = `pd-font-${btoa(url).slice(0, 16)}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

interface ThemeDetailViewProps {
  themeKey: ThemeKey;
  activeTheme: ThemeKey;
  isPremium: boolean;
  colorMode: 'light' | 'dark';
  changeTheme: (key: ThemeKey) => void;
  lang: 'en' | 'ja';
  onClose: () => void;
}

export function ThemeDetailView({
  themeKey, activeTheme, isPremium, colorMode, changeTheme, lang, onClose,
}: ThemeDetailViewProps) {
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
    if (isLocked) { playSound('buttonClick'); navigate(pricingPath('collection_theme')); return; }
    if (!isActive) { playSound('taskComplete'); changeTheme(themeKey); onClose(); }
  };

  const bgColor = (previewVars as Record<string, string>)['--pd-color-background-default']
    ?? (previewVars as Record<string, string>)['--pd-sw-navy-950']
    ?? (previewVars as Record<string, string>)['--pd-fb-night-950']
    ?? 'var(--pd-color-background-default)';

  return (
    <FullScreenSurface className="theme-detail__col-1" data-pd-screen>
      {/* Header */}
      <DetailViewHeader
        title={<>{theme.icon} {theme.name.toUpperCase()}</>}
        isJa={lang === 'ja'}
        onBack={onClose}
      />

      {/* Demo area with theme vars */}
      <div className="theme-detail__row-4" style={{ ...(previewVars as React.CSSProperties), background: bgColor }}>
        <ThemeHomePreview
          lang={lang}
          onTriggerEffect={triggerDemo}
        />
      </div>

      {/* Info + CTA */}
      <div className="theme-detail__info-cta">
        <div className="theme-detail__row-1">
          <span className="theme-detail__text-1">
            {theme.icon} {theme.name}
          </span>
          {theme.isPremium && (
            <span className="theme-detail__text-2">
              PixDone+
            </span>
          )}
        </div>

        {theme.description && (
          <p className="theme-detail__text-3">
            {theme.description[lang]}
          </p>
        )}

        <button
          type="button"
          onClick={handleAction}
          disabled={isActive}
          className={`theme-detail__text-5${isActive ? ' theme-detail__text-5--is-active' : ''}${isActive || isLocked ? ' theme-detail__text-5--is-active-is-locked' : ''} theme-detail__text-6${isLocked ? ' theme-detail__text-6--is-locked' : ''}${isActive ? ' theme-detail__text-6--is-active' : ''}`}
        >
          {isActive
            ? (lang === 'ja' ? '使用中' : 'ACTIVE')
            : isLocked
              ? (lang === 'ja' ? 'PixDone+ で解除' : 'UNLOCK WITH PIXDONE+')
              : (lang === 'ja' ? 'このテーマを使う' : 'SET ACTIVE')}
        </button>
      </div>
    </FullScreenSurface>
  );
}
