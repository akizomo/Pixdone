/**
 * Retro 8-bit sound engine for PixDone React app.
 * Uses Web Audio API with square wave oscillators (no external libs).
 * Registers window.__pixdonePlaySound so ThemeProvider + sound.ts work as-is.
 */

let audioCtx: AudioContext | null = null;
let unlocked = false;
let currentPack = 'retro'; // 'retro' | 'synth' | 'synthwave'

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

/**
 * Synthwave-ish tone: slightly detuned saw/triangle + gentle LFO vibrato.
 * Keeps volume conservative to avoid fatigue.
 */
function neon(freq: number, dur: number, vol = 0.05, delay = 0, type: OscillatorType = 'sawtooth') {
  const ctx = getCtx();
  if (!ctx) return;

  const schedule = () => {
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    // Vibrato
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(6.0, now);
    lfoGain.gain.setValueAtTime(Math.min(12, freq * 0.01), now); // small cents-ish
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Gentle low-pass to avoid harshness
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.max(800, freq * 2.4), now);
    filter.Q.setValueAtTime(0.6, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.linearRampToValueAtTime(vol * 0.6, now + dur * 0.5);
    gain.gain.linearRampToValueAtTime(0, now + dur);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + dur + 0.02);
    osc.stop(now + dur + 0.02);
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(schedule);
  } else {
    schedule();
  }
}

function neonChord(base: number, dur: number, vol: number, delay: number, intervals: number[], type: OscillatorType = 'sawtooth') {
  intervals.forEach((semitones) => {
    const f = base * Math.pow(2, semitones / 12);
    neon(f, dur, vol, delay, type);
  });
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

  // Pomodoro finished — positive, slightly longer fanfare (pixel/square)
  focusPomodoroComplete: () => {
    // Bright major-ish rise + final hold (~2.2s)
    const phrase = (start: number) => {
      beep(784, 0.08, 0.08, start + 0.00);  // G5
      beep(988, 0.08, 0.08, start + 0.10);  // B5
      beep(1175, 0.10, 0.08, start + 0.20); // D6
      beep(1568, 0.16, 0.08, start + 0.34); // G6
    };
    phrase(0.00);
    phrase(0.55);
    // Final hold
    beep(1175, 0.55, 0.07, 1.15);
    beep(1568, 0.70, 0.06, 1.15);
  },

  // Break finished — lighter "back to work" cue (~1.6s)
  focusBreakComplete: () => {
    const ring = (start: number) => {
      beep(659, 0.08, 0.07, start + 0.00); // E5
      beep(784, 0.10, 0.07, start + 0.10); // G5
      beep(988, 0.14, 0.06, start + 0.24); // B5
    };
    ring(0.00);
    ring(0.55);
    beep(784, 0.28, 0.05, 1.10);
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
  focusPomodoroComplete: () => {
    const phrase = (start: number) => {
      blip(784, 0.07, 0.08, start + 0.00);
      blip(988, 0.07, 0.08, start + 0.09);
      blip(1175, 0.09, 0.08, start + 0.18);
      blip(1568, 0.14, 0.07, start + 0.30);
    };
    phrase(0.00);
    phrase(0.50);
    blip(1175, 0.50, 0.06, 1.05);
    blip(1568, 0.64, 0.055, 1.05);
  },
  focusBreakComplete: () => {
    const ring = (start: number) => {
      blip(659, 0.07, 0.07, start + 0.00);
      blip(784, 0.09, 0.07, start + 0.09);
      blip(988, 0.12, 0.06, start + 0.20);
    };
    ring(0.00);
    ring(0.52);
    blip(784, 0.24, 0.05, 1.02);
  },
  perfectTimingGreat: () => {
    blip(784, 0.06, 0.09, 0);
    blip(988, 0.06, 0.09, 0.08);
    blip(1175, 0.10, 0.09, 0.16);
  },
};

const soundsSynthwave: Record<string, () => void> = {
  ...sounds,
  buttonClick: () => neon(740, 0.05, 0.035, 0, 'triangle'),
  taskAdd: () => {
    // bright major dyad, short
    neonChord(880, 0.07, 0.045, 0.0, [0, 7], 'sawtooth');
    neonChord(988, 0.07, 0.045, 0.08, [0, 7], 'sawtooth');
  },
  taskEdit: () => neon(554, 0.08, 0.04, 0, 'triangle'),
  taskDelete: () => {
    neon(370, 0.07, 0.05, 0.0, 'sawtooth');
    neon(277, 0.09, 0.05, 0.08, 'sawtooth');
  },
  taskCancel: () => neon(311, 0.09, 0.04, 0, 'triangle'),
  taskComplete: () => {
    // neon arpeggio
    neon(880, 0.06, 0.055, 0.00, 'sawtooth');
    neon(1109, 0.06, 0.055, 0.08, 'sawtooth');
    neon(1397, 0.10, 0.055, 0.16, 'sawtooth');
  },
  focusAlarm: () => {
    // two neon "rings"
    const ring = (start: number) => {
      neon(988, 0.10, 0.06, start + 0.00, 'sawtooth');
      neon(784, 0.10, 0.055, start + 0.12, 'sawtooth');
      neon(988, 0.10, 0.06, start + 0.24, 'sawtooth');
      neon(784, 0.14, 0.055, start + 0.36, 'sawtooth');
    };
    ring(0.00);
    ring(0.72);
  },
  focusPomodoroComplete: () => {
    const phrase = (start: number) => {
      neon(784, 0.07, 0.06, start + 0.00, 'sawtooth');
      neon(988, 0.07, 0.06, start + 0.09, 'sawtooth');
      neon(1175, 0.09, 0.06, start + 0.18, 'sawtooth');
      neon(1568, 0.14, 0.055, start + 0.30, 'sawtooth');
    };
    phrase(0.00);
    phrase(0.52);
    // Final shimmer hold (two notes)
    neon(1175, 0.52, 0.05, 1.05, 'sawtooth');
    neon(1568, 0.70, 0.045, 1.05, 'sawtooth');
  },
  focusBreakComplete: () => {
    const ring = (start: number) => {
      neon(659, 0.07, 0.055, start + 0.00, 'triangle');
      neon(784, 0.09, 0.055, start + 0.09, 'triangle');
      neon(988, 0.12, 0.05, start + 0.20, 'triangle');
    };
    ring(0.00);
    ring(0.52);
    neon(784, 0.24, 0.045, 1.02, 'triangle');
  },
  perfectTimingGreat: () => {
    neon(1046, 0.06, 0.06, 0.00, 'sawtooth');
    neon(1318, 0.06, 0.06, 0.08, 'sawtooth');
    neon(1568, 0.10, 0.06, 0.16, 'sawtooth');
  },
  subtaskComplete: () => neon(659, 0.06, 0.04, 0, 'triangle'),
};

function playSound(key: string) {
  if (!isSoundEnabled()) return;
  const pack =
    currentPack === 'synthwave'
      ? soundsSynthwave
      : currentPack === 'synth'
        ? soundsSynth
        : sounds;
  pack[key]?.();
}

export function initSoundEngine() {
  getCtx();
  unlockOnGesture();

  const w = window as unknown as {
    __pixdonePlaySound?: (k: string) => void;
    __pixdoneSetSoundPack?: (pack: string) => void;
    __pixdoneGetSoundPack?: () => string;
    __pixdoneDesiredSoundPack?: string;
  };
  w.__pixdonePlaySound = playSound;
  w.__pixdoneSetSoundPack = (pack: string) => {
    if (pack === 'retro' || pack === 'synth' || pack === 'synthwave') currentPack = pack;
  };
  w.__pixdoneGetSoundPack = () => currentPack;

  // Apply desired pack if ThemeProvider ran first.
  const desired = w.__pixdoneDesiredSoundPack;
  if (desired === 'retro' || desired === 'synth' || desired === 'synthwave') {
    currentPack = desired;
  }
}
