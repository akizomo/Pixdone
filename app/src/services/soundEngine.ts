/**
 * Retro 8-bit sound engine for PixDone React app.
 * Uses Web Audio API with square wave oscillators (no external libs).
 * Registers window.__pixdonePlaySound so ThemeProvider + sound.ts work as-is.
 */

let audioCtx: AudioContext | null = null;
let unlocked = false;
let currentPack = 'retro'; // 'retro' | 'synth'

function getCtx(): AudioContext | null {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

function unlockOnGesture() {
  if (unlocked) return;
  const resume = () => {
    unlocked = true;
    const ctx = getCtx();
    if (ctx?.state === 'suspended') ctx.resume();
    document.removeEventListener('pointerdown', resume);
    document.removeEventListener('touchstart', resume);
    document.removeEventListener('keydown', resume);
  };
  document.addEventListener('pointerdown', resume, { once: true, passive: true });
  document.addEventListener('touchstart', resume, { once: true, passive: true });
  document.addEventListener('keydown', resume, { once: true, passive: true });
}

function isSoundEnabled(): boolean {
  try { return localStorage.getItem('pixdone-sound-enabled') !== 'false'; } catch { return true; }
}

/**
 * Play a square-wave beep.
 * @param freq    frequency in Hz
 * @param dur     duration in seconds
 * @param vol     peak volume 0..1 (kept low, typically 0.06-0.1)
 * @param delay   start delay from now in seconds
 */
function beep(freq: number, dur: number, vol = 0.07, delay = 0) {
  const ctx = getCtx();
  if (!ctx) return;

  const schedule = () => {
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.linearRampToValueAtTime(vol * 0.5, now + dur * 0.4);
    gain.gain.linearRampToValueAtTime(0, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(schedule);
  } else {
    schedule();
  }
}

/** Play a sine blip (softer, for UI clicks) */
function blip(freq: number, dur: number, vol = 0.05, delay = 0) {
  const ctx = getCtx();
  if (!ctx) return;

  const schedule = () => {
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.008);
    gain.gain.linearRampToValueAtTime(0, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(schedule);
  } else {
    schedule();
  }
}

const sounds: Record<string, () => void> = {
  buttonClick: () => blip(660, 0.06, 0.04),

  taskAdd: () => {
    beep(523, 0.07, 0.07, 0);      // C5
    beep(659, 0.07, 0.07, 0.08);   // E5
  },

  taskEdit: () => {
    beep(440, 0.08, 0.06, 0);
  },

  taskDelete: () => {
    beep(330, 0.07, 0.06, 0);
    beep(247, 0.09, 0.06, 0.08);
  },

  taskCancel: () => {
    beep(277, 0.09, 0.05, 0);
  },

  taskComplete: () => {
    // C-E-G ascending arp
    beep(523, 0.07, 0.08, 0);
    beep(659, 0.07, 0.08, 0.09);
    beep(784, 0.12, 0.08, 0.18);
  },

  // Timer finished alarm — longer, alarm-like, but still pixel/square.
  focusAlarm: () => {
    // Two short "rings" (approx 1.4s total)
    const ring = (start: number) => {
      beep(988, 0.10, 0.09, start + 0.00); // B5
      beep(784, 0.10, 0.08, start + 0.12); // G5
      beep(988, 0.10, 0.09, start + 0.24);
      beep(784, 0.14, 0.08, start + 0.36);
    };
    ring(0.00);
    ring(0.72);
  },

  perfectTimingGreat: () => {
    // Short celebratory arpeggio (higher & brighter than taskComplete)
    beep(784, 0.07, 0.09, 0);     // G5
    beep(988, 0.07, 0.09, 0.09);  // B5
    beep(1175, 0.10, 0.09, 0.18); // D6
  },

  subtaskComplete: () => blip(523, 0.07, 0.06),
};

const soundsSynth: Record<string, () => void> = {
  ...sounds,
  taskAdd: () => {
    blip(880, 0.07, 0.07, 0);
    blip(1046, 0.07, 0.07, 0.08);
  },
  taskComplete: () => {
    blip(880, 0.06, 0.08, 0);
    blip(1046, 0.06, 0.08, 0.08);
    blip(1318, 0.10, 0.08, 0.16);
  },
  focusAlarm: () => {
    const ring = (start: number) => {
      blip(988, 0.10, 0.09, start + 0.00);
      blip(784, 0.10, 0.08, start + 0.12);
      blip(988, 0.10, 0.09, start + 0.24);
      blip(784, 0.14, 0.08, start + 0.36);
    };
    ring(0.00);
    ring(0.72);
  },
  perfectTimingGreat: () => {
    blip(784, 0.06, 0.09, 0);
    blip(988, 0.06, 0.09, 0.08);
    blip(1175, 0.10, 0.09, 0.16);
  },
};

function playSound(key: string) {
  if (!isSoundEnabled()) return;
  const pack = currentPack === 'synth' ? soundsSynth : sounds;
  pack[key]?.();
}

export function initSoundEngine() {
  getCtx();
  unlockOnGesture();

  const w = window as unknown as {
    __pixdonePlaySound?: (k: string) => void;
    __pixdoneSetSoundPack?: (pack: string) => void;
  };
  w.__pixdonePlaySound = playSound;
  w.__pixdoneSetSoundPack = (pack: string) => { currentPack = pack; };
}
