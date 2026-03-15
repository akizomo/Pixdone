/**
 * Sound service – vanilla parity.
 * When animations.js is loaded, uses ComicEffectsManager (taskAnimationEffects.comicEffects)
 * for playback and ON/OFF so rules match vanilla. Otherwise falls back to
 * window.__pixdonePlaySound and local muted state.
 */
import type { SoundKey } from '../design-system';

let muted = false;

export function setSoundMuted(m: boolean) {
  muted = m;
}

/** Prefer vanilla ComicEffectsManager when available (same keys + localStorage pixdone-sound-enabled). */
function useVanillaSound(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as {
    taskAnimationEffects?: { comicEffects?: { playSound?: (k: string) => void; getSoundEnabled?: () => boolean } };
  };
  return Boolean(w.taskAnimationEffects?.comicEffects?.playSound && w.taskAnimationEffects?.comicEffects?.getSoundEnabled);
}

export function playSound(key: SoundKey): void {
  if (typeof window === 'undefined') return;

  const w = window as unknown as {
    taskAnimationEffects?: { comicEffects?: { playSound: (k: string) => void; getSoundEnabled: () => boolean } };
    __pixdonePlaySound?: (k: string) => void;
  };

  if (useVanillaSound() && w.taskAnimationEffects?.comicEffects) {
    const ce = w.taskAnimationEffects.comicEffects;
    if (!ce.getSoundEnabled()) return;
    if (key !== 'subtaskComplete') {
      ce.playSound(key);
      return;
    }
  }

  if (muted) return;
  w.__pixdonePlaySound?.(key);
}

/** For UI: whether sound is enabled (vanilla getSoundEnabled when available, else !muted). */
export function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const w = window as unknown as {
    taskAnimationEffects?: { comicEffects?: { getSoundEnabled?: () => boolean } };
  };
  if (w.taskAnimationEffects?.comicEffects?.getSoundEnabled) {
    return w.taskAnimationEffects.comicEffects.getSoundEnabled();
  }
  return !muted;
}
