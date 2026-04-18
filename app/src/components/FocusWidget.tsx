import { useState } from 'react';
import { PixelIcon } from '../design-system';
import { playSound } from '../services/sound';
import { BgmControl } from './BgmControl';
import type { FocusTimerState } from '../hooks/useFocusTimer';
import type { BgmTrack } from '../services/bgm';
import './FocusWidget.css';

export interface FocusWidgetProps {
  lang: 'en' | 'ja';
  timerState: FocusTimerState;
  remaining: number;
  bgmOn: boolean;
  bgmTrack: BgmTrack;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onBgmChange: (next: { bgmOn: boolean; track: BgmTrack }) => void;
  onOpenZen: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FocusWidget({
  lang,
  timerState,
  remaining,
  bgmOn,
  bgmTrack,
  onStart,
  onPause,
  onResume,
  onSkip,
  onBgmChange,
  onOpenZen,
}: FocusWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = timerState === 'running';
  const isIdle = timerState === 'idle';

  // Collapsed: timer icon (+ time if running)
  if (!expanded) {
    return (
      <button
        type="button"
        className="pd-focus-widget pd-focus-widget--collapsed"
        onClick={() => { playSound('buttonClick'); setExpanded(true); }}
        aria-label={lang === 'ja' ? 'フォーカスタイマー' : 'Focus timer'}
      >
        <PixelIcon name="timer" size="20px" />
        {!isIdle && (
          <span className="pd-focus-widget__mini-time">{formatTime(remaining)}</span>
        )}
      </button>
    );
  }

  // Expanded
  return (
    <div className="pd-focus-widget pd-focus-widget--expanded">
      {/* Timer display */}
      <div className="pd-focus-widget__time">{formatTime(remaining)}</div>

      {/* Controls */}
      <div className="pd-focus-widget__controls">
        {/* Play / Pause */}
        <button
          type="button"
          className="pd-focus-widget__btn"
          onClick={() => {
            if (isIdle) onStart();
            else if (isRunning) onPause();
            else onResume();
          }}
          aria-label={isRunning ? 'Pause' : 'Start'}
        >
          <PixelIcon name={isRunning ? 'pause' : 'play'} size="16px" />
        </button>

        {/* Skip */}
        <button
          type="button"
          className="pd-focus-widget__btn"
          onClick={() => { playSound('buttonClick'); onSkip(); }}
          aria-label="Skip"
        >
          <PixelIcon name="skip_next" size="16px" />
        </button>

        {/* BGM */}
        <BgmControl
          lang={lang}
          bgmOn={bgmOn}
          track={bgmTrack}
          onChange={onBgmChange}
          variant="ghost"
        />

        {/* Fullscreen */}
        <button
          type="button"
          className="pd-focus-widget__btn"
          onClick={() => { playSound('buttonClick'); onOpenZen(); }}
          aria-label="Fullscreen"
        >
          <PixelIcon name="fullscreen" size="16px" />
        </button>

        {/* Close → collapse to icon */}
        <button
          type="button"
          className="pd-focus-widget__btn"
          onClick={() => { playSound('buttonClick'); setExpanded(false); }}
          aria-label="Close"
        >
          <PixelIcon name="close" size="14px" />
        </button>
      </div>
    </div>
  );
}
