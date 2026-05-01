import { useEffect, useRef } from 'react';
import { startBgm, stopBgm, isBgmContextSuspended } from '../services/bgm';
import type { BgmTrack } from '../services/bgm';

interface UseFocusBgmOptions {
  bgmOn: boolean;
  bgmTrack: BgmTrack;
  isPomodoroMode: boolean;
  timerState: 'idle' | 'running' | 'paused';
  remaining: number;
}

export function useFocusBgm({
  bgmOn,
  bgmTrack,
  isPomodoroMode,
  timerState,
  remaining,
}: UseFocusBgmOptions) {
  const prevShouldPlayRef = useRef(false);
  const prevTrackRef = useRef<BgmTrack>(bgmTrack);

  useEffect(() => {
    if (remaining === 0) stopBgm();
  }, [remaining]);

  useEffect(() => {
    if (timerState !== 'running') stopBgm();
  }, [timerState]);

  useEffect(() => {
    const shouldPlay =
      bgmOn && isPomodoroMode && timerState === 'running' && remaining > 0;
    const wasPlaying = prevShouldPlayRef.current;
    const prevTrack = prevTrackRef.current;

    if (!shouldPlay) {
      stopBgm();
    } else if (isBgmContextSuspended()) {
      stopBgm();
      startBgm(bgmTrack);
    } else if (!wasPlaying) {
      startBgm(bgmTrack);
    } else if (prevTrack !== bgmTrack) {
      stopBgm();
      startBgm(bgmTrack);
    }

    prevShouldPlayRef.current = shouldPlay;
    prevTrackRef.current = bgmTrack;
  }, [bgmOn, bgmTrack, isPomodoroMode, timerState, remaining]);
}
