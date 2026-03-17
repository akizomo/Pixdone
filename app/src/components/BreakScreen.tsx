import { Button } from '../design-system';
import { t } from '../lib/i18n';

export interface BreakScreenProps {
  lang: 'en' | 'ja';
  onSkip: () => void;
}

const BREAK_SECONDS = 5 * 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function BreakScreen({ lang, onSkip }: BreakScreenProps) {
  return (
    <div style={containerStyle}>
      {/* Header */}
      <h2 style={screenTitleStyle}>{t('breakTime', lang)}</h2>

      {/* Break timer */}
      <div style={timerBlockStyle}>
        <div style={timerDisplayStyle}>{formatTime(BREAK_SECONDS)}</div>
        <div style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.75rem', color: 'var(--pd-color-text-secondary)', marginTop: '8px', letterSpacing: '0.1em' }}>
          {lang === 'ja' ? '休憩中...' : 'ON BREAK...'}
        </div>
      </div>

      {/* Pixel Breaker canvas placeholder */}
      <div style={canvasPlaceholderStyle}>
        <div style={{ fontFamily: 'var(--pd-font-brand)', fontSize: '1rem', color: 'var(--pd-color-text-secondary)', letterSpacing: '0.1em', marginBottom: '8px' }}>
          PIXEL BREAKER
        </div>
        <div style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.75rem', color: 'var(--pd-color-text-secondary)' }}>
          {lang === 'ja' ? 'ゲームは近日公開予定' : 'Game coming soon'}
        </div>
        {/* Block grid preview */}
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', width: '240px' }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '16px',
                background: `hsl(${(i * 25) % 360}, 70%, 55%)`,
                border: '1px solid rgba(0,0,0,0.2)',
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>

      {/* Skip button */}
      <div style={{ textAlign: 'center' }}>
        <Button variant="secondary" onClick={onSkip}>{t('skipBreak', lang)}</Button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  minHeight: 0,
};

const screenTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--pd-font-brand)',
  fontSize: '1.25rem',
  color: 'var(--pd-color-text-secondary)',
  letterSpacing: '0.15em',
  textAlign: 'center',
};

const timerBlockStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  background: 'var(--pd-color-background-elevated)',
  border: '2px solid var(--pd-color-border-default)',
  boxShadow: '3px 3px 0 var(--pd-color-shadow-default)',
};

const timerDisplayStyle: React.CSSProperties = {
  fontFamily: 'var(--pd-font-brand)',
  fontSize: '3rem',
  color: 'var(--pd-color-text-primary)',
  letterSpacing: '0.05em',
  lineHeight: 1,
};

const canvasPlaceholderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px',
  background: 'var(--pd-color-background-elevated)',
  border: '2px solid var(--pd-color-border-default)',
  boxShadow: '3px 3px 0 var(--pd-color-shadow-default)',
  minHeight: '180px',
  justifyContent: 'center',
};
