import { useEffect, useCallback } from 'react';
import { useNavigate } from '../../hooks/useNavigate';
import { ThemeHomePreview } from './ThemeHomePreview';
import { themes } from '../../design-system/themes/themeRegistry';
import type { ThemeKey } from '../../design-system/themes/themeRegistry';
import { getRandomThemeLimitedEffectKey } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { playSound } from '../../services/sound';
import { pricingPath } from '../../services/analytics';
import './ThemeSheetContent.css';

function ensureFontLink(url: string): void {
  const id = `pd-font-${btoa(url).slice(0, 16)}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

interface ThemeSheetContentProps {
  themeKey: ThemeKey;
  activeTheme: ThemeKey;
  isPremium: boolean;
  colorMode: 'light' | 'dark';
  changeTheme: (key: ThemeKey) => void;
  lang: 'en' | 'ja';
  onClose: () => void;
  indexLabel: string;
  onPrev: () => void;
  onNext: () => void;
  canPrevNext: boolean;
}

export function ThemeSheetContent({
  themeKey, activeTheme, isPremium, colorMode, changeTheme, lang, onClose,
  indexLabel, onPrev, onNext, canPrevNext,
}: ThemeSheetContentProps) {
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

  const bgColor = (previewVars as Record<string, string>)['--pd-color-background-default']
    ?? (previewVars as Record<string, string>)['--pd-sw-navy-950']
    ?? (previewVars as Record<string, string>)['--pd-fb-night-950']
    ?? 'var(--pd-color-background-default)';

  const triggerDemo = useCallback((taskEl: HTMLElement) => {
    playSound('buttonClick');
    playDemoEffect(getRandomThemeLimitedEffectKey(themeKey), taskEl);
  }, [themeKey]);

  const handleAction = () => {
    if (isLocked) { playSound('buttonClick'); onClose(); navigate(pricingPath('collection_theme')); return; }
    if (!isActive) { playSound('taskComplete'); changeTheme(themeKey); onClose(); }
  };

  const navBtnStyle: React.CSSProperties = {
    width: '44px',
    height: '36px',
    borderRadius: 0,
    border: '2px solid var(--pd-color-border-default)',
    background: 'var(--pd-color-background-elevated)',
    color: 'var(--pd-color-text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--pd-font-brand)',
    fontSize: 'var(--pd-font-size-sm)',
    opacity: canPrevNext ? 1 : 0.5,
  };

  return (
    <div className="theme-sheet-content__col-1">
      {/* Preview — theme vars scoped here */}
      <div className="theme-sheet-content__preview-theme-vars-scoped-he">
        <div
          className="theme-sheet-content__row-4"
          style={{ ...(previewVars as React.CSSProperties), background: bgColor }}
        >
          <ThemeHomePreview lang={lang} onTriggerEffect={triggerDemo} />
        </div>

        {/* Prev / Next + index */}
        <div className="theme-sheet-content__prev-next-index">
          <button type="button" onClick={onPrev} disabled={!canPrevNext}
            aria-label={lang === 'ja' ? '前のテーマ' : 'Previous theme'}
            style={navBtnStyle}
          >{'<'}</button>

          <div className="theme-sheet-content__text-1">
            {indexLabel}
          </div>

          <button type="button" onClick={onNext} disabled={!canPrevNext}
            aria-label={lang === 'ja' ? '次のテーマ' : 'Next theme'}
            style={navBtnStyle}
          >{'>'}</button>
        </div>
      </div>

      {/* Bottom dock */}
      <div className="theme-sheet-content__bottom-dock">
        {/* Name + badge */}
        <div className="theme-sheet-content__name-badge">
          <span className="theme-sheet-content__text-2">
            {theme.icon} {theme.name.toUpperCase()}
          </span>
          {theme.isPremium && (
            <span className="theme-sheet-content__text-3">
              PixDone+
            </span>
          )}
        </div>

        <div className="theme-sheet-content__col-2">
          {/* Description — always reserves 2 lines */}
          <p className="theme-sheet-content__text-5 theme-sheet-content__box-7" >
            {theme.description?.[lang] ?? ''}
          </p>

          {/* CTA */}
          <button
            type="button"
            onClick={handleAction}
            disabled={isActive && !isLocked}
            className={`theme-sheet-content__text-6${isActive ? ' theme-sheet-content__text-6--is-active' : ''}${isActive || isLocked ? ' theme-sheet-content__text-6--is-active-is-locked' : ''} theme-sheet-content__text-8${isLocked ? ' theme-sheet-content__text-8--is-locked' : ''}${isActive ? ' theme-sheet-content__text-8--is-active' : ''}`}
          >
            {isActive
              ? (lang === 'ja' ? '使用中' : 'ACTIVE')
              : isLocked
                ? (lang === 'ja' ? 'PixDone+ で解除' : 'UNLOCK WITH PIXDONE+')
                : (lang === 'ja' ? 'このテーマを使う' : 'SET ACTIVE')}
          </button>
        </div>
      </div>
    </div>
  );
}
