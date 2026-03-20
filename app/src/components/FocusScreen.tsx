import { useState, useEffect } from 'react';
import { Button, Chip, IconButton } from '../design-system';
import { t } from '../lib/i18n';
import { getTodayYMD } from '../lib/date';
import { PixelBreaker } from './PixelBreaker';
import { BgmControl } from './BgmControl';
import { TaskItem } from './TaskItem';
import { playSound } from '../services/sound';
import type { List } from '../types/list';
import type { Task } from '../types/task';
import type { FocusTimerState } from '../hooks/useFocusTimer';
import type { BgmTrack } from '../services/bgm';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface FocusScreenProps {
  lists: List[];
  lang: 'en' | 'ja';
  onCompleteTask: (taskId: string) => void;
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
}

const MODES: TimerMode[] = ['pomodoro', 'shortBreak', 'longBreak'];

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

export function FocusScreen({
  lists,
  lang,
  onCompleteTask,
  onEditTask,
  mode,
  minutes,
  timerState,
  remaining,
  bgmOn,
  bgmTrack,
  onBgmChange,
  onBgmMenuOpenChange,
  onOpenZenMode,
  onSwitchMode,
  onAdjustMinutes,
  onStart,
  onPause,
  onResume,
  onSkipBreak,
  onCompleteFocus,
}: FocusScreenProps) {
  const [taskPanelMode, setTaskPanelMode] = useState<'today' | 'lists'>('today');
  const [selectedListId, setSelectedListId] = useState<string>(() => lists[0]?.id ?? '');
  const SMALL_STEPS = [1, 3, 5] as const;

  const nextMinutesByArrow = (current: number, dir: -1 | 1): number => {
    // Spec:
    // - Up to 5 minutes: 1 → 3 → 5 (and reverse)
    // - After that: +/- 5 minutes
    if (current < 5) {
      const sorted = [...SMALL_STEPS];
      const idx = sorted.findIndex((v) => v === current);
      // If current isn't exactly 1/3/5 (shouldn't happen often), snap within the small range.
      if (idx === -1) {
        if (dir === 1) return current <= 1 ? 1 : current <= 3 ? 3 : 5;
        return current <= 1 ? 1 : current <= 3 ? 1 : 3;
      }
      const nextIdx = Math.max(0, Math.min(sorted.length - 1, idx + dir));
      return sorted[nextIdx];
    }

    if (current === 5) {
      return dir === 1 ? 10 : 3;
    }

    if (dir === 1) return current + 5;
    return Math.max(5, current - 5);
  };

  // keep selected list valid when lists change
  useEffect(() => {
    const nextFocusLists = lists.filter((l) => !(l.id === 'smash-list' || l.name === '💥 Smash List'));
    if (!selectedListId || !nextFocusLists.some((l) => l.id === selectedListId)) {
      setSelectedListId(nextFocusLists[0]?.id ?? '');
    }
  }, [lists, selectedListId]);

  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  const isRunning = timerState === 'running';
  const isPaused = timerState === 'paused';

  // Today tasks across all lists (pomodoro only)
  const today = getTodayYMD();
  const focusLists = lists.filter((l) => !(l.id === 'smash-list' || l.name === '💥 Smash List'));
  const todayTasks: Task[] = focusLists
    .flatMap((l) => l.tasks)
    .filter((task) => !task.completed && task.dueDate !== null && task.dueDate <= today);
  const selectedList = focusLists.find((l) => l.id === selectedListId) ?? null;
  const listTasks: Task[] = (selectedList?.tasks ?? []).filter((task) => !task.completed);

  return (
    <div style={containerStyle}>
      {/* Timer panel */}
      <div style={{ ...timerBlockStyle, position: 'relative' }} className="pd-focus-timer-block">
        {/* Top right: full-screen + (pomodoro only) BGM */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={lang === 'ja' ? '全画面でフォーカス' : 'Full screen focus'}
            icon={<span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>fullscreen</span>}
            onClick={onOpenZenMode}
          />
          {mode === 'pomodoro' && (
            <BgmControl
              lang={lang}
              bgmOn={bgmOn}
              track={bgmTrack}
              onChange={onBgmChange}
              onMenuOpenChange={onBgmMenuOpenChange}
              variant="ghost"
            />
          )}
        </div>

        {/* Mode chips */}
        <div
          aria-hidden={timerState !== 'idle'}
          className="pd-focus-mode-chips"
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            visibility: timerState === 'idle' ? 'visible' : 'hidden',
            pointerEvents: timerState === 'idle' ? 'auto' : 'none',
          }}
        >
          {MODES.map((m) => (
            <Chip
              key={m}
              selected={mode === m}
              onClick={() => onSwitchMode(m)}
            >
              {t(m, lang)}
            </Chip>
          ))}
        </div>

        {/* Time display with adjust arrows (idle only) */}
        {timerState === 'idle' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AdjustButton
                direction="down"
                onClick={() => {
                const next = nextMinutesByArrow(minutes, -1);
                onAdjustMinutes(next - minutes);
              }}
              />
              <div style={timerDisplayStyle} className="pd-focus-timer-display"><TimeDigits value={formatTime(remaining)} /></div>
              <AdjustButton
                direction="up"
                onClick={() => {
                const next = nextMinutesByArrow(minutes, 1);
                onAdjustMinutes(next - minutes);
              }}
              />
            </div>
          </div>
        ) : (
          <div style={timerDisplayStyle} className="pd-focus-timer-display"><TimeDigits value={formatTime(remaining)} /></div>
        )}

        {/* CTA buttons */}
        <div style={{ marginTop: '20px' }}>
          {timerState === 'idle' ? (
            <Button onClick={onStart} style={{ minWidth: '120px' }}>Start</Button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button
                variant="secondary"
                onClick={isRunning ? onPause : onResume}
              >
                {isRunning
                  ? (lang === 'ja' ? '一時停止' : 'Pause')
                  : (lang === 'ja' ? '再開' : 'Resume')}
              </Button>
              {isBreakMode ? (
                <Button variant="secondary" onClick={onSkipBreak}>
                  {t('skipBreak', lang)}
                </Button>
              ) : (
                <Button onClick={onCompleteFocus}>
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
function AdjustButton({ onClick, direction }: { onClick: () => void; direction: 'up' | 'down' }) {
  const labelJa = direction === 'up' ? '時間を増やす' : '時間を減らす';
  const labelEn = direction === 'up' ? 'Increase minutes' : 'Decrease minutes';
  const symbol = direction === 'up' ? '▲' : '▼';
  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={labelJa + ' / ' + labelEn}
      icon={<span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{symbol}</span>}
      onClick={onClick}
      soundKey="buttonClick"
    />
  );
}

/* Styles */
const containerStyle: React.CSSProperties = {
  padding: '24px 0',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
};

const timerBlockStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '24px',
  padding: '20px 0 16px',
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
