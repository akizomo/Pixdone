/**
 * FocusScreenContainer — owns all focus timer state, BGM effects, and wraps FocusScreen.
 *
 * Extracting this from AppContent means timer ticks (every 100ms while running)
 * only re-render this subtree, not the tasks screen or collection screen.
 *
 * It stays MOUNTED while the user is on other screens (`active` = false), so the timer
 * and BGM keep running. In that state it shows a MiniPlayer above the bottom nav
 * instead of the full focus UI.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useListsData } from '../features/ListsContext';
import { FocusScreen } from '../components';
import { FocusZenMode } from '../components/FocusZenMode';
import { MiniPlayer, Button } from '../design-system';
import { t } from '../lib/i18n';
import { startBackgroundTimer, stopBackgroundTimer } from '../services/backgroundTimer';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { useFocusBgm } from '../hooks/useFocusBgm';
import { playSound } from '../services/sound';
import { stopBgm, isBgmOn, getBgmTrack } from '../services/bgm';
import type { BgmTrack } from '../services/bgm';
import type { User } from 'firebase/auth';

export interface FocusScreenContainerProps {
  lang: 'en' | 'ja';
  user: User | null;
  onComplete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onNavigateToSmashList: () => void;
  onNavigateToFocus: () => void;
  focusZenOpen: boolean;
  onFocusZenOpenChange: (open: boolean) => void;
  /** True while the focus screen is the one being shown. False = keep running in the background. */
  active: boolean;
  /** False on pages without the bottom nav (pricing/account…): no MiniPlayer there. */
  showMiniPlayer: boolean;
  /** Bottom nav is slid away (hide-on-scroll). */
  bottomNavHidden: boolean;
  /** Reports whether the MiniPlayer is showing, so the app can make room for it. */
  onMiniPlayerVisibleChange: (visible: boolean) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FocusScreenContainer({
  lang,
  user,
  onComplete,
  onEdit,
  onNavigateToSmashList,
  onNavigateToFocus,
  focusZenOpen,
  onFocusZenOpenChange,
  active,
  showMiniPlayer,
  bottomNavHidden,
  onMiniPlayerVisibleChange,
}: FocusScreenContainerProps) {
  const { lists } = useListsData();

  // ── Focus timer state ──
  const [focusMode, setFocusMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusPomodoroCount, setFocusPomodoroCount] = useState(0);
  const [bgmOn, setBgmOnState] = useState<boolean>(() => isBgmOn());
  const [bgmTrack, setBgmTrackState] = useState<BgmTrack>(() => getBgmTrack());
  const [, setBgmMenuOpen] = useState(false);
  const focusModeRef = useRef(focusMode);
  useEffect(() => { focusModeRef.current = focusMode; }, [focusMode]);
  const focusCountRef = useRef(focusPomodoroCount);
  useEffect(() => { focusCountRef.current = focusPomodoroCount; }, [focusPomodoroCount]);

  const timerEndedAtRef = useRef(0);
  const focusTimer = useFocusTimer(() => {
    timerEndedAtRef.current = Date.now();
    const m = focusModeRef.current;
    if (m === 'pomodoro') playSound('focusPomodoroComplete');
    else playSound('focusBreakComplete');
    stopBgm();

    if (m === 'pomodoro') {
      const nextCount = (focusCountRef.current + 1) % 4;
      setFocusPomodoroCount(nextCount);
      setFocusMode('shortBreak');
      setFocusMinutes(5);
      focusTimerRef.current?.reset(5 * 60);
      return;
    }

    if (m === 'shortBreak') {
      if (focusCountRef.current === 0) {
        setFocusMode('longBreak');
        setFocusMinutes(15);
        focusTimerRef.current?.reset(15 * 60);
        return;
      }
    }

    setFocusMode('pomodoro');
    setFocusMinutes(25);
    focusTimerRef.current?.reset(25 * 60);
  });

  const focusTimerRef = useRef<ReturnType<typeof useFocusTimer> | null>(null);
  useEffect(() => { focusTimerRef.current = focusTimer; }, [focusTimer]);

  useFocusBgm({
    bgmOn,
    bgmTrack,
    isPomodoroMode: focusMode === 'pomodoro',
    timerState: focusTimer.timerState,
    remaining: focusTimer.remaining,
  });

  // ── Callbacks for FocusScreen props ──

  const handleSwitchMode = useCallback((m: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    playSound('buttonClick');
    setFocusMode(m);
    const nextMin = m === 'pomodoro' ? 25 : m === 'shortBreak' ? 5 : 15;
    setFocusMinutes(nextMin);
    focusTimer.reset(nextMin * 60);
    stopBgm();
    setBgmMenuOpen(false);
  }, [focusTimer]);

  const handleAdjustMinutes = useCallback((deltaMin: number) => {
    if (!user || focusTimer.timerState !== 'idle') return;
    playSound('buttonClick');
    const next = Math.min(60, Math.max(1, focusMinutes + deltaMin));
    setFocusMinutes(next);
    focusTimer.reset(next * 60);
  }, [user, focusTimer, focusMinutes]);

  const handleSkipBreak = useCallback(() => {
    if (!(focusMode === 'shortBreak' || focusMode === 'longBreak')) return;
    playSound('taskCancel');
    stopBgm();
    setFocusMode('pomodoro');
    setFocusMinutes(25);
    focusTimer.reset(25 * 60);
    setBgmMenuOpen(false);
  }, [focusMode, focusTimer]);

  const handleCompleteFocus = useCallback(() => {
    playSound('taskComplete');
    setFocusMode('shortBreak');
    setFocusMinutes(5);
    focusTimer.reset(5 * 60);
    stopBgm();
    setBgmMenuOpen(false);
  }, [focusTimer]);

  const handleZenClose = useCallback(() => {
    playSound('taskCancel');
    onFocusZenOpenChange(false);
    setBgmMenuOpen(false);
  }, [onFocusZenOpenChange]);

  const isBreakMode = focusMode !== 'pomodoro';
  const isRunning = focusTimer.timerState === 'running';

  // Keep the timer + BGM alive in the background (Android foreground service with a native
  // countdown notification). `remaining` is read through a ref: the end time is fixed when a
  // running stretch starts, so ticks must not restart the service.
  const remainingRef = useRef(focusTimer.remaining);
  remainingRef.current = focusTimer.remaining;
  useEffect(() => {
    if (!isRunning) {
      // Right after the timer ends, give the completion sound a moment before letting go.
      stopBackgroundTimer(Date.now() - timerEndedAtRef.current < 2000 ? 8000 : 0);
      return;
    }
    void startBackgroundTimer({
      title: isBreakMode ? (lang === 'ja' ? '休憩中' : 'Break') : (lang === 'ja' ? 'フォーカス中' : 'Focusing'),
      text: lang === 'ja' ? 'タップして PixDone を開く' : 'Tap to open PixDone',
      endAt: Date.now() + remainingRef.current * 1000,
    });
  }, [isRunning, isBreakMode, lang]);
  useEffect(() => () => stopBackgroundTimer(), []);
  const miniPlayerVisible = showMiniPlayer && !active && !focusZenOpen && focusTimer.timerState !== 'idle';
  useEffect(() => {
    onMiniPlayerVisibleChange(miniPlayerVisible);
    return () => onMiniPlayerVisibleChange(false);
  }, [miniPlayerVisible, onMiniPlayerVisibleChange]);

  return (
    <>
    {active && (
    <FocusScreen
      lists={lists}
      lang={lang}
      canAdjustMinutes={!!user}
      onCompleteTask={onComplete}
      onEditTask={onEdit}
      mode={focusMode}
      minutes={focusMinutes}
      pomodoroCount={focusPomodoroCount}
      timerState={focusTimer.timerState}
      remaining={focusTimer.remaining}
      bgmOn={bgmOn}
      bgmTrack={bgmTrack}
      onBgmChange={({ bgmOn: nextOn, track: nextTrack }) => {
        setBgmOnState(nextOn);
        setBgmTrackState(nextTrack);
      }}
      onBgmMenuOpenChange={setBgmMenuOpen}
      onOpenZenMode={() => { playSound('buttonClick'); onFocusZenOpenChange(true); }}
      onSwitchMode={handleSwitchMode}
      onAdjustMinutes={handleAdjustMinutes}
      onStart={() => { playSound('buttonClick'); focusTimer.start(); }}
      onPause={() => { playSound('buttonClick'); focusTimer.pause(); stopBgm(); }}
      onResume={() => { playSound('buttonClick'); focusTimer.resume(); }}
      onSkipBreak={handleSkipBreak}
      onCompleteFocus={handleCompleteFocus}
      onTutorialSmashLinkClick={onNavigateToSmashList}
      onTutorialFocusLinkClick={onNavigateToFocus}
    />
    )}
    {miniPlayerVisible && (
      <MiniPlayer
        title={isBreakMode ? (lang === 'ja' ? '休憩' : 'Break') : 'Focus'}
        time={formatTime(focusTimer.remaining)}
        openLabel={lang === 'ja' ? 'フォーカス画面を開く' : 'Open focus timer'}
        onOpen={onNavigateToFocus}
        soundKey={null} /* navigateToFocus plays the click itself */
        navHidden={bottomNavHidden}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (isRunning) { focusTimer.pause(); stopBgm(); } else { focusTimer.resume(); }
              }}
            >
              {isRunning ? (lang === 'ja' ? '一時停止' : 'Pause') : (lang === 'ja' ? '再開' : 'Resume')}
            </Button>
            {isBreakMode ? (
              <Button variant="ghost" size="sm" soundKey="taskCancel" onClick={handleSkipBreak}>{t('skipBreak', lang)}</Button>
            ) : (
              <Button variant="ghost" size="sm" soundKey="taskComplete" onClick={handleCompleteFocus}>{lang === 'ja' ? '完了' : 'Complete'}</Button>
            )}
          </>
        }
      />
    )}
    {focusZenOpen && (
      <FocusZenMode
        lang={lang}
        mode={focusMode}
        timerState={focusTimer.timerState}
        remaining={focusTimer.remaining}
        totalSeconds={focusMinutes * 60}
        bgmOn={bgmOn}
        bgmTrack={bgmTrack}
        onBgmChange={({ bgmOn: nextOn, track: nextTrack }) => {
          setBgmOnState(nextOn);
          setBgmTrackState(nextTrack);
        }}
        onBgmMenuOpenChange={setBgmMenuOpen}
        onClose={handleZenClose}
        onStart={() => { playSound('buttonClick'); focusTimer.start(); }}
        onPause={() => { playSound('buttonClick'); focusTimer.pause(); stopBgm(); }}
        onResume={() => { playSound('buttonClick'); focusTimer.resume(); }}
        onSkipBreak={handleSkipBreak}
        onCompleteFocus={handleCompleteFocus}
      />
    )}
    </>
  );
}
