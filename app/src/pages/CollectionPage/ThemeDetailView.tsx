import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeHomePreview } from './ThemeHomePreview';
import { themes } from '../../design-system/themes/themeRegistry';
import type { ThemeKey } from '../../design-system/themes/themeRegistry';
import { getRandomThemeLimitedEffectKey } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { playSound } from '../../services/sound';
import { PixelIcon } from '../../design-system';

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
    if (isLocked) { playSound('buttonClick'); navigate('/pricing'); return; }
    if (!isActive) { playSound('taskComplete'); changeTheme(themeKey); onClose(); }
  };

  const bgColor = (previewVars as Record<string, string>)['--pd-color-background-default']
    ?? (previewVars as Record<string, string>)['--pd-sw-navy-950']
    ?? (previewVars as Record<string, string>)['--pd-fb-night-950']
    ?? 'var(--pd-color-background-default)';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--pd-color-background-default)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--pd-color-border-default)',
        gap: '12px',
        flexShrink: 0,
      }}>
        <button type="button" onClick={() => { playSound('taskCancel'); onClose(); }} aria-label={lang === 'ja' ? '戻る' : 'Back'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--pd-color-text-primary)' }}>
          <PixelIcon name="arrow_back" size="24px" />
        </button>
        <span style={{ fontFamily: 'var(--pd-font-brand)', fontSize: '0.875rem', letterSpacing: '1px', color: 'var(--pd-color-text-primary)' }}>
          {theme.icon} {theme.name.toUpperCase()}
        </span>
      </div>

      {/* Demo area with theme vars */}
      <div style={{
        ...(previewVars as React.CSSProperties),
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: bgColor,
      }}>
        <ThemeHomePreview
          lang={lang}
          onTriggerEffect={triggerDemo}
        />
      </div>

      {/* Info + CTA */}
      <div style={{
        padding: '20px 16px',
        borderTop: '1px solid var(--pd-color-border-default)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--pd-font-brand)', fontSize: '1rem', letterSpacing: '1px', color: 'var(--pd-color-text-primary)' }}>
            {theme.icon} {theme.name}
          </span>
          {theme.isPremium && (
            <span style={{ fontSize: '0.625rem', fontFamily: 'var(--pd-font-brand)', letterSpacing: '1px', padding: '2px 8px', border: '1px solid var(--pd-color-border-default)', color: 'var(--pd-color-text-secondary)' }}>
              PixDone+
            </span>
          )}
        </div>

        {theme.description && (
          <p style={{
            margin: 0,
            fontFamily: 'var(--pd-font-body)',
            fontSize: '0.875rem',
            color: 'var(--pd-color-text-secondary)',
            lineHeight: 1.5,
          }}>
            {theme.description[lang]}
          </p>
        )}

        <button
          type="button"
          onClick={handleAction}
          disabled={isActive}
          style={{
            padding: '12px',
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.875rem',
            letterSpacing: '2px',
            cursor: isActive ? 'default' : 'pointer',
            background: isActive ? 'var(--pd-color-accent-subtle)' : isLocked ? 'var(--pd-color-background-elevated)' : 'var(--pd-color-accent-default)',
            color: isActive ? 'var(--pd-color-accent-default)' : isLocked ? 'var(--pd-color-text-primary)' : 'var(--pd-color-background-default)',
            border: `2px solid ${isActive || isLocked ? 'var(--pd-color-border-default)' : 'transparent'}`,
            marginTop: '4px',
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
  );
}
