import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '../design-system';
import { BgmControl } from './BgmControl';
import type { FocusTimerState } from '../hooks/useFocusTimer';
import type { BgmTrack } from '../services/bgm';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

/** Align with BottomSheet.css: open 0.35s, close 0.25s */
const ZEN_SHEET_OPEN = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
const ZEN_SHEET_CLOSE = 'transform 0.25s cubic-bezier(0.4, 0, 1, 1)';
const ZEN_BACKDROP_OPEN = 'opacity 0.35s ease';
const ZEN_BACKDROP_CLOSE = 'opacity 0.25s ease';
const ZEN_CLOSE_MS = 280;

export interface FocusZenModeProps {
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
  const [isLeaving, setIsLeaving] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeStartedRef = useRef(false);

  useEffect(() => {
    let id1: number, id2: number;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setEntered(true));
    });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, []);

  const requestClose = useCallback(() => {
    if (closeStartedRef.current) return;
    closeStartedRef.current = true;
    setIsLeaving(true);
    setEntered(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setVisible(false);
      onClose();
    }, ZEN_CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [requestClose]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  if (!visible) return null;

  const isRunning = timerState === 'running';
  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

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
      {/* BGM: pomodoro only (breaks are completion-sound only, same as FocusScreen) */}
      {!isBreakMode && (
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
    </div>
  );

  const backdropTransition = isLeaving ? ZEN_BACKDROP_CLOSE : ZEN_BACKDROP_OPEN;
  const sheetTransition = isLeaving ? ZEN_SHEET_CLOSE : ZEN_SHEET_OPEN;

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
          transition: backdropTransition,
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
          transition: sheetTransition,
          paddingBottom: 'env(safe-area-inset-bottom)',
          pointerEvents: entered ? 'auto' : 'none',
          imageRendering: 'pixelated',
        }}
      >
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1 }}>
          <IconButton
            variant="ghost"
            size="md"
            aria-label={lang === 'ja' ? '閉じる' : 'Close'}
            icon={<span style={{ fontFamily: 'var(--pd-font-body)', fontSize: '22px', lineHeight: 1 }}>×</span>}
            soundKey={null}
            onClick={requestClose}
          />
        </div>
        {body}
      </div>
    </>
  );
}

