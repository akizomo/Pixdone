import { useState, useCallback } from 'react';
import { Button, Chip } from '../design-system';
import { t } from '../lib/i18n';
import { getTodayYMD } from '../lib/date';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { PixelBreaker } from './PixelBreaker';
import { BgmControl } from './BgmControl';
import { startBgm, stopBgm, isBgmOn, getBgmTrack } from '../services/bgm';
import type { List } from '../types/list';
import type { Task } from '../types/task';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface FocusScreenProps {
  lists: List[];
  lang: 'en' | 'ja';
  onCompleteTask: (taskId: string) => void;
}

const MODE_DEFAULTS: Record<TimerMode, number> = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
};

const MODES: TimerMode[] = ['pomodoro', 'shortBreak', 'longBreak'];
const MIN_MINUTES = 1;
const MAX_MINUTES = 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FocusScreen({ lists, lang, onCompleteTask }: FocusScreenProps) {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [minutes, setMinutes] = useState(MODE_DEFAULTS.pomodoro);

  const handleTimerEnd = useCallback(() => {
    if (mode === 'pomodoro') {
      // Auto-switch to short break when pomodoro ends
      const next: TimerMode = 'shortBreak';
      setMode(next);
      setMinutes(MODE_DEFAULTS[next]);
      timer.reset(MODE_DEFAULTS[next] * 60);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const timer = useFocusTimer(handleTimerEnd);
  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    const m = MODE_DEFAULTS[newMode];
    setMinutes(m);
    timer.reset(m * 60);
    stopBgm(); // BGM stops on any mode switch (break or cancel)
  };

  const adjustMinutes = (delta: number) => {
    if (timer.timerState !== 'idle') return;
    const next = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, minutes + delta));
    setMinutes(next);
    timer.reset(next * 60);
  };

  const handleComplete = () => {
    switchMode('shortBreak'); // stopBgm called inside switchMode
  };

  const handleStart = () => {
    timer.start();
    if (mode === 'pomodoro' && isBgmOn()) startBgm(getBgmTrack());
  };

  const handlePause = () => {
    timer.pause();
    stopBgm();
  };

  const handleResume = () => {
    timer.resume();
    if (mode === 'pomodoro' && isBgmOn()) startBgm(getBgmTrack());
  };

  const handleGameEnd = () => {
    setShowGame(false);
    timer.reset(MODE_DEFAULTS[mode] * 60);
  };

  // Today tasks across all lists (pomodoro only)
  const today = getTodayYMD();
  const todayTasks: Task[] = lists
    .flatMap((l) => l.tasks)
    .filter((task) => !task.completed && task.dueDate !== null && task.dueDate <= today);

  const isRunning = timer.timerState === 'running';
  const isPaused = timer.timerState === 'paused';

  return (
    <div style={containerStyle}>
      {/* Timer panel */}
      <div style={{ ...timerBlockStyle, position: 'relative' }}>
        {/* BGM button — top right */}
        {mode === 'pomodoro' && (
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <BgmControl lang={lang} focusRunning={isRunning} />
          </div>
        )}

        {/* Mode chips */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {MODES.map((m) => (
            <Chip
              key={m}
              selected={mode === m}
              onClick={() => switchMode(m)}
            >
              {t(m, lang)}
            </Chip>
          ))}
        </div>

        {/* Time display with adjust arrows (idle only) */}
        {timer.timerState === 'idle' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <AdjustButton onClick={() => adjustMinutes(-5)}>▼</AdjustButton>
            <div style={timerDisplayStyle}>{formatTime(timer.remaining)}</div>
            <AdjustButton onClick={() => adjustMinutes(5)}>▲</AdjustButton>
          </div>
        ) : (
          <div style={timerDisplayStyle}>{formatTime(timer.remaining)}</div>
        )}

        {/* CTA buttons */}
        <div style={{ marginTop: '20px' }}>
          {timer.timerState === 'idle' ? (
            <Button onClick={handleStart} style={{ minWidth: '120px' }}>Start</Button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button
                variant="secondary"
                onClick={isRunning ? handlePause : handleResume}
              >
                {isRunning
                  ? (lang === 'ja' ? '一時停止' : 'Pause')
                  : (lang === 'ja' ? '再開' : 'Resume')}
              </Button>
              {!isBreakMode && (
                <Button onClick={handleComplete}>
                  {lang === 'ja' ? '完了' : 'Complete'}
                </Button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Break: Pixel Breaker game (short/long break while running or paused) */}
      {isBreakMode && (isRunning || isPaused) && (
        <div style={{ marginBottom: '24px' }}>
          <PixelBreaker lang={lang} />
        </div>
      )}

      {/* Today's Tasks (pomodoro mode only) */}
      {mode === 'pomodoro' && (
        <div>
          <h3 style={sectionTitleStyle}>{t('todayTasks', lang)}</h3>
          {todayTasks.length === 0 ? (
            <div style={emptyTasksStyle}>{t('noTodayTasks', lang)}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayTasks.map((task) => (
                <TodayTaskRow
                  key={task.id}
                  task={task}
                  lang={lang}
                  showSmash={isRunning}
                  onSmash={onCompleteTask}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ▲/▼ adjust button */
function AdjustButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: '2px solid var(--pd-color-border-default)',
        color: 'var(--pd-color-text-secondary)',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontFamily: 'var(--pd-font-body)',
        fontSize: '0.75rem',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = 'var(--pd-color-background-hover)';
        el.style.color = 'var(--pd-color-text-primary)';
        el.style.borderColor = 'var(--pd-color-accent-default)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = 'none';
        el.style.color = 'var(--pd-color-text-secondary)';
        el.style.borderColor = 'var(--pd-color-border-default)';
      }}
    >
      {children}
    </button>
  );
}

/* Today task row */
function TodayTaskRow({ task, lang, showSmash, onSmash }: {
  task: Task;
  lang: 'en' | 'ja';
  showSmash: boolean;
  onSmash: (taskId: string) => void;
}) {
  return (
    <div
      data-task-id={task.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: 'var(--pd-color-background-elevated)',
        border: '2px solid var(--pd-color-border-default)',
        boxShadow: '2px 2px 0 var(--pd-color-shadow-default)',
      }}
    >
      <span style={{ fontSize: '0.625rem', color: 'var(--pd-color-text-secondary)', flexShrink: 0 }}>□</span>
      <span style={{
        flex: 1,
        fontFamily: 'var(--pd-font-body)',
        fontSize: '0.875rem',
        color: 'var(--pd-color-text-primary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {task.title}
      </span>
      {showSmash && (
        <button
          type="button"
          onClick={() => onSmash(task.id)}
          style={{
            background: 'var(--pd-color-accent-default)',
            color: 'var(--pd-color-accent-text)',
            border: 'none',
            padding: '4px 10px',
            fontFamily: 'var(--pd-font-body)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '2px 2px 0 var(--pd-color-shadow-default)',
          }}
        >
          {t('smash', lang)}
        </button>
      )}
    </div>
  );
}

/* Styles */
const containerStyle: React.CSSProperties = {
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
};

const timerBlockStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '24px',
  padding: '24px 20px 20px',
  background: 'var(--pd-color-background-elevated)',
  border: '2px solid var(--pd-color-border-default)',
  boxShadow: '3px 3px 0 var(--pd-color-shadow-default)',
};

const timerDisplayStyle: React.CSSProperties = {
  fontFamily: 'var(--pd-font-brand)',
  fontSize: 'clamp(4rem, 20vw, 7rem)',
  color: 'var(--pd-color-text-primary)',
  letterSpacing: '0.04em',
  lineHeight: 1,
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--pd-font-body)',
  fontSize: '0.75rem',
  color: 'var(--pd-color-text-secondary)',
  marginBottom: '12px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

const emptyTasksStyle: React.CSSProperties = {
  fontFamily: 'var(--pd-font-body)',
  fontSize: '0.875rem',
  color: 'var(--pd-color-text-secondary)',
  padding: '24px',
  textAlign: 'center',
  border: '2px dashed var(--pd-color-border-default)',
};
