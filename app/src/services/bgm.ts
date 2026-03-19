/**
 * Focus BGM — Web Audio API, no external files.
 * All tracks match PixDone's pixel / retro aesthetic.
 *
 * Retro    – 8-bit chiptune melody + bass (square wave, C major, 120 BPM)
 * Synthwave– arpeggiated chords + sawtooth bass (Am→F→C→G, 95 BPM)
 * Chill    – RPG town-style, triangle wave, pentatonic, 72 BPM
 *
 * Initial state: OFF (safe for browser autoplay policy).
 * Volume 0.06 — tuned so SFX stays readable by default.
 */

export type BgmTrack =
  | 'retro'
  | 'synthwave'
  | 'chill'
  | 'rain'
  | 'fireplace'
  | 'nightCity';

const BGM_ENABLED_KEY = 'pixdone-bgm-enabled';
const BGM_TRACK_KEY   = 'pixdone-bgm-track';
const BGM_VOL_KEY     = 'pixdone-bgm-volume';
const BGM_VOLUME      = 0.06; // default

let bgmCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeNodes: AudioNode[] = [];
let loopTimer: ReturnType<typeof setTimeout> | null = null;
let extraTimers: ReturnType<typeof setTimeout>[] = [];
let _playing = false;
let _track: BgmTrack = 'retro';

/* ── AudioContext ─────────────────────────────────────── */

function getSavedVolume(): number {
  try { return parseFloat(localStorage.getItem(BGM_VOL_KEY) ?? '') || BGM_VOLUME; } catch { return BGM_VOLUME; }
}

function getCtx(): AudioContext | null {
  if (bgmCtx) return bgmCtx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  bgmCtx = new Ctor();
  masterGain = bgmCtx.createGain();
  masterGain.gain.value = getSavedVolume();
  masterGain.connect(bgmCtx.destination);
  return bgmCtx;
}

export function getBgmVolume(): number {
  return getSavedVolume();
}

export function setBgmVolume(vol: number): void {
  const v = Math.max(0, Math.min(1, vol));
  try { localStorage.setItem(BGM_VOL_KEY, String(v)); } catch { /* ignore */ }
  if (masterGain) masterGain.gain.value = v;
}

function killNodes() {
  for (const n of activeNodes) {
    try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* ignore */ }
    try { n.disconnect(); } catch { /* ignore */ }
  }
  activeNodes = [];
  if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
  for (const t of extraTimers) clearTimeout(t);
  extraTimers = [];
}

/* ── Helpers ─────────────────────────────────────────── */

type OscType = OscillatorType;

/** Schedule a single note. Returns the nodes created. */
function note(
  ctx: AudioContext, out: AudioNode,
  hz: number, startAt: number, durSec: number,
  vol: number, type: OscType = 'square',
) {
  if (hz <= 0) return;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = type;
  osc.frequency.value = hz;
  osc.connect(g); g.connect(out);
  g.gain.setValueAtTime(0, startAt);
  g.gain.linearRampToValueAtTime(vol, startAt + 0.01);
  g.gain.linearRampToValueAtTime(vol * 0.5, startAt + durSec * 0.5);
  g.gain.linearRampToValueAtTime(0, startAt + durSec * 0.92);
  osc.start(startAt);
  osc.stop(startAt + durSec + 0.02);
  activeNodes.push(osc);
}

/** Schedule a repeating sequence. Calls itself via setTimeout. */
function loopSeq(
  ctx: AudioContext, out: AudioNode,
  seq: Array<{ hz: number; beats: number; vol?: number; type?: OscType }>,
  bpm: number,
  startAt: number,
  checkTrack: BgmTrack,
) {
  const beat = 60 / bpm;
  let t = startAt;
  for (const s of seq) {
    note(ctx, out, s.hz, t, s.beats * beat * 0.9, s.vol ?? 0.8, s.type ?? 'square');
    t += s.beats * beat;
  }
  const msLeft  = (t - ctx.currentTime - 0.2) * 1000;
  loopTimer = setTimeout(() => {
    if (_playing && _track === checkTrack) loopSeq(ctx, out, seq, bpm, t, checkTrack);
  }, Math.max(0, msLeft));
}

/* ── Track 1: Retro (chiptune) ───────────────────────── */
// C major, 120 BPM, square wave melody + triangle bass
// 16 beats (2 bars × 8 8th-notes) → ~8 s loop

const R_BPM = 120;
const R_B   = 0.5; // 8th note

const RETRO_MELODY = [
  // Phrase A (bars 1–2)
  { hz:523, beats:R_B }, { hz:659, beats:R_B }, { hz:784, beats:R_B }, { hz:659, beats:R_B },
  { hz:440, beats:R_B }, { hz:523, beats:R_B }, { hz:659, beats:R_B }, { hz:587, beats:R_B },
  // Phrase B (bars 3–4)
  { hz:523, beats:R_B }, { hz:392, beats:R_B }, { hz:523, beats:R_B }, { hz:659, beats:R_B },
  { hz:392, beats:R_B*2 }, { hz:0,   beats:R_B*2 },
  // Phrase C (bars 5–6)
  { hz:440, beats:R_B }, { hz:523, beats:R_B }, { hz:440, beats:R_B }, { hz:392, beats:R_B },
  { hz:349, beats:R_B }, { hz:440, beats:R_B }, { hz:523, beats:R_B }, { hz:440, beats:R_B },
  // Phrase D (bars 7–8)
  { hz:392, beats:R_B }, { hz:494, beats:R_B }, { hz:587, beats:R_B }, { hz:494, beats:R_B },
  { hz:523, beats:R_B*2 }, { hz:0,   beats:R_B*2 },
];

const RETRO_BASS = [
  { hz:131, beats:2, type:'triangle' as OscType }, // C2
  { hz:131, beats:2, type:'triangle' as OscType },
  { hz:131, beats:2, type:'triangle' as OscType },
  { hz:131, beats:2, type:'triangle' as OscType },
  { hz:220, beats:2, type:'triangle' as OscType }, // A2
  { hz:175, beats:2, type:'triangle' as OscType }, // F2
  { hz:196, beats:2, type:'triangle' as OscType }, // G2
  { hz:131, beats:2, type:'triangle' as OscType }, // C2
];

function startRetro(ctx: AudioContext, out: AudioNode) {
  const t0 = ctx.currentTime + 0.05;
  loopSeq(ctx, out, RETRO_MELODY.map(s => ({ ...s, vol:0.9 })), R_BPM, t0, 'retro');

  // bass runs in parallel — schedule manually since it has a different loop length
  const bassGain = ctx.createGain();
  bassGain.gain.value = 0.55;
  bassGain.connect(out);
  activeNodes.push(bassGain);
  loopBass(ctx, bassGain, t0);
}

function loopBass(ctx: AudioContext, out: AudioNode, startAt: number) {
  const beat = 60 / R_BPM;
  let t = startAt;
  for (const s of RETRO_BASS) {
    note(ctx, out, s.hz, t, s.beats * beat * 0.85, 0.8, s.type ?? 'triangle');
    t += s.beats * beat;
  }
  const msLeft = (t - ctx.currentTime - 0.2) * 1000;
  // use a second timer key — store in activeNodes via closure check
  extraTimers.push(setTimeout(() => {
    if (_playing && _track === 'retro') loopBass(ctx, out, t);
  }, Math.max(0, msLeft)));
}

/* ── Track 2: Synthwave ──────────────────────────────── */
// Am → F → C → G, 95 BPM, sawtooth bass + arpeggiated lead

const SW_BPM  = 95;
// 16th note length is implicit in SW_BPM*4 scheduling

// Arpeggio pattern over 4 chords × 8 16th-notes each = 32 steps, ~8 s
const SW_ARPS = [
  // Am: A3 C4 E4 A4 E4 C4 A3 rest
  220, 262, 330, 440, 330, 262, 220, 0,
  // F: F3 A3 C4 F4 C4 A3 F3 rest
  175, 220, 262, 349, 262, 220, 175, 0,
  // C: C4 E4 G4 C5 G4 E4 C4 rest
  262, 330, 392, 523, 392, 330, 262, 0,
  // G: G3 B3 D4 G4 D4 B3 G3 rest
  196, 247, 294, 392, 294, 247, 196, 0,
];

const SW_BASS_NOTES = [
  { hz:110, beats:4 }, // A2 (Am chord, 1 bar)
  { hz:87,  beats:4 }, // F2
  { hz:65,  beats:4 }, // C2
  { hz:98,  beats:4 }, // G2
];

function startSynthwave(ctx: AudioContext, out: AudioNode) {
  const t0 = ctx.currentTime + 0.05;

  // Arp lead (sawtooth)
  const arpSeq = SW_ARPS.map(hz => ({ hz, beats:1, type:'sawtooth' as OscType, vol:0.7 }));
  loopSeq(ctx, out, arpSeq, SW_BPM * 4, t0, 'synthwave'); // BPM×4 since we're doing 16th-note steps

  // Bass (sawtooth, lowpass filtered)
  const bfilt = ctx.createBiquadFilter();
  bfilt.type = 'lowpass'; bfilt.frequency.value = 400; bfilt.Q.value = 1.5;
  bfilt.connect(out);
  activeNodes.push(bfilt);
  loopSwBass(ctx, bfilt, t0);
}

function loopSwBass(ctx: AudioContext, out: AudioNode, startAt: number) {
  const beat = 60 / SW_BPM;
  let t = startAt;
  for (const s of SW_BASS_NOTES) {
    note(ctx, out, s.hz, t, s.beats * beat * 0.8, 0.9, 'sawtooth');
    t += s.beats * beat;
  }
  extraTimers.push(setTimeout(() => {
    if (_playing && _track === 'synthwave') loopSwBass(ctx, out, t);
  }, Math.max(0, (t - ctx.currentTime - 0.2) * 1000)));
}

/* ── Track 3: Chill (RPG town) ───────────────────────── */
// G major pentatonic, triangle wave, 72 BPM, half-note melody

const CHILL_BPM = 72;
const CHILL_H   = 2; // half note (2 beats)
const CHILL_Q   = 1; // quarter

const CHILL_MELODY = [
  // Bar 1-2
  { hz:392, beats:CHILL_H, type:'triangle' as OscType }, // G4
  { hz:440, beats:CHILL_Q, type:'triangle' as OscType }, // A4
  { hz:494, beats:CHILL_Q, type:'triangle' as OscType }, // B4
  { hz:523, beats:CHILL_H, type:'triangle' as OscType }, // C5
  { hz:0,   beats:CHILL_H },
  // Bar 3-4
  { hz:494, beats:CHILL_H, type:'triangle' as OscType }, // B4
  { hz:440, beats:CHILL_Q, type:'triangle' as OscType }, // A4
  { hz:392, beats:CHILL_Q, type:'triangle' as OscType }, // G4
  { hz:0,   beats:CHILL_H*2 },
  // Bar 5-6
  { hz:330, beats:CHILL_H, type:'triangle' as OscType }, // E4
  { hz:392, beats:CHILL_H, type:'triangle' as OscType }, // G4
  { hz:440, beats:CHILL_H, type:'triangle' as OscType }, // A4
  { hz:0,   beats:CHILL_H },
  // Bar 7-8
  { hz:494, beats:CHILL_H, type:'triangle' as OscType }, // B4
  { hz:523, beats:CHILL_Q, type:'triangle' as OscType }, // C5
  { hz:440, beats:CHILL_Q, type:'triangle' as OscType }, // A4
  { hz:392, beats:CHILL_H*2, type:'triangle' as OscType }, // G4 (hold)
];

const CHILL_BASS = [
  { hz:98,  beats:4, type:'triangle' as OscType }, // G2
  { hz:98,  beats:4, type:'triangle' as OscType },
  { hz:82,  beats:4, type:'triangle' as OscType }, // E2
  { hz:98,  beats:4, type:'triangle' as OscType }, // G2
  { hz:110, beats:4, type:'triangle' as OscType }, // A2
  { hz:98,  beats:4, type:'triangle' as OscType }, // G2
  { hz:110, beats:4, type:'triangle' as OscType }, // A2
  { hz:98,  beats:4, type:'triangle' as OscType }, // G2
];

function startChill(ctx: AudioContext, out: AudioNode) {
  const t0 = ctx.currentTime + 0.05;
  loopSeq(ctx, out, CHILL_MELODY.map(s => ({ ...s, vol: 0.85 })), CHILL_BPM, t0, 'chill');

  const bassGain = ctx.createGain();
  bassGain.gain.value = 0.5;
  bassGain.connect(out);
  activeNodes.push(bassGain);
  loopChillBass(ctx, bassGain, t0);
}

function loopChillBass(ctx: AudioContext, out: AudioNode, startAt: number) {
  const beat = 60 / CHILL_BPM;
  let t = startAt;
  for (const s of CHILL_BASS) {
    note(ctx, out, s.hz, t, s.beats * beat * 0.75, 0.8, s.type);
    t += s.beats * beat;
  }
  extraTimers.push(setTimeout(() => {
    if (_playing && _track === 'chill') loopChillBass(ctx, out, t);
  }, Math.max(0, (t - ctx.currentTime - 0.2) * 1000)));
}

/* ── Track 4: Rain (ambient) ─────────────────────────── */
function startRain(ctx: AudioContext, out: AudioNode) {
  // Pink-ish noise rain bed with gentle movement + occasional droplets
  const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    // simple low-pass on white noise -> softer rain
    const white = Math.random() * 2 - 1;
    last = last * 0.985 + white * 0.015;
    data[i] = last;
  }

  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 350;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.8;

  const g = ctx.createGain();
  // Bed volume: keep rain texture audible even under SFX
  g.gain.value = 0.50;

  src.connect(hp);
  hp.connect(bp);
  bp.connect(g);
  g.connect(out);
  src.start();

  activeNodes.push(src, hp, bp, g);

  const t0 = ctx.currentTime;
  // slow shimmer in band
  bp.frequency.setValueAtTime(1600, t0);
  bp.frequency.linearRampToValueAtTime(2200, t0 + 6.0);
  bp.frequency.linearRampToValueAtTime(1700, t0 + 12.0);

  const scheduleDroplet = () => {
    if (!_playing || _track !== 'rain') return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 1200 + Math.random() * 800;
    og.gain.setValueAtTime(0, now);
    // Droplet: keep as accent, not the main presence
    og.gain.linearRampToValueAtTime(0.035, now + 0.005);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    osc.connect(og);
    og.connect(out);
    osc.start(now);
    osc.stop(now + 0.08);
    activeNodes.push(osc, og);
    extraTimers.push(setTimeout(scheduleDroplet, 450 + Math.random() * 900));
  };
  extraTimers.push(setTimeout(scheduleDroplet, 600));
}

/* ── Track 5: Fireplace (ambient) ────────────────────── */
function startFireplace(ctx: AudioContext, out: AudioNode) {
  // Low warm hum + random crackles (noise bursts)
  const hum = ctx.createOscillator();
  hum.type = 'triangle';
  hum.frequency.value = 55;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.05;
  hum.connect(humGain);
  humGain.connect(out);
  hum.start();
  activeNodes.push(hum, humGain);

  const crackleNoise = () => {
    if (!_playing || _track !== 'fireplace') return;
    const dur = 0.03 + Math.random() * 0.06;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource();
    s.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1200 + Math.random() * 800;

    const g = ctx.createGain();
    g.gain.value = 0.16 + Math.random() * 0.08;

    s.connect(hp);
    hp.connect(g);
    g.connect(out);
    s.start();
    s.stop(ctx.currentTime + dur + 0.01);
    activeNodes.push(s, hp, g);

    extraTimers.push(setTimeout(crackleNoise, 80 + Math.random() * 220));
  };
  extraTimers.push(setTimeout(crackleNoise, 120));
}

/* ── Track 6: Night City (ambient) ───────────────────── */
function startNightCity(ctx: AudioContext, out: AudioNode) {
  // Neon hum (slow detuned saw) + subtle sign noise + distant car sweeps
  const humA = ctx.createOscillator();
  const humB = ctx.createOscillator();
  humA.type = 'sawtooth';
  humB.type = 'triangle';
  humA.frequency.value = 110;
  humB.frequency.value = 110.6;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.035;
  humA.connect(humGain);
  humB.connect(humGain);
  humGain.connect(out);
  humA.start();
  humB.start();
  activeNodes.push(humA, humB, humGain);

  const signBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.5), ctx.sampleRate);
  const sd = signBuf.getChannelData(0);
  for (let i = 0; i < sd.length; i++) sd[i] = (Math.random() * 2 - 1) * 0.25;
  const sign = ctx.createBufferSource();
  sign.buffer = signBuf;
  sign.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2500;
  bp.Q.value = 2.0;
  const sg = ctx.createGain();
  sg.gain.value = 0.10;
  sign.connect(bp);
  bp.connect(sg);
  sg.connect(out);
  sign.start();
  activeNodes.push(sign, bp, sg);

  const scheduleCar = () => {
    if (!_playing || _track !== 'nightCity') return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.05, now + 0.12);
    g.gain.linearRampToValueAtTime(0.0, now + 1.2);
    osc.frequency.setValueAtTime(220 + Math.random() * 80, now);
    osc.frequency.linearRampToValueAtTime(140 + Math.random() * 50, now + 1.2);
    osc.connect(g);
    g.connect(out);
    osc.start(now);
    osc.stop(now + 1.25);
    activeNodes.push(osc, g);
    extraTimers.push(setTimeout(scheduleCar, 1800 + Math.random() * 3200));
  };
  extraTimers.push(setTimeout(scheduleCar, 2200));
}

/* ── Public API ──────────────────────────────────────── */

export function startBgm(track?: BgmTrack): void {
  try {
    const ctx = getCtx();
    if (!ctx || !masterGain) return;
    if (ctx.state === 'suspended') ctx.resume();
    const requested = track ?? _track;
    if (_playing && requested === _track) return;
    _track = requested;
    stopBgm();
    _playing = true;
    if (_track === 'retro')          startRetro(ctx, masterGain);
    else if (_track === 'synthwave') startSynthwave(ctx, masterGain);
    else if (_track === 'chill')     startChill(ctx, masterGain);
    else if (_track === 'rain')      startRain(ctx, masterGain);
    else if (_track === 'fireplace') startFireplace(ctx, masterGain);
    else if (_track === 'nightCity') startNightCity(ctx, masterGain);
  } catch (e) {
    console.warn('[bgm] start failed:', e);
  }
}

export function stopBgm(): void {
  _playing = false;
  killNodes();
}

export function setBgmTrack(track: BgmTrack): void {
  try { localStorage.setItem(BGM_TRACK_KEY, track); } catch { /* ignore */ }
  if (_playing) {
    // startBgm handles switching tracks; don't pre-mutate _track or it may early-return.
    startBgm(track);
  } else {
    _track = track;
  }
}

export function getBgmTrack(): BgmTrack {
  try { return (localStorage.getItem(BGM_TRACK_KEY) as BgmTrack) ?? 'retro'; } catch { return 'retro'; }
}

/** Initial state: OFF (browser autoplay safety). */
export function isBgmOn(): boolean {
  try { return localStorage.getItem(BGM_ENABLED_KEY) === 'true'; } catch { return false; }
}

export function setBgmOn(on: boolean): void {
  try { localStorage.setItem(BGM_ENABLED_KEY, on ? 'true' : 'false'); } catch { /* ignore */ }
  // Playback is controlled by Focus UI (e.g. only while timer running and menu open).
  if (!on) stopBgm();
}
