/**
 * FocusScreenContainer — owns all focus timer state, BGM effects, and wraps FocusScreen.
 *
 * Extracting this from AppContent means timer ticks (every 100ms while running)
 * only re-render this subtree, not the tasks screen or collection screen.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useListsData } from '../features/ListsContext';
import { FocusScreen } from '../components';
import { FocusZenMode } from '../components/FocusZenMode';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { playSound } from '../services/sound';
import { stopBgm, startBgm, isBgmOn, getBgmTrack, isBgmContextSuspended } from '../services/bgm';
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
}: FocusScreenContainerProps) {
  const { lists } = useListsData();

  // ── Focus timer state ──
  const [focusMode, setFocusMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusPomodoroCount, setFocusPomodoroCount] = useState(0);
  const [bgmOn, setBgmOnState] = useState<boolean>(() => isBgmOn());
  const [bgmTrack, setBgmTrackState] = useState<BgmTrack>(() => getBgmTrack());
  const [, setBgmMenuOpen] = useState(false);
  const prevBgmShouldPlayRef = useRef(false);
  const prevBgmTrackRef = useRef<BgmTrack>(bgmTrack);
  const focusModeRef = useRef(focusMode);
  useEffect(() => { focusModeRef.current = focusMode; }, [focusMode]);
  const focusCountRef = useRef(focusPomodoroCount);
  useEffect(() => { focusCountRef.current = focusPomodoroCount; }, [focusPomodoroCount]);

  const focusTimer = useFocusTimer(() => {
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

  // Safety: ensure BGM is stopped on timer reaching 0
  useEffect(() => {
    if (focusTimer.remaining === 0) stopBgm();
  }, [focusTimer.remaining]);

  // Fail-safe: never keep BGM while timer is not running.
  useEffect(() => {
    if (focusTimer.timerState !== 'running') stopBgm();
  }, [focusTimer.timerState]);

  // Single playback authority
  useEffect(() => {
    const shouldPlay =
      bgmOn &&
      focusMode === 'pomodoro' &&
      focusTimer.timerState === 'running' &&
      focusTimer.remaining > 0;
    const wasPlaying = prevBgmShouldPlayRef.current;
    const prevTrack = prevBgmTrackRef.current;

    if (!shouldPlay) {
      stopBgm();
      prevBgmShouldPlayRef.current = shouldPlay;
      prevBgmTrackRef.current = bgmTrack;
      return;
    }

    if (shouldPlay && isBgmContextSuspended()) {
      stopBgm();
      startBgm(bgmTrack);
      prevBgmShouldPlayRef.current = true;
      prevBgmTrackRef.current = bgmTrack;
      return;
    } else if (!wasPlaying) {
      startBgm(bgmTrack);
    } else if (prevTrack !== bgmTrack) {
      stopBgm();
      startBgm(bgmTrack);
    }

    prevBgmShouldPlayRef.current = shouldPlay;
    prevBgmTrackRef.current = bgmTrack;
  }, [bgmOn, bgmTrack, focusMode, focusTimer.timerState, focusTimer.remaining]);

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

  return (
    <>
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
