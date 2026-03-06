/**
 * Sound service – maps design token sound keys to playback.
 * In the full app this would wrap ComicEffectsManager / picoSound.
 */
export type SoundKey = 'taskAdd' | 'taskEdit' | 'taskDelete' | 'taskCancel' | 'taskComplete' | 'buttonClick' | 'subtaskComplete';

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
