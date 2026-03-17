import { useState, useCallback, useEffect, useRef } from 'react';
import { Button, Chip } from '../design-system';
import { t } from '../lib/i18n';
import { getTodayYMD } from '../lib/date';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { PixelBreaker } from './PixelBreaker';
import { BgmControl } from './BgmControl';
import { TaskItem } from './TaskItem';
import { stopBgm } from '../services/bgm';
import { playSound } from '../services/sound';
import type { List } from '../types/list';
import type { Task } from '../types/task';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface FocusScreenProps {
  lists: List[];
  lang: 'en' | 'ja';
  onCompleteTask: (taskId: string) => void;
  onEditTask?: (taskId: string) => void;
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

function TimeDigits({ value }: { value: string }) {
  // Fixed-width per digit like timer apps (each glyph gets its own slot).
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

export function FocusScreen({ lists, lang, onCompleteTask, onEditTask }: FocusScreenProps) {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [minutes, setMinutes] = useState(MODE_DEFAULTS.pomodoro);
  const [pomodoroCount, setPomodoroCount] = useState(0); // 0..3 (4th triggers long break)
  const [taskPanelMode, setTaskPanelMode] = useState<'today' | 'lists'>('today');
  const [selectedListId, setSelectedListId] = useState<string>(() => lists[0]?.id ?? '');

  // keep selected list valid when lists change
  useEffect(() => {
    const nextFocusLists = lists.filter((l) => !(l.id === 'smash-list' || l.name === '💥 Smash List'));
    if (!selectedListId || !nextFocusLists.some((l) => l.id === selectedListId)) {
      setSelectedListId(nextFocusLists[0]?.id ?? '');
    }
  }, [lists, selectedListId]);

  const modeRef = useRef<TimerMode>(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const pomodoroCountRef = useRef<number>(pomodoroCount);
  useEffect(() => { pomodoroCountRef.current = pomodoroCount; }, [pomodoroCount]);

  const handleTimerEnd = useCallback(() => {
    // Pixel-style completion cue (vanilla parity: success/complete)
    playSound('focusAlarm');
    stopBgm();
    const m = modeRef.current;

    if (m === 'pomodoro') {
      // 4 pomodoros -> long break, otherwise short break
      const nextCount = (pomodoroCountRef.current + 1) % 4;
      setPomodoroCount(nextCount);
      const next: TimerMode = nextCount === 0 ? 'longBreak' : 'shortBreak';
      setMode(next);
      setMinutes(MODE_DEFAULTS[next]);
      timerRef.current?.reset(MODE_DEFAULTS[next] * 60);
      return;
    }

    // Break finished -> back to pomodoro
    setMode('pomodoro');
    setMinutes(MODE_DEFAULTS.pomodoro);
    timerRef.current?.reset(MODE_DEFAULTS.pomodoro * 60);
  }, []); // uses refs

  const timer = useFocusTimer(handleTimerEnd);
  const timerRef = useRef(timer);
  useEffect(() => { timerRef.current = timer; }, [timer]);
  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  const switchMode = (newMode: TimerMode) => {
    playSound('buttonClick');
    setMode(newMode);
    const m = MODE_DEFAULTS[newMode];
    setMinutes(m);
    timer.reset(m * 60);
    stopBgm(); // BGM stops on any mode switch (break or cancel)
  };

  const adjustMinutes = (delta: number) => {
    if (timer.timerState !== 'idle') return;
    playSound('buttonClick');
    const next = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, minutes + delta));
    setMinutes(next);
    timer.reset(next * 60);
  };

  const handleComplete = () => {
    playSound('taskComplete');
    switchMode('shortBreak'); // stopBgm called inside switchMode
  };

  const handleStart = () => {
    playSound('buttonClick');
    timer.start();
  };

  const handlePause = () => {
    playSound('buttonClick');
    timer.pause();
    stopBgm();
  };

  const handleResume = () => {
    playSound('buttonClick');
    timer.resume();
  };

  const handleSkipBreak = () => {
    if (!isBreakMode) return;
    playSound('taskCancel');
    stopBgm();
    const next: TimerMode = 'pomodoro';
    setMode(next);
    setMinutes(MODE_DEFAULTS[next]);
    timer.reset(MODE_DEFAULTS[next] * 60);
  };

  // Today tasks across all lists (pomodoro only)
  const today = getTodayYMD();
  const focusLists = lists.filter((l) => !(l.id === 'smash-list' || l.name === '💥 Smash List'));
  const todayTasks: Task[] = focusLists
    .flatMap((l) => l.tasks)
    .filter((task) => !task.completed && task.dueDate !== null && task.dueDate <= today);
  const selectedList = focusLists.find((l) => l.id === selectedListId) ?? null;
  const listTasks: Task[] = (selectedList?.tasks ?? []).filter((task) => !task.completed);

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
        <div
          aria-hidden={timer.timerState !== 'idle'}
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            visibility: timer.timerState === 'idle' ? 'visible' : 'hidden',
            pointerEvents: timer.timerState === 'idle' ? 'auto' : 'none',
          }}
        >
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
            <div style={timerDisplayStyle}><TimeDigits value={formatTime(timer.remaining)} /></div>
            <AdjustButton onClick={() => adjustMinutes(5)}>▲</AdjustButton>
          </div>
        ) : (
          <div style={timerDisplayStyle}><TimeDigits value={formatTime(timer.remaining)} /></div>
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
              {isBreakMode ? (
                <Button variant="secondary" onClick={handleSkipBreak}>
                  {t('skipBreak', lang)}
                </Button>
              ) : (
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
          <p style={{
            margin: '0 0 10px',
            fontFamily: 'var(--pd-font-body)',
            fontSize: '0.875rem',
            color: 'var(--pd-color-text-secondary)',
            lineHeight: 1.4,
          }}>
            {t('breakGamePitch', lang)}
          </p>
          <PixelBreaker lang={lang} />
        </div>
      )}

      {/* Today's Tasks (pomodoro mode only) */}
      {mode === 'pomodoro' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>{t('todayTasks', lang)}</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {(['today', 'lists'] as const).map((k) => {
                const active = taskPanelMode === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { playSound('buttonClick'); setTaskPanelMode(k); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontFamily: 'var(--pd-font-body)',
                      fontSize: '0.75rem',
                      color: active ? 'var(--pd-color-text-primary)' : 'var(--pd-color-text-secondary)',
                      fontWeight: active ? 700 : 500,
                      lineHeight: 1.2,
                    }}
                  >
                    {t(k === 'today' ? 'focusTasksToday' : 'focusTasksLists', lang)}
                  </button>
                );
              })}
            </div>
          </div>

          {taskPanelMode === 'today' ? (
            todayTasks.length === 0 ? (
              <div style={emptyTasksStyle}>{t('noTodayTasks', lang)}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    lang={lang}
                    onComplete={onCompleteTask}
                    onEdit={onEditTask ?? (() => {})}
                  />
                ))}
              </div>
            )
          ) : (
            <div>
              <div
                role="tablist"
                aria-label={lang === 'ja' ? 'リスト切り替え' : 'List switcher'}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  overflowX: 'auto',
                  paddingBottom: '6px',
                  marginBottom: '12px',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {focusLists.map((l) => {
                  const active = l.id === selectedListId;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => { playSound('buttonClick'); setSelectedListId(l.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '2px 0',
                        cursor: 'pointer',
                        fontFamily: 'var(--pd-font-body)',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        color: active ? 'var(--pd-color-text-primary)' : 'var(--pd-color-text-secondary)',
                        borderBottom: `2px solid ${active ? 'var(--pd-color-accent-default)' : 'transparent'}`,
                        lineHeight: 1.2,
                      }}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>

              {listTasks.length === 0 ? (
                <div style={emptyTasksStyle}>{t('focusNoListTasks', lang)}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {listTasks.slice(0, 12).map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      lang={lang}
                      onComplete={onCompleteTask}
                      onEdit={onEditTask ?? (() => {})}
                    />
                  ))}
                </div>
              )}
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
  // Mobile UX: reserve ~40% viewport so controls don't sit too high
  minHeight: 'min(360px, 40vh)',
  justifyContent: 'center',
};

const timerDisplayStyle: React.CSSProperties = {
  fontFamily: 'var(--pd-font-brand)',
  fontSize: 'clamp(4rem, 20vw, 7rem)',
  color: 'var(--pd-color-text-primary)',
  letterSpacing: '0.04em',
  lineHeight: 1,
  // Theme-safe layout: keep baseline/metrics from shifting the block height
  height: '1em',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  paddingTop: '0.04em',
  // Keep whole time block stable
  minWidth: '5ch', // "MM:SS"
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
