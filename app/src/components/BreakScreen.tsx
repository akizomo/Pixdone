import { Button } from '../design-system';
import { t } from '../lib/i18n';
import './BreakScreen.css';

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
    <div className="pd-break">
      <h2 className="pd-break__title">{t('breakTime', lang)}</h2>

      <div className="pd-break__timer-block">
        <div className="pd-break__timer-display">{formatTime(BREAK_SECONDS)}</div>
        <div className="pd-break__timer-label">
          {lang === 'ja' ? '休憩中...' : 'ON BREAK...'}
        </div>
      </div>

      <div className="pd-break__canvas">
        <div className="pd-break__canvas-title">PIXEL BREAKER</div>
        <div className="pd-break__canvas-subtitle">
          {lang === 'ja' ? 'ゲームは近日公開予定' : 'Game coming soon'}
        </div>
        <div className="pd-break__block-grid">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="pd-break__block"
              style={{ background: `hsl(${(i * 25) % 360}, 70%, 55%)` }}
            />
          ))}
        </div>
      </div>

      <div className="pd-break__skip">
        <Button variant="secondary" onClick={onSkip}>{t('skipBreak', lang)}</Button>
      </div>
    </div>
  );
}
