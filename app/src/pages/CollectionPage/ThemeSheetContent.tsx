import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeHomePreview } from './ThemeHomePreview';
import { themes } from '../../design-system/themes/themeRegistry';
import type { ThemeKey } from '../../design-system/themes/themeRegistry';
import { getRandomThemeLimitedEffectKey } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { playSound } from '../../services/sound';

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
    if (isLocked) { playSound('buttonClick'); onClose(); navigate('/pricing'); return; }
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
    fontSize: '0.875rem',
    opacity: canPrevNext ? 1 : 0.5,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Preview — theme vars scoped here */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            ...(previewVars as React.CSSProperties),
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 16px',
            background: bgColor,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <ThemeHomePreview lang={lang} onTriggerEffect={triggerDemo} />
        </div>

        {/* Prev / Next + index */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '10px 12px',
        }}>
          <button type="button" onClick={onPrev} disabled={!canPrevNext}
            aria-label={lang === 'ja' ? '前のテーマ' : 'Previous theme'}
            style={navBtnStyle}
          >{'<'}</button>

          <div style={{
            flex: 1, textAlign: 'center',
            fontFamily: 'var(--pd-font-brand)', fontSize: '0.6875rem',
            letterSpacing: '1px', color: 'var(--pd-color-text-secondary)',
          }}>
            {indexLabel}
          </div>

          <button type="button" onClick={onNext} disabled={!canPrevNext}
            aria-label={lang === 'ja' ? '次のテーマ' : 'Next theme'}
            style={navBtnStyle}
          >{'>'}</button>
        </div>
      </div>

      {/* Bottom dock */}
      <div style={{
        flexShrink: 0,
        background: 'var(--pd-color-background-default)',
        borderTop: '2px solid var(--pd-color-border-default)',
      }}>
        {/* Name + badge */}
        <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--pd-font-brand)', fontSize: '1.125rem',
            letterSpacing: '1px', color: 'var(--pd-color-text-primary)', lineHeight: 1.2,
          }}>
            {theme.icon} {theme.name.toUpperCase()}
          </span>
          {theme.isPremium && (
            <span style={{
              fontSize: '0.5625rem', fontFamily: 'var(--pd-font-brand)', letterSpacing: '1px',
              padding: '2px 6px', border: '1px solid var(--pd-color-border-default)',
              color: 'var(--pd-color-text-secondary)', flexShrink: 0,
            }}>
              PixDone+
            </span>
          )}
        </div>

        <div style={{ padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Description — always reserves 2 lines */}
          <p style={{
            margin: 0, fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
            color: 'var(--pd-color-text-secondary)', lineHeight: 1.5,
            display: '-webkit-box', WebkitBoxOrient: 'vertical' as unknown as 'vertical',
            WebkitLineClamp: 2, overflow: 'hidden', minHeight: '2.45rem',
          }}>
            {theme.description?.[lang] ?? ''}
          </p>

          {/* CTA */}
          <button
            type="button"
            onClick={handleAction}
            disabled={isActive && !isLocked}
            style={{
              width: '100%', padding: '10px 12px',
              fontFamily: 'var(--pd-font-brand)', fontSize: '0.8125rem',
              letterSpacing: '1px', borderRadius: 0,
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
              ? (lang === 'ja' ? '▶ 使用中' : '▶ ACTIVE')
              : isLocked
                ? (lang === 'ja' ? 'PixDone+ で解除' : 'UNLOCK WITH PIXDONE+')
                : (lang === 'ja' ? 'このテーマを使う' : 'SET ACTIVE')}
          </button>
        </div>
      </div>
    </div>
  );
}
