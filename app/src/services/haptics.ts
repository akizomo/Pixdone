/**
 * Haptic feedback for the native app. No-op on the web.
 * Patterns come from design-system/foundations/haptic.tokens.ts.
 * Haptics follow the OS setting (System Haptics), not the in-app sound toggle.
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
// Import the token file directly: the DS index pulls in components that import services/sound.
import { haptic, type HapticPattern } from '../design-system/foundations/haptic.tokens';
import type { SoundKey } from '../design-system/foundations/sound.tokens';

const IMPACT: Record<'light' | 'medium' | 'heavy', ImpactStyle> = {
  light: ImpactStyle.Light,
  medium: ImpactStyle.Medium,
  heavy: ImpactStyle.Heavy,
};

const NOTIFICATION: Record<'success' | 'warning' | 'error', NotificationType> = {
  success: NotificationType.Success,
  warning: NotificationType.Warning,
  error: NotificationType.Error,
};

export function playHapticPattern(pattern: HapticPattern): void {
  if (!Capacitor.isNativePlatform()) return;
  const run =
    pattern.type === 'impact' ? Haptics.impact({ style: IMPACT[pattern.style] })
    : pattern.type === 'notification' ? Haptics.notification({ type: NOTIFICATION[pattern.style] })
    : Haptics.selectionStart().then(() => Haptics.selectionChanged()).then(() => Haptics.selectionEnd());
  run.catch(() => { /* device without a haptic engine */ });
}

export function playHaptic(key: SoundKey): void {
  playHapticPattern(haptic[key]);
}
