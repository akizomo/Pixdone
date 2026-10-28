import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Keeps the focus timer (and its Web Audio BGM) alive while the app is in the background.
 *
 * Android freezes a backgrounded app after ~2 minutes, which silently stops the timer and
 * BGM. A foreground service (native, `FocusServicePlugin`) prevents that and shows a native
 * countdown notification.
 *
 * iOS only keeps the app running in the background while audio plays, so there the plugin
 * activates a playback audio session while BGM plays (`keepAlive`) and schedules a local
 * notification for the end time (for when BGM is off and iOS suspends the app).
 *
 * No-op on the web.
 */
interface FocusServicePlugin {
  start(options: BackgroundTimerOptions): Promise<void>;
  stop(): Promise<void>;
  checkPermissions(): Promise<{ notifications: string }>;
  requestPermissions(): Promise<{ notifications: string }>;
}

const FocusService = registerPlugin<FocusServicePlugin>('FocusService');

const isSupported = () => Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios';

let askedForNotificationPermission = false;
let pendingStop: ReturnType<typeof setTimeout> | null = null;

function cancelPendingStop() {
  if (pendingStop) {
    clearTimeout(pendingStop);
    pendingStop = null;
  }
}

export interface BackgroundTimerOptions {
  title: string;
  text: string;
  /** Unix ms when the timer reaches 0; the notification counts down to it. */
  endAt: number;
  /** iOS: BGM is playing, so keep the app alive with a playback audio session. */
  keepAlive?: boolean;
  /** iOS: text of the local notification delivered at `endAt`. */
  endTitle?: string;
  endText?: string;
}

export async function startBackgroundTimer(options: BackgroundTimerOptions): Promise<void> {
  if (!isSupported()) return;
  cancelPendingStop();
  try {
    // Ask once, on the first timer start (a user gesture): Android 13+ notification
    // permission / iOS notification permission. The timer works either way — a denied
    // permission only hides the notification.
    if (!askedForNotificationPermission) {
      askedForNotificationPermission = true;
      const { notifications } = await FocusService.checkPermissions();
      if (notifications === 'prompt' || notifications === 'prompt-with-rationale') {
        await FocusService.requestPermissions();
      }
    }
    await FocusService.start(options);
  } catch (e) {
    console.warn('background timer start failed', e);
  }
}

/**
 * @param delayMs wait before stopping — used right after the timer ends so the completion
 *   sound can finish before the app is allowed to be frozen. A later start cancels it.
 */
export function stopBackgroundTimer(delayMs = 0): void {
  if (!isSupported()) return;
  cancelPendingStop();
  const stop = () => {
    pendingStop = null;
    FocusService.stop().catch((e) => console.warn('background timer stop failed', e));
  };
  if (delayMs > 0) pendingStop = setTimeout(stop, delayMs);
  else stop();
}
