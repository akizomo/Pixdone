import { registerPlugin } from '@capacitor/core';
import type { BackgroundTimerOptions } from './backgroundTimer';

/**
 * Native `FocusService` plugin (Android: foreground service, iOS: audio session + end
 * notification + native BGM). Registered once here; Capacitor rejects a second registration.
 */
export interface FocusServicePlugin {
  start(options: BackgroundTimerOptions): Promise<void>;
  stop(): Promise<void>;
  checkPermissions(): Promise<{ notifications: string }>;
  requestPermissions(): Promise<{ notifications: string }>;
  /** iOS only: loop `public/bgm/{track}.caf` at `volume` (0–1). */
  playBgm(options: { track: string; volume: number }): Promise<void>;
  /** iOS only. */
  stopBgm(): Promise<void>;
}

export const FocusService = registerPlugin<FocusServicePlugin>('FocusService');
