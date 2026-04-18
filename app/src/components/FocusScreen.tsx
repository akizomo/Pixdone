import { Button, Chip, IconButton, PixelIcon } from '../design-system';
import { t } from '../lib/i18n';
import { PixelBreaker } from './PixelBreaker';
import { PacmanProgress } from './PacmanProgress';
import { BgmControl } from './BgmControl';
import type { List } from '../types/list';
import type { FocusTimerState } from '../hooks/useFocusTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import type { BgmTrack } from '../services/bgm';
import './FocusScreen.css';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface FocusScreenProps {
  lists: List[];
  lang: 'en' | 'ja';
  onCompleteTask?: (taskId: string) => void;
  onEditTask?: (taskId: string) => void;
  mode: TimerMode;
  minutes: number;
  pomodoroCount: number;
  timerState: FocusTimerState;
  remaining: number;
  bgmOn: boolean;
  bgmTrack: BgmTrack;
  onBgmChange: (next: { bgmOn: boolean; track: BgmTrack }) => void;
  onBgmMenuOpenChange?: (open: boolean) => void;
  onOpenZenMode: () => void;
  onSwitchMode: (m: TimerMode) => void;
  onAdjustMinutes: (deltaMinutes: number) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkipBreak: () => void;
  onCompleteFocus: () => void;
  canAdjustMinutes?: boolean;
  onTutorialSmashLinkClick?: () => void;
  onTutorialFocusLinkClick?: () => void;
}

const MODES: TimerMode[] = ['pomodoro', 'shortBreak', 'longBreak'];

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

export function FocusScreen({
  lang, mode, minutes, timerState, remaining,
  bgmOn, bgmTrack, onBgmChange, onBgmMenuOpenChange, onOpenZenMode,
  onSwitchMode, onAdjustMinutes, onStart, onPause, onResume, onSkipBreak,
  onCompleteFocus, canAdjustMinutes = true,
}: FocusScreenProps) {
  useWakeLock(timerState === 'running');
  const SMALL_STEPS = [1, 3, 5] as const;

  const nextMinutesByArrow = (current: number, dir: -1 | 1): number => {
    if (current < 5) {
      const sorted = [...SMALL_STEPS];
      const idx = sorted.findIndex((v) => v === current);
      if (idx === -1) {
        if (dir === 1) return current <= 1 ? 1 : current <= 3 ? 3 : 5;
        return current <= 1 ? 1 : current <= 3 ? 1 : 3;
      }
      const nextIdx = Math.max(0, Math.min(sorted.length - 1, idx + dir));
      return sorted[nextIdx];
    }
    if (current === 5) return dir === 1 ? 10 : 3;
    if (dir === 1) return current + 5;
    return Math.max(5, current - 5);
  };

  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';
  const isRunning = timerState === 'running';
  const isPaused = timerState === 'paused';

  return (
    <div className="pd-focus">
      {/* Timer panel */}
      <div className="pd-focus__timer-block">
        <div className="pd-focus__top-actions">
          <div className="pd-focus__top-actions-inner">
            <IconButton
              variant="ghost" size="sm"
              aria-label={lang === 'ja' ? '全画面でフォーカス' : 'Full screen focus'}
              icon={<PixelIcon name="fullscreen" size="18px" />}
              onClick={onOpenZenMode}
            />
            {mode === 'pomodoro' && (
              <BgmControl lang={lang} bgmOn={bgmOn} track={bgmTrack} onChange={onBgmChange} onMenuOpenChange={onBgmMenuOpenChange} variant="ghost" />
            )}
          </div>
        </div>

        <div className="pd-focus__timer-body">
          <div
            aria-hidden={timerState !== 'idle'}
            className={`pd-focus__mode-chips${timerState !== 'idle' ? ' pd-focus__mode-chips--hidden' : ''}`}
          >
            {MODES.map((m) => (
              <Chip key={m} selected={mode === m} onClick={() => onSwitchMode(m)}>{t(m, lang)}</Chip>
            ))}
          </div>

          {timerState === 'idle' ? (
            <div className="pd-focus__adjust-row">
              <div className="pd-focus__adjust-inner">
                {canAdjustMinutes && (
                  <AdjustButton direction="down" onClick={() => { const next = nextMinutesByArrow(minutes, -1); onAdjustMinutes(next - minutes); }} />
                )}
                <div className="pd-focus__timer-display"><TimeDigits value={formatTime(remaining)} /></div>
                {canAdjustMinutes && (
                  <AdjustButton direction="up" onClick={() => { const next = nextMinutesByArrow(minutes, 1); onAdjustMinutes(next - minutes); }} />
                )}
              </div>
              {!canAdjustMinutes && (
                <p className="pd-focus__login-hint">{t('focusDurationLoginHint', lang)}</p>
              )}
            </div>
          ) : (
            <div className="pd-focus__timer-display"><TimeDigits value={formatTime(remaining)} /></div>
          )}

          {mode === 'pomodoro' && (
            <div className="pd-focus__progress">
              <PacmanProgress remaining={remaining} totalSeconds={minutes * 60} timerState={timerState} />
            </div>
          )}

          <div className="pd-focus__cta">
            {timerState === 'idle' ? (
              <Button onClick={onStart} style={{ minWidth: '120px' }}>Start</Button>
            ) : (
              <div className="pd-focus__cta-row">
                <Button variant="secondary" onClick={isRunning ? onPause : onResume}>
                  {isRunning ? (lang === 'ja' ? '一時停止' : 'Pause') : (lang === 'ja' ? '再開' : 'Resume')}
                </Button>
                {isBreakMode ? (
                  <Button variant="secondary" soundKey="taskCancel" onClick={onSkipBreak}>{t('skipBreak', lang)}</Button>
                ) : (
                  <Button soundKey="taskComplete" onClick={onCompleteFocus}>{lang === 'ja' ? '完了' : 'Complete'}</Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Break game */}
      {isBreakMode && (isRunning || isPaused) && (
        <div className="pd-focus__break-game">
          <p className="pd-focus__break-pitch">{t('breakGamePitch', lang)}</p>
          <PixelBreaker lang={lang} />
        </div>
      )}

    </div>
  );
}

function AdjustButton({ onClick, direction }: { onClick: () => void; direction: 'up' | 'down' }) {
  const labelJa = direction === 'up' ? '時間を増やす' : '時間を減らす';
  const labelEn = direction === 'up' ? 'Increase minutes' : 'Decrease minutes';
  const symbol = direction === 'up' ? '▲' : '▼';
  return (
    <IconButton
      variant="ghost" size="sm"
      aria-label={labelJa + ' / ' + labelEn}
      icon={<span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{symbol}</span>}
      onClick={onClick}
    />
  );
}
