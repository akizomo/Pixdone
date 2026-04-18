import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, IconButton, PixelIcon } from '../design-system';
import { BgmControl } from './BgmControl';
import { PacmanProgress } from './PacmanProgress';
import type { FocusTimerState } from '../hooks/useFocusTimer';
import type { BgmTrack } from '../services/bgm';
import './FocusZenMode.css';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

const ZEN_CLOSE_MS = 280;

export interface FocusZenModeProps {
  lang: 'en' | 'ja';
  mode: TimerMode;
  timerState: FocusTimerState;
  remaining: number;
  totalSeconds?: number;
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
  totalSeconds = 25 * 60,
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
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  if (!visible) return null;

  const isRunning = timerState === 'running';
  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  const backdropClass = [
    'pd-zen-backdrop',
    entered ? 'pd-zen-backdrop--entered' : '',
    isLeaving ? 'pd-zen-backdrop--leaving' : '',
  ].filter(Boolean).join(' ');

  const dialogClass = [
    'pd-zen-dialog',
    entered ? 'pd-zen-dialog--entered' : '',
    isLeaving ? 'pd-zen-dialog--leaving' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} aria-hidden="true" onClick={requestClose} />
      <div
        className={dialogClass}
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'ja' ? 'フォーカス（全画面）' : 'Focus (full screen)'}
      >
        <div className="pd-zen-close">
          <IconButton
            variant="ghost"
            size="md"
            aria-label={lang === 'ja' ? '閉じる' : 'Close'}
            icon={<PixelIcon name="shrink" size="22px" />}
            soundKey={null}
            onClick={requestClose}
          />
        </div>
        <div className="pd-zen-body">
          {!isBreakMode && (
            <div className="pd-zen-bgm">
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

          <div className="pd-zen-timer">
            <TimeDigits value={formatTime(remaining)} />
          </div>

          {!isBreakMode && (
            <div className="pd-zen-progress">
              <PacmanProgress
                remaining={remaining}
                totalSeconds={totalSeconds}
                timerState={timerState}
              />
            </div>
          )}

          <div className="pd-zen-actions">
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
                  <Button variant="secondary" soundKey="taskCancel" onClick={onSkipBreak} style={{ minWidth: '140px' }}>
                    {lang === 'ja' ? '休憩をスキップ' : 'Skip break'}
                  </Button>
                ) : (
                  <Button soundKey="taskComplete" onClick={onCompleteFocus} style={{ minWidth: '140px' }}>
                    {lang === 'ja' ? '完了' : 'Complete'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
