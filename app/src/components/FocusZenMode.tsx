import { useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '../design-system';
import { BgmControl } from './BgmControl';
import type { FocusTimerState } from '../hooks/useFocusTimer';
import type { BgmTrack } from '../services/bgm';
import { playSound } from '../services/sound';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface FocusZenModeProps {
  isDesktop: boolean;
  lang: 'en' | 'ja';
  mode: TimerMode;
  timerState: FocusTimerState;
  remaining: number;
  bgmOn: boolean;
  bgmTrack: BgmTrack;
  onBgmChange: (next: { bgmOn: boolean; track: BgmTrack }) => void;
  onBgmMenuOpenChange?: (open: boolean) => void;
  onClose: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkipBreak: () => void;
  onCompleteFocus: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function TimeDigits({ value }: { value: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {value.split('').map((ch, i) => (
        <span
          key={`${i}-${ch}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: ch === ':' ? '0.6ch' : '1ch',
          }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

export function FocusZenMode({
  isDesktop,
  lang,
  mode,
  timerState,
  remaining,
  bgmOn,
  bgmTrack,
  onBgmChange,
  onBgmMenuOpenChange,
  onClose,
  onStart,
  onPause,
  onResume,
  onSkipBreak,
  onCompleteFocus,
}: FocusZenModeProps) {
  const [visible, setVisible] = useState(true);
  const [entered, setEntered] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let id1: number, id2: number;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setEntered(true));
    });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const requestClose = () => {
    setEntered(false);
    closeTimerRef.current = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 250);
  };

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  if (!visible) return null;

  const isRunning = timerState === 'running';
  const isPaused = timerState === 'paused';
  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  const header = null;

  const body = (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '22px',
        padding: '20px 16px',
        background: 'var(--pd-color-background-default)',
      }}
    >
      {/* BGM menu above timer (pomodoro only) */}
      {mode === 'pomodoro' && (
        <div style={{ marginBottom: '8px' }}>
          <BgmControl
            lang={lang}
            bgmOn={bgmOn}
            track={bgmTrack}
            onChange={onBgmChange}
            onMenuOpenChange={onBgmMenuOpenChange}
            variant="zen"
          />
        </div>
      )}

      <div
        className="pd-focus-timer-display"
        style={{
          fontFamily: 'var(--pd-font-brand)',
          fontSize: 'clamp(4.5rem, 20vw, 8rem)',
          color: 'var(--pd-color-text-primary)',
          letterSpacing: '0.04em',
          lineHeight: 1,
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        <TimeDigits value={formatTime(remaining)} />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {timerState === 'idle' ? (
          <Button onClick={onStart} style={{ minWidth: '140px' }}>
            {lang === 'ja' ? '開始' : 'Start'}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={isRunning ? onPause : onResume}
              style={{ minWidth: '140px' }}
            >
              {isRunning
                ? (lang === 'ja' ? '一時停止' : 'Pause')
                : (lang === 'ja' ? '再開' : 'Resume')}
            </Button>
            {isBreakMode ? (
              <Button variant="secondary" onClick={onSkipBreak} style={{ minWidth: '140px' }}>
                {lang === 'ja' ? '休憩をスキップ' : 'Skip break'}
              </Button>
            ) : (
              <Button onClick={onCompleteFocus} style={{ minWidth: '140px' }}>
                {lang === 'ja' ? '完了' : 'Complete'}
              </Button>
            )}
          </>
        )}
      </div>

      {isPaused && (
        <div style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem', color: 'var(--pd-color-text-secondary)' }}>
          {lang === 'ja' ? '一時停止中' : 'Paused'}
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'ja' ? 'フォーカス（全画面）' : 'Focus (full screen)'}
        onClick={requestClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: 'var(--pd-color-overlay-backdrop)',
          opacity: entered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            transform: entered ? 'translateY(0)' : 'translateY(8px)',
            transition: 'transform 0.3s ease',
          }}
        >
          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1 }}>
            <IconButton
              variant="ghost"
              size="md"
              aria-label={lang === 'ja' ? '閉じる' : 'Close'}
              icon={<span style={{ fontFamily: 'var(--pd-font-body)', fontSize: '22px', lineHeight: 1 }}>×</span>}
              soundKey={null}
              onClick={() => { playSound('taskCancel'); requestClose(); }}
            />
          </div>
          {body}
        </div>
      </div>
    );
  }

  // Mobile: bottom-sheet-like slide up
  return (
    <>
      <div
        aria-hidden="true"
        onClick={requestClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: 'var(--pd-color-overlay-backdrop)',
          opacity: entered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'ja' ? 'フォーカス（全画面）' : 'Focus (full screen)'}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          top: 0,
          zIndex: 2001,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--pd-color-background-default)',
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1 }}>
          <IconButton
            variant="ghost"
            size="md"
            aria-label={lang === 'ja' ? '閉じる' : 'Close'}
            icon={<span style={{ fontFamily: 'var(--pd-font-body)', fontSize: '22px', lineHeight: 1 }}>×</span>}
            soundKey={null}
            onClick={() => { playSound('taskCancel'); requestClose(); }}
          />
        </div>
        {body}
      </div>
    </>
  );
}

