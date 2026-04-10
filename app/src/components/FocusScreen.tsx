import { useState, useEffect } from 'react';
import { Button, Chip, IconButton } from '../design-system';
import { t } from '../lib/i18n';
import { getTodayYMD } from '../lib/date';
import { PixelBreaker } from './PixelBreaker';
import { PacmanProgress } from './PacmanProgress';
import { BgmControl } from './BgmControl';
import { TaskItem } from './TaskItem';
import { playSound } from '../services/sound';
import type { List } from '../types/list';
import type { Task } from '../types/task';
import type { FocusTimerState } from '../hooks/useFocusTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import type { BgmTrack } from '../services/bgm';
import './FocusScreen.css';

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
  lists, lang, onCompleteTask, onEditTask, mode, minutes, timerState, remaining,
  bgmOn, bgmTrack, onBgmChange, onBgmMenuOpenChange, onOpenZenMode,
  onSwitchMode, onAdjustMinutes, onStart, onPause, onResume, onSkipBreak,
  onCompleteFocus, canAdjustMinutes = true, onTutorialSmashLinkClick, onTutorialFocusLinkClick,
}: FocusScreenProps) {
  useWakeLock(timerState === 'running');
  const [taskPanelMode, setTaskPanelMode] = useState<'today' | 'lists'>('today');
  const [selectedListId, setSelectedListId] = useState<string>(() => lists[0]?.id ?? '');
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

  useEffect(() => {
    const nextFocusLists = lists.filter((l) => !(l.id === 'smash-list' || l.name === '💥 Smash List'));
    if (!selectedListId || !nextFocusLists.some((l) => l.id === selectedListId)) {
      setSelectedListId(nextFocusLists[0]?.id ?? '');
    }
  }, [lists, selectedListId]);

  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';
  const isRunning = timerState === 'running';
  const isPaused = timerState === 'paused';
  const today = getTodayYMD();
  const focusLists = lists.filter((l) => !(l.id === 'smash-list' || l.name === '💥 Smash List'));
  const todayTasks: Task[] = focusLists.flatMap((l) => l.tasks).filter((task) => !task.completed && task.dueDate !== null && task.dueDate <= today);
  const selectedList = focusLists.find((l) => l.id === selectedListId) ?? null;
  const listTasks: Task[] = (selectedList?.tasks ?? []).filter((task) => !task.completed);

  return (
    <div className="pd-focus">
      {/* Timer panel */}
      <div className="pd-focus__timer-block">
        <div className="pd-focus__top-actions">
          <div className="pd-focus__top-actions-inner">
            <IconButton
              variant="ghost" size="sm"
              aria-label={lang === 'ja' ? '全画面でフォーカス' : 'Full screen focus'}
              icon={<span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>fullscreen</span>}
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
                  <Button variant="secondary" onClick={onSkipBreak}>{t('skipBreak', lang)}</Button>
                ) : (
                  <Button onClick={onCompleteFocus}>{lang === 'ja' ? '完了' : 'Complete'}</Button>
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

      {/* Task panel (pomodoro only) */}
      {mode === 'pomodoro' && (
        <div>
          <div className="pd-focus__task-header">
            <h3 className="pd-focus__section-title">{t('todayTasks', lang)}</h3>
            <div className="pd-focus__panel-toggle">
              {(['today', 'lists'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`pd-focus__panel-btn${taskPanelMode === k ? ' pd-focus__panel-btn--active' : ''}`}
                  onClick={() => { playSound('buttonClick'); setTaskPanelMode(k); }}
                >
                  {t(k === 'today' ? 'focusTasksToday' : 'focusTasksLists', lang)}
                </button>
              ))}
            </div>
          </div>

          {taskPanelMode === 'today' ? (
            todayTasks.length === 0 ? (
              <div className="pd-focus__empty-tasks">{t('noTodayTasks', lang)}</div>
            ) : (
              <div className="pd-focus__task-list">
                {todayTasks.map((task) => (
                  <TaskItem key={task.id} task={task} lang={lang} onComplete={onCompleteTask} onEdit={onEditTask ?? (() => {})}
                    onTutorialSmashLinkClick={onTutorialSmashLinkClick} onTutorialFocusLinkClick={onTutorialFocusLinkClick} />
                ))}
              </div>
            )
          ) : (
            <div>
              <div className="pd-focus__list-tabs" role="tablist" aria-label={lang === 'ja' ? 'リスト切り替え' : 'List switcher'}>
                {focusLists.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="tab"
                    aria-selected={l.id === selectedListId}
                    className={`pd-focus__list-tab${l.id === selectedListId ? ' pd-focus__list-tab--active' : ''}`}
                    onClick={() => { playSound('buttonClick'); setSelectedListId(l.id); }}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
              {listTasks.length === 0 ? (
                <div className="pd-focus__empty-tasks">{t('focusNoListTasks', lang)}</div>
              ) : (
                <div className="pd-focus__task-list">
                  {listTasks.slice(0, 12).map((task) => (
                    <TaskItem key={task.id} task={task} lang={lang} onComplete={onCompleteTask} onEdit={onEditTask ?? (() => {})}
                      onTutorialSmashLinkClick={onTutorialSmashLinkClick} onTutorialFocusLinkClick={onTutorialFocusLinkClick} />
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
      soundKey="buttonClick"
    />
  );
}
