import { useState } from 'react';
import { useUserTheme } from '../hooks/useUserTheme';
import { themeList } from '../design-system';
import type { ThemeKey } from '../design-system';
import { playSound } from '../services/sound';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';

interface ThemeSelectorProps {
  onClose?: () => void;
}

export function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const { visualTheme, changeTheme } = useUserTheme();
  const { synthwavePremium } = useThemeEntitlements();
  const [unlocking, setUnlocking] = useState(false);

  const handleSelect = async (key: ThemeKey, isLocked: boolean) => {
    // Premium locked path -> start checkout.
    if (isLocked) {
      if (key !== 'synthwave') return;
      setUnlocking(true);
      try {
        playSound('buttonClick');
        const resp = await fetch('/api/billing/synthwave/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ themeKey: 'synthwave' }),
        });
        if (!resp.ok) throw new Error('checkout_session_failed');
        const data = (await resp.json()) as { checkoutUrl?: string };
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      } catch {
        // Keep selection locked; show nothing for now.
      } finally {
        setUnlocking(false);
      }
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
          const isLocked = theme.isPremium && theme.key === 'synthwave' ? !synthwavePremium : theme.isPremium;

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
                cursor: isLocked ? (unlocking ? 'progress' : 'pointer') : 'pointer',
                opacity: isLocked ? 0.65 : 1,
                fontFamily: 'var(--pd-font-body)',
                textAlign: 'left',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{theme.icon}</span>
              <span
                style={{
                  flex: 1,
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '0.875rem',
                  color: isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                  letterSpacing: '1px',
                }}
              >
                {theme.name}
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
  );
}
