/**
 * Pico Sound - subtle 8-bit beeps for subtask completion (Pixdone)
 * Web Audio API, no external libs. Mono, short beeps, pitch scales with progress.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'pixdone_subtask_sound_enabled';
    const PICO_COOLDOWN_MS = 80;
    const BEEP_DURATION_MS = 90;
    const STEPS = [261.63, 293.66, 329.63, 392.0, 523.25]; // C4, D4, E4, G4, C5 (C major-ish)
    const STEP_COUNT = STEPS.length;

    let audioCtx = null;
    let resumeGestureDone = false;
    let lastPlayedAt = 0;

    function getSoundEnabled() {
        try {
            const v = localStorage.getItem(STORAGE_KEY);
            return v === null ? true : v === 'true';
        } catch (_) {
            return true;
        }
    }

    function setSoundEnabled(enabled) {
        try {
            localStorage.setItem(STORAGE_KEY, String(!!enabled));
        } catch (_) {}
    }

    function ensureContext() {
        if (audioCtx) return audioCtx;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
        return audioCtx;
    }

    function resumeOnFirstGesture() {
        if (resumeGestureDone || !audioCtx) return;
        resumeGestureDone = true;
        function resume() {
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            document.removeEventListener('pointerdown', resume);
            document.removeEventListener('touchstart', resume);
            document.removeEventListener('keydown', resume);
        }
        document.addEventListener('pointerdown', resume, { once: true, passive: true });
        document.addEventListener('touchstart', resume, { once: true, passive: true });
        document.addEventListener('keydown', resume, { once: true, passive: true });
    }

    /**
     * Play a short 8-bit style beep.
     * @param {number} frequencyHz
     * @param {number} durationMs
     * @param {number} gainMultiplier 0..1, kept low for subtlety
     */
    function playBeep(frequencyHz, durationMs, gainMultiplier) {
        const ctx = ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = Math.min(Math.max(durationMs / 1000, 0.05), 0.2);

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(frequencyHz, now);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const peak = 0.08 * (gainMultiplier || 1);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(peak, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(peak * 0.6, now + duration * 0.3);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Play subtask-complete pico sound. Call only when a subtask transitions to completed.
     * @param {{ total: number, completed: number }} opts - total subtasks, completed count (after this toggle)
     */
    function playSubtaskCompleteSound(opts) {
        if (!opts || typeof opts.total !== 'number' || typeof opts.completed !== 'number') return;
        if (!getSoundEnabled()) return;

        const now = Date.now();
        if (now - lastPlayedAt < PICO_COOLDOWN_MS) return;

        const ctx = ensureContext();
        if (!ctx) return;
        resumeOnFirstGesture();
        if (ctx.state === 'suspended') return;

        const total = Math.max(1, opts.total);
        const completed = Math.max(0, Math.min(opts.completed, total));
        const progress = completed / total;
        const stepIndex = Math.min(
            STEP_COUNT - 1,
            Math.max(0, Math.floor(progress * STEP_COUNT))
        );
        const freq = STEPS[stepIndex];
        const volumeScale = 0.7 + 0.3 * (stepIndex / (STEP_COUNT - 1 || 1));

        playBeep(freq, BEEP_DURATION_MS, volumeScale);
        lastPlayedAt = now;
    }

    function initPicoSound() {
        ensureContext();
        resumeOnFirstGesture();
    }

    window.picoSound = {
        initPicoSound,
        playSubtaskCompleteSound,
        getSoundEnabled,
        setSoundEnabled
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPicoSound);
    } else {
        initPicoSound();
    }
})();
