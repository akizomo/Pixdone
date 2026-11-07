import { registerPlugin } from '@capacitor/core';
import type { BackgroundTimerOptions } from './backgroundTimer';

/**
 * Native `FocusService` plugin (Android: foreground service, iOS: audio session + end
 * notification + native BGM). Registered once here; Capacitor rejects a second registration.
 */
export type LiveActivityResult = 'started' | 'resumed' | 'disabled' | 'unsupported' | 'failed';

export interface FocusServicePlugin {
  /** iOS resolves with the Live Activity outcome; Android resolves with nothing. */
  start(options: BackgroundTimerOptions): Promise<{ liveActivity?: LiveActivityResult } | void>;
  /** iOS: with `pausedRemaining` the Live Activity stays, frozen; without it, it ends. */
  stop(options?: { pausedRemaining?: number }): Promise<void>;
  checkPermissions(): Promise<{ notifications: string }>;
  requestPermissions(): Promise<{ notifications: string }>;
  /** iOS only: loop `public/bgm/{track}.caf` at `volume` (0–1). */
  playBgm(options: { track: string; volume: number }): Promise<void>;
  /** iOS only. */
  stopBgm(): Promise<void>;
}

export const FocusService = registerPlugin<FocusServicePlugin>('FocusService');
