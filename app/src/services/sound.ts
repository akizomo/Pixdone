/**
 * Sound service – maps design token sound keys to playback.
 * In the full app this would wrap ComicEffectsManager / picoSound.
 * Sound keys and when to use them: see design-system foundations (sound.tokens) and Foundations PXD/Sound.
 */
import type { SoundKey } from '../design-system';

let muted = false;

export function setSoundMuted(m: boolean) {
  muted = m;
}

export function playSound(key: SoundKey): void {
  if (muted) return;
  // Placeholder: no-op. Wire to comicEffects.playSound(key) when integrating.
  if (typeof window !== 'undefined' && (window as unknown as { __pixdonePlaySound?: (k: string) => void }).__pixdonePlaySound) {
    (window as unknown as { __pixdonePlaySound: (k: string) => void }).__pixdonePlaySound(key);
  }
}
