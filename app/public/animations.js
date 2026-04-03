/**
 * Comic-Style Task Effects Module
 * Short, fun animations anchored to completed tasks
 */

const WORLD_SHUTDOWN_CRT_CONFIG = {
    // (A) Logo check removal 0–320ms
    logoRemovalTransformMs: 260,
    logoRemovalOpacityMs: 220,
    logoScaleEnd: 0.70,
    logoTranslateY: 10,
    logoRotate: -8,
    phaseAEnd: 320,
    // (B) Collapse 320–780ms (2-phase)
    preCollapseDurationMs: 220,
    preCollapseScaleY: 0.35,
    collapseDurationMs: 240,
    scaleYMin: 0.02,
    containerOpacityCollapse: 0.9,
    // (C) LINE STAGE 780–1040ms
    lineHoldMs: 260,
    // (D) HARD BLACK CUT IN @1040ms
    // (E) BLACKOUT HOLD 1040–2240ms
    blackoutDurationMs: 1200,
    textLine1DelayMs: 60,
    textLine1FadeMs: 140,
    textLine2DelayMs: 240,
    textLine2FadeMs: 140,
    noiseOpacity: 0.06,
    // (F) HARD BLACK CUT OUT @2240ms
    // (G) Reboot 2240–2680ms
    rebootDurationMs: 380,
    scanlineDurationMs: 160,
    scanlineGapMs: 80,
    // (F) Logo restore (reboot + 80ms)
    logoReturnDelayMs: 80,
    logoReturnMs: 220,
    logoReturnScaleStart: 0.86,
    lockInputMs: 2760,
};

class ComicEffectsManager {
    constructor() {
        // Base "common" pool (used as the default in all themes)
        // NOTE: Theme-specific effects can be layered in as "rare"/"super rare".
        // Common pool (baseline). Theme-specific "rare" pools should NOT overlap this list.
        this.commonEffects = [
            "explode",
            "flyAway",
            "vanish",
            "melt",
            "bounce",
            "slideLeft",
            "slideRight",
            "flip",
            "shrink",
            "stretch",
            "wobble",
            "fadeOut",
        ];

        // Arcade theme: split the former "normal pool" into common + rare.
        // Keep this list small so it feels special without being disruptive.
        this.arcadeRareEffects = [
            "tornado",
            "shatter",
            "spinOff",
            "crumpleThrow",
        ];

        // Super rare pool (Plus-only roll)
        this.superRareEffects = ["rainbowSmash", "freeze"];

        // Synthwave theme: treat its "normal" effects as rare.
        // Common effects remain available so Synthwave isn't "rare-only".
        this.synthwaveRareEffects = ["glitchSlide", "neonWarp"];
        this.synthwaveSuperRareEffects = ["neonBigBang"];

        // Forest Bit theme: nature-themed rare effects.
        this.forestbitRareEffects = ["leafScatter", "butterflyFly", "owlBlink"];
        this.forestbitSuperRareEffects     = ["fireflyBurst"];   // night epic
        this.forestbitDaySuperRareEffects  = ["giantTreeGrow"];  // day epic

        // Roll rates
        this.epicChance = 0.05; // Plus-only: super rare
        this.rareChanceArcade = 0.18;
        this.rareChanceSynthwave = 0.22;
        this.rareChanceForestbit = 0.20;

        this.rainbowSmashChance = this.epicChance;
        this.userPlan = 'free';
        this.effectLock = false;
        this.audioContext = null;
        this.audioContextReady = false;
        try {
            const stored = localStorage.getItem("pixdone-sound-enabled");
            this.soundEnabled = stored === null ? true : stored === "true";
        } catch (e) {
            this.soundEnabled = true;
        }
        this.initAudioContext();
        this.setupStyles();
        this.isWorldShutdownPlaying = false;
        this._worldShutdownOverlay = null;
        this._worldShutdownScanline = null;
        this._worldShutdownText = null;
        this._worldShutdownNoise = null;
    }

    setUserPlan(plan) {
        this.userPlan = plan;
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = !!enabled;
        try {
            localStorage.setItem("pixdone-sound-enabled", String(this.soundEnabled));
        } catch (e) {}
    }

    getSoundEnabled() {
        return this.soundEnabled;
    }

    initAudioContext() {
        try {
            if (
                typeof AudioContext !== "undefined" ||
                typeof webkitAudioContext !== "undefined"
            ) {
                const AudioContext =
                    window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                this.audioContextReady = true;

                // Handle mobile audio context suspension
                if (this.audioContext.state === "suspended") {
                    const resume = () => {
                        this.audioContext.resume();
                        document.removeEventListener("touchstart", resume);
                        document.removeEventListener("click", resume);
                    };
                    document.addEventListener("touchstart", resume);
                    document.addEventListener("click", resume);
                }
            }
        } catch (error) {
            console.warn("Audio context initialization failed:", error);
            this.audioContextReady = false;
        }
    }

    setupStyles() {
        const style = document.createElement("style");
        style.textContent = `
            .comic-effect {
                position: absolute;
                pointer-events: none;
                z-index: 1000;
                font-family: 'Comic Sans MS', cursive, sans-serif;
                font-weight: bold;
                animation-fill-mode: both;
            }
            
            .explode-effect {
                animation: explodeCard 1.5s ease-out forwards;
            }
            
            @keyframes explodeCard {
                0% { transform: scale(1); opacity: 1; }
                20% { transform: scale(1.1); opacity: 1; }
                40% { transform: scale(1.3) rotate(5deg); opacity: 0.9; }
                60% { transform: scale(1.8) rotate(15deg); opacity: 0.7; }
                80% { transform: scale(2.5) rotate(30deg); opacity: 0.3; }
                100% { transform: scale(4) rotate(45deg); opacity: 0; }
            }
            
            .fly-away-effect {
                animation: flyAwayCard 1.8s ease-out forwards;
            }
            
            @keyframes flyAwayCard {
                0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
                20% { transform: translateY(-20px) rotate(-5deg) scale(1.05); opacity: 1; }
                40% { transform: translateY(-60px) rotate(-15deg) scale(1.1); opacity: 0.9; }
                60% { transform: translateY(-120px) rotate(-30deg) scale(1.2); opacity: 0.7; }
                80% { transform: translateY(-200px) rotate(-45deg) scale(1.3); opacity: 0.4; }
                100% { transform: translateY(-400px) rotate(-90deg) scale(1.5); opacity: 0; }
            }
            
            .crumple-throw-effect {
                animation: crumpleThrowCard 2s ease-out forwards;
            }
            
            @keyframes crumpleThrowCard {
                0% { transform: scale(1) rotate(0deg); opacity: 1; border-radius: 4px; }
                20% { transform: scale(0.9) rotate(5deg); opacity: 1; border-radius: 8px; }
                40% { transform: scale(0.7) rotate(15deg); opacity: 0.9; border-radius: 12px; }
                60% { transform: scale(0.5) rotate(45deg); opacity: 0.8; border-radius: 20px; }
                80% { transform: scale(0.3) rotate(180deg) translateY(-30px); opacity: 0.6; border-radius: 50%; }
                100% { transform: scale(0.1) rotate(360deg) translateY(-100px) translateX(50px); opacity: 0; border-radius: 50%; }
            }
            
            .shatter-effect {
                animation: shatterCard 1.2s ease-out forwards;
            }
            
            @keyframes shatterCard {
                0% { transform: scale(1); opacity: 1; filter: blur(0px); }
                20% { transform: scale(1.02); opacity: 1; filter: blur(0px); }
                40% { transform: scale(1.05); opacity: 0.9; filter: blur(1px); }
                60% { transform: scale(1.1); opacity: 0.7; filter: blur(2px); }
                80% { transform: scale(1.2); opacity: 0.4; filter: blur(4px); }
                100% { transform: scale(1.5); opacity: 0; filter: blur(8px); }
            }
            
            .vanish-effect {
                animation: vanishCard 1s ease-out forwards;
            }
            
            @keyframes vanishCard {
                0% { transform: scale(1); opacity: 1; filter: brightness(1); }
                30% { transform: scale(1.05); opacity: 1; filter: brightness(1.2); }
                60% { transform: scale(1.1); opacity: 0.7; filter: brightness(1.5); }
                80% { transform: scale(1.2); opacity: 0.3; filter: brightness(2); }
                100% { transform: scale(1.5); opacity: 0; filter: brightness(3); }
            }
            
            .spin-off-effect {
                animation: spinOffCard 1.5s ease-out forwards;
            }
            
            @keyframes spinOffCard {
                0% { transform: rotate(0deg) scale(1); opacity: 1; }
                20% { transform: rotate(90deg) scale(1.1); opacity: 1; }
                40% { transform: rotate(270deg) scale(1.2); opacity: 0.9; }
                60% { transform: rotate(540deg) scale(1.4); opacity: 0.7; }
                80% { transform: rotate(900deg) scale(1.6); opacity: 0.4; }
                100% { transform: rotate(1440deg) scale(2); opacity: 0; }
            }
            
            .melt-effect {
                animation: meltCard 1.8s ease-out forwards;
            }
            
            @keyframes meltCard {
                0% { transform: scaleY(1) scaleX(1); opacity: 1; }
                20% { transform: scaleY(0.9) scaleX(1.1); opacity: 1; }
                40% { transform: scaleY(0.7) scaleX(1.3); opacity: 0.9; }
                60% { transform: scaleY(0.4) scaleX(1.6); opacity: 0.7; }
                80% { transform: scaleY(0.2) scaleX(1.9); opacity: 0.4; }
                100% { transform: scaleY(0) scaleX(2.5); opacity: 0; }
            }
            
            .tornado-effect {
                animation: tornadoCard 2s ease-out forwards;
            }
            
            @keyframes tornadoCard {
                0% { transform: rotate(0deg) scale(1); opacity: 1; filter: blur(0px); }
                20% { transform: rotate(180deg) scale(1.1); opacity: 1; filter: blur(0px); }
                40% { transform: rotate(540deg) scale(1.3); opacity: 0.9; filter: blur(1px); }
                60% { transform: rotate(900deg) scale(1.6); opacity: 0.7; filter: blur(2px); }
                80% { transform: rotate(1440deg) scale(2); opacity: 0.4; filter: blur(4px); }
                100% { transform: rotate(2160deg) scale(3); opacity: 0; filter: blur(8px); }
            }
            
            .explosion-particles {
                position: fixed;
                width: 4px;
                height: 4px;
                background: #ff6b6b;
                animation: particleExplosion 1.5s ease-out forwards;
            }
            
            @keyframes particleExplosion {
                0% { transform: scale(0); opacity: 1; }
                20% { transform: scale(1); opacity: 1; }
                100% { transform: scale(0) translate(var(--dx), var(--dy)); opacity: 0; }
            }
            
            .task-completing {
                animation: taskComplete 0.6s ease;
            }
            
            @keyframes taskComplete {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
            }
            
            .task-checkbox-completing {
                animation: checkboxComplete 0.6s ease;
            }
            
            @keyframes checkboxComplete {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .task-item-new {
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes comboFlash {
                0% { transform: translateX(-50%) scale(0); opacity: 0; }
                20% { transform: translateX(-50%) scale(1.3); opacity: 1; }
                40% { transform: translateX(-50%) scale(1); opacity: 1; }
                60% { transform: translateX(-50%) scale(1.1); opacity: 1; }
                80% { transform: translateX(-50%) scale(1); opacity: 1; }
                100% { transform: translateX(-50%) scale(0.9); opacity: 0; }
            }
            
            @keyframes screenFlash {
                0% { filter: brightness(1); }
                50% { filter: brightness(1.5) contrast(1.2); }
                100% { filter: brightness(1); }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                20%, 40%, 60%, 80% { transform: translateX(2px); }
            }
            
            .bounce-effect {
                animation: bounceCard 1.2s ease-out forwards;
            }
            
            @keyframes bounceCard {
                0% { transform: scale(1) translateY(0); opacity: 1; }
                20% { transform: scale(1.1) translateY(-30px); opacity: 1; }
                40% { transform: scale(1.2) translateY(-60px); opacity: 0.9; }
                60% { transform: scale(1.3) translateY(-90px); opacity: 0.7; }
                80% { transform: scale(1.4) translateY(-120px); opacity: 0.4; }
                100% { transform: scale(1.5) translateY(-200px); opacity: 0; }
            }
            
            .slide-left-effect {
                animation: slideLeftCard 1.3s ease-out forwards;
            }
            
            @keyframes slideLeftCard {
                0% { transform: translateX(0) scale(1); opacity: 1; }
                20% { transform: translateX(-50px) scale(1.05); opacity: 1; }
                40% { transform: translateX(-120px) scale(1.1); opacity: 0.9; }
                60% { transform: translateX(-200px) scale(1.2); opacity: 0.7; }
                80% { transform: translateX(-300px) scale(1.3); opacity: 0.4; }
                100% { transform: translateX(-500px) scale(1.5); opacity: 0; }
            }
            
            .slide-right-effect {
                animation: slideRightCard 1.3s ease-out forwards;
            }
            
            @keyframes slideRightCard {
                0% { transform: translateX(0) scale(1); opacity: 1; }
                20% { transform: translateX(50px) scale(1.05); opacity: 1; }
                40% { transform: translateX(120px) scale(1.1); opacity: 0.9; }
                60% { transform: translateX(200px) scale(1.2); opacity: 0.7; }
                80% { transform: translateX(300px) scale(1.3); opacity: 0.4; }
                100% { transform: translateX(500px) scale(1.5); opacity: 0; }
            }
            
            .flip-effect {
                animation: flipCard 1.4s ease-out forwards;
            }
            
            @keyframes flipCard {
                0% { transform: rotateY(0deg) scale(1); opacity: 1; }
                20% { transform: rotateY(90deg) scale(1.1); opacity: 1; }
                40% { transform: rotateY(180deg) scale(1.2); opacity: 0.9; }
                60% { transform: rotateY(270deg) scale(1.3); opacity: 0.7; }
                80% { transform: rotateY(360deg) scale(1.4); opacity: 0.4; }
                100% { transform: rotateY(450deg) scale(1.5); opacity: 0; }
            }
            
            .shrink-effect {
                animation: shrinkCard 1.0s ease-out forwards;
            }
            
            @keyframes shrinkCard {
                0% { transform: scale(1); opacity: 1; }
                20% { transform: scale(0.8); opacity: 1; }
                40% { transform: scale(0.6); opacity: 0.9; }
                60% { transform: scale(0.4); opacity: 0.7; }
                80% { transform: scale(0.2); opacity: 0.4; }
                100% { transform: scale(0); opacity: 0; }
            }
            
            .stretch-effect {
                animation: stretchCard 1.1s ease-out forwards;
            }
            
            @keyframes stretchCard {
                0% { transform: scaleX(1) scaleY(1); opacity: 1; }
                20% { transform: scaleX(1.3) scaleY(0.7); opacity: 1; }
                40% { transform: scaleX(1.6) scaleY(0.4); opacity: 0.9; }
                60% { transform: scaleX(2.0) scaleY(0.2); opacity: 0.7; }
                80% { transform: scaleX(2.5) scaleY(0.1); opacity: 0.4; }
                100% { transform: scaleX(3.0) scaleY(0); opacity: 0; }
            }
            
            .wobble-effect {
                animation: wobbleCard 1.5s ease-out forwards;
            }
            
            @keyframes wobbleCard {
                0% { transform: rotate(0deg) scale(1); opacity: 1; }
                10% { transform: rotate(-10deg) scale(1.05); opacity: 1; }
                20% { transform: rotate(10deg) scale(1.1); opacity: 1; }
                30% { transform: rotate(-15deg) scale(1.15); opacity: 0.9; }
                40% { transform: rotate(15deg) scale(1.2); opacity: 0.9; }
                50% { transform: rotate(-20deg) scale(1.25); opacity: 0.8; }
                60% { transform: rotate(20deg) scale(1.3); opacity: 0.7; }
                70% { transform: rotate(-25deg) scale(1.35); opacity: 0.6; }
                80% { transform: rotate(25deg) scale(1.4); opacity: 0.4; }
                90% { transform: rotate(-30deg) scale(1.45); opacity: 0.2; }
                100% { transform: rotate(30deg) scale(1.5); opacity: 0; }
            }
            
            .fade-out-effect {
                animation: fadeOutCard 1.2s ease-out forwards;
            }
            
            @keyframes fadeOutCard {
                0% { opacity: 1; transform: scale(1); }
                20% { opacity: 0.8; transform: scale(1.02); }
                40% { opacity: 0.6; transform: scale(1.04); }
                60% { opacity: 0.4; transform: scale(1.06); }
                80% { opacity: 0.2; transform: scale(1.08); }
                100% { opacity: 0; transform: scale(1.1); }
            }
            
            .rainbow-smash-effect {
                animation: rainbowSmashCard 1.5s ease-out forwards;
            }
            
            @keyframes rainbowSmashCard {
                0% { 
                    transform: scale(1); 
                    opacity: 1; 
                    filter: hue-rotate(0deg) brightness(1) saturate(1);
                }
                10% { 
                    transform: scale(1.05); 
                    opacity: 1; 
                    filter: hue-rotate(60deg) brightness(1.2) saturate(1.5);
                }
                20% { 
                    transform: scale(1.1); 
                    opacity: 1; 
                    filter: hue-rotate(120deg) brightness(1.4) saturate(2);
                }
                30% { 
                    transform: scale(1.15); 
                    opacity: 0.95; 
                    filter: hue-rotate(180deg) brightness(1.6) saturate(2.5);
                }
                40% { 
                    transform: scale(1.2); 
                    opacity: 0.9; 
                    filter: hue-rotate(240deg) brightness(1.8) saturate(3);
                }
                50% { 
                    transform: scale(1.25); 
                    opacity: 0.85; 
                    filter: hue-rotate(300deg) brightness(2) saturate(3.5);
                }
                60% { 
                    transform: scale(1.3); 
                    opacity: 0.8; 
                    filter: hue-rotate(360deg) brightness(1.8) saturate(3);
                }
                70% { 
                    transform: scale(1.35); 
                    opacity: 0.7; 
                    filter: hue-rotate(420deg) brightness(1.6) saturate(2.5);
                }
                80% { 
                    transform: scale(1.4); 
                    opacity: 0.5; 
                    filter: hue-rotate(480deg) brightness(1.4) saturate(2);
                }
                90% { 
                    transform: scale(1.45); 
                    opacity: 0.3; 
                    filter: hue-rotate(540deg) brightness(1.2) saturate(1.5);
                }
                100% { 
                    transform: scale(1.5); 
                    opacity: 0; 
                    filter: hue-rotate(600deg) brightness(1) saturate(1);
                }
            }
            
            @keyframes rainbowTextGradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            /* ── Forest Bit effects ── */

            .leaf-scatter-effect {
                animation: leafScatterCard 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }

            @keyframes leafScatterCard {
                0%   { transform: translateY(0) rotate(0deg);    opacity: 1; }
                35%  { transform: translateY(-10px) rotate(-6deg); opacity: 0.9; }
                100% { transform: translateY(10px) rotate(5deg);  opacity: 0; }
            }

            @keyframes leafFloat {
                0%   { transform: translate(var(--lx, 0px), 0px) rotate(var(--lr, 0deg)); opacity: 1; }
                55%  { opacity: 0.85; }
                100% { transform: translate(var(--lx, 0px), var(--ly, 80px)) rotate(calc(var(--lr, 0deg) + 200deg)); opacity: 0; }
            }

            @keyframes butterflyFly {
                0%   { transform: translate(0, 0); opacity: 1; }
                20%  { transform: translate(calc(var(--bx) * 0.25), calc(var(--by) * 0.25 - 14px)); opacity: 1; }
                55%  { transform: translate(calc(var(--bx) * 0.65), calc(var(--by) * 0.6 - 6px));  opacity: 0.9; }
                85%  { transform: translate(calc(var(--bx) * 0.9),  calc(var(--by) * 0.9));        opacity: 0.5; }
                100% { transform: translate(var(--bx), var(--by));                                 opacity: 0; }
            }

            @keyframes wingFlap {
                0%, 100% { transform: scaleX(1); }
                50%       { transform: scaleX(0.12); }
            }

            @keyframes owlEyeIn {
                0%   { opacity: 0; transform: scaleY(0); }
                100% { opacity: 1; transform: scaleY(1); }
            }

            @keyframes owlLidClose {
                0%   { transform: scaleY(0); }
                100% { transform: scaleY(1); }
            }

            @keyframes owlLidOpen {
                0%   { transform: scaleY(1); }
                100% { transform: scaleY(0); }
            }

            @keyframes owlShift {
                0%   { transform: translateX(0px); }
                50%  { transform: translateX(-6px); }
                100% { transform: translateX(6px); }
            }

            @keyframes fireflyFloat {
                0%   { transform: translate(0, 0) scale(1);       opacity: 0.85; }
                35%  { transform: translate(calc(var(--fx, 20px) * 0.5), calc(var(--fy, -40px) * 0.4)) scale(1.3); opacity: 1; }
                70%  { transform: translate(calc(var(--fx, 20px) * 0.9), calc(var(--fy, -40px) * 0.85)) scale(0.9); opacity: 0.6; }
                100% { transform: translate(var(--fx, 20px), var(--fy, -60px)) scale(0.2); opacity: 0; }
            }

            /* ── Synthwave effects ── */

            .glitch-slide-effect {
                animation: glitchSlideCard 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }

            @keyframes glitchSlideCard {
                0%  { transform: translateX(0);     opacity: 1; }
                15% { transform: translateX(6px);   opacity: 1; }
                30% { transform: translateX(-10px); opacity: 0.9; }
                50% { transform: translateX(-50px); opacity: 0.7; }
                75% { transform: translateX(-120px); opacity: 0.3; }
                100%{ transform: translateX(-250%); opacity: 0; }
            }

            .neon-warp-effect {
                animation: neonWarpCard 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                transform-origin: center left;
            }

            @keyframes neonWarpCard {
                0%  { transform: scaleX(1);  opacity: 1;   filter: blur(0px) brightness(1); }
                25% { transform: scaleX(1.5); opacity: 1;  filter: blur(0px) brightness(1.5); }
                55% { transform: scaleX(4);  opacity: 0.7; filter: blur(1px) brightness(2); }
                80% { transform: scaleX(8);  opacity: 0.3; filter: blur(2px) brightness(3); }
                100%{ transform: scaleX(14); opacity: 0;   filter: blur(4px) brightness(4); }
            }

            .neon-big-bang-effect {
                animation: neonBigBangCard 0.5s ease-out forwards;
            }

            @keyframes neonBigBangCard {
                0%  { transform: scale(1);    opacity: 1; filter: brightness(1); }
                25% { transform: scale(1.1);  opacity: 1; filter: brightness(2.5); }
                60% { transform: scale(1.6);  opacity: 0.5; filter: brightness(4); }
                100%{ transform: scale(2.8);  opacity: 0;   filter: brightness(1); }
            }

            @keyframes neonRayExpand {
                0%  { transform-origin: 0 50%; transform: scaleX(0) rotate(var(--ray-angle, 0rad)); opacity: 1; }
                70% { opacity: 0.9; }
                100%{ transform-origin: 0 50%; transform: scaleX(1) rotate(var(--ray-angle, 0rad)); opacity: 0; }
            }

            @keyframes neonBigBangFlash {
                0%   { opacity: 0; }
                25%  { opacity: 0.85; }
                100% { opacity: 0; }
            }
            
            #world-shutdown-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                opacity: 0;
                pointer-events: none;
                z-index: 9998;
                transition: opacity 0.14s ease;
            }
            
            #world-shutdown-scanline {
                position: fixed;
                left: 0;
                width: 100%;
                height: 4px;
                pointer-events: none;
                z-index: 9999;
                opacity: 0;
                background: linear-gradient(
                    to bottom,
                    transparent 0%,
                    rgba(255,255,255,0.4) 20%,
                    rgba(255,255,255,0.6) 50%,
                    rgba(255,255,255,0.4) 80%,
                    transparent 100%
                );
                box-shadow: 0 0 12px rgba(255,255,255,0.5);
                transform: translateY(-50%);
                will-change: top, opacity;
            }
            
            #world-shutdown-scanline.scanline-animate {
                animation: worldShutdownScanline 0.14s ease-out forwards;
            }
            
            @keyframes worldShutdownScanline {
                0% { top: 20%; opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { top: 80%; opacity: 0; }
            }
            
            #world-shutdown-text {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: rgba(255,255,255,0.9);
                font-family: 'VT323', 'Courier New', monospace;
                font-size: 1.5rem;
                letter-spacing: 0.12em;
                line-height: 1.8;
                pointer-events: none;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
            }
            
            #world-shutdown-text .line1,
            #world-shutdown-text .line2 {
                opacity: 0;
            }
            
            #world-shutdown-noise {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9998;
                opacity: 0;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' fill='%23fff' fill-opacity='0.15'/%3E%3C/svg%3E");
                background-repeat: repeat;
                background-size: 200px 200px;
            }
            
            /* Freeze epic: completed task card gets frozen look */
            .task-item.freeze-task-frozen {
                position: relative;
                border-color: #00e8ff !important;
                box-shadow: 0 0 0 2px rgba(0, 232, 255, 0.5), 2px 2px 0px var(--shadow-color) !important;
                transition: border-color 0.12s steps(2), box-shadow 0.12s steps(2);
            }
            .task-item.freeze-task-frozen::after {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                border-radius: inherit;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect fill='%2300e8ff' opacity='0.08' width='16' height='16'/%3E%3Crect x='0' y='0' width='4' height='4' fill='%23fff' opacity='0.12'/%3E%3Crect x='8' y='8' width='4' height='4' fill='%23fff' opacity='0.12'/%3E%3C/svg%3E");
                background-repeat: repeat;
                image-rendering: pixelated;
            }
            
            /* Freeze: task list area shakes; allow scroll so long lists don't get cut off */
            .content-below-tabs.freeze-list-shake {
                animation: freeze-list-shake 0.1s steps(2) infinite;
            }
            @keyframes freeze-list-shake {
                0%, 100% { transform: translate(0, 0); }
                33% { transform: translate(1px, -1px); }
                66% { transform: translate(-1px, 1px); }
            }
            @media (prefers-reduced-motion: reduce) {
                .content-below-tabs.freeze-list-shake { animation: none; }
            }

            /* ── Forest Bit: Giant Tree Push ── */
            .tree-push-squish {
                animation: treePushSquish 0.08s steps(3) forwards;
            }
            @keyframes treePushSquish {
                0%   { transform: scaleY(1)    scaleX(1); }
                100% { transform: scaleY(0.72) scaleX(1.14); }
            }

            .tree-push-launch {
                animation: treePushLaunch 0.32s steps(9) forwards;
            }
            @keyframes treePushLaunch {
                0%   { transform: scaleY(0.72) scaleX(1.14) translateY(0)    rotate(0deg);   opacity: 1; }
                30%  { transform: scaleY(1)    scaleX(1)    translateY(-18%)  rotate(-3deg);  opacity: 1; }
                60%  { transform: scaleY(1)    scaleX(1)    translateY(-55%)  rotate(-6deg);  opacity: 0.7; }
                100% { transform: scaleY(1)    scaleX(1)    translateY(-120%) rotate(-10deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    /** Read the active visual theme key from the DOM (set by ThemeProvider). */
    getVisualTheme() {
        try {
            const attr = document.documentElement.getAttribute("data-visual-theme");
            if (attr) return attr;
            return localStorage.getItem("pd-visual-theme") || "arcade";
        } catch (_) {
            return "arcade";
        }
    }

    // Play random effect on task completion (effectRect = optional viewport rect when clone not laid out)
    playRandomEffect(taskElement, effectRect) {
        if (this.effectLock) return;
        const random = Math.random();
        let selectedEffect;
        const params = typeof window !== "undefined" && window.location ? new URLSearchParams(window.location.search) : null;
        const forceFreeze = params && params.get("effect") === "freeze";
        const forceRainbow = params && params.get("effect") === "rainbow";
        const forceNeonBigBang = params && params.get("effect") === "neonBigBang";
        const forceGiantTree = params && params.get("effect") === "giantTreeGrow";

        const visualTheme = this.getVisualTheme();
        const isSynthwave = visualTheme === "synthwave";
        const isForestbit = visualTheme === "forestbit";
        const isPlusUser = this.userPlan === 'plus';
        const isNightMode = document.documentElement.getAttribute("data-theme") === "dark";
        const superRarePool = isPlusUser
            ? (isSynthwave ? this.synthwaveSuperRareEffects
               : isForestbit ? (isNightMode ? this.forestbitSuperRareEffects : this.forestbitDaySuperRareEffects)
               : this.superRareEffects)
            : [];
        const epicChance = superRarePool.length > 0 ? this.epicChance : 0;
        const rareChance = isSynthwave ? this.rareChanceSynthwave
            : isForestbit ? this.rareChanceForestbit
            : this.rareChanceArcade;
        const rarePool = isSynthwave ? this.synthwaveRareEffects
            : isForestbit ? this.forestbitRareEffects
            : this.arcadeRareEffects;
        const commonPool = this.commonEffects;

        if (forceFreeze) {
            console.log("❄️ Epic Freeze effect (forced by ?effect=freeze)");
            selectedEffect = "freeze";
        } else if (forceRainbow) {
            console.log("🌈 Rainbow Smash (forced by ?effect=rainbow)");
            selectedEffect = "rainbowSmash";
        } else if (forceNeonBigBang) {
            console.log("💥 Neon Big Bang (forced by ?effect=neonBigBang)");
            selectedEffect = "neonBigBang";
        } else if (forceGiantTree) {
            console.log("🌲 Giant Tree Grow (forced by ?effect=giantTreeGrow)");
            selectedEffect = "giantTreeGrow";
        } else if (random < epicChance) {
            selectedEffect = superRarePool[Math.floor(Math.random() * superRarePool.length)];
            console.log(`✨ Super rare effect triggered! [${visualTheme}]:`, selectedEffect);
        } else if (rarePool.length > 0 && random < epicChance + rareChance) {
            selectedEffect = rarePool[Math.floor(Math.random() * rarePool.length)];
            console.log(`⭐ Rare effect triggered! [${visualTheme}]:`, selectedEffect);
        } else {
            selectedEffect = commonPool[Math.floor(Math.random() * commonPool.length)];
        }

        console.log(
            "Playing random effect:",
            selectedEffect,
            "on element:",
            taskElement,
        );

        // Clear any existing effect text to prevent overlapping
        this.clearExistingEffectText();

        // コンボ効果の処理
        const currentTime = Date.now();
        if (!this.comboCount) this.comboCount = 0;
        if (!this.lastEffectTime) this.lastEffectTime = 0;

        const timeSinceLastEffect = currentTime - this.lastEffectTime;

        if (timeSinceLastEffect < 3000) {
            // 3秒以内なら連続コンボ
            this.comboCount++;
            this.showComboEffect(this.comboCount);
        } else {
            this.comboCount = 1;
        }

        this.lastEffectTime = currentTime;

        // コンボタイムアウトリセット
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }

        // 5コンボ以上: 余計なUI要素を薄くしてエフェクトに集中させる
        if (this.comboCount >= 5) {
            const smashContainer = document.querySelector('.pd-app-container') || document.querySelector('.app-container');
            if (smashContainer) {
                smashContainer.classList.add('smash-combo-active');
            }
            document.body.classList.add('smash-combo-active');
        }

        this.comboTimeout = setTimeout(() => {
            this.comboCount = 0;
            const smashContainer = document.querySelector('.pd-app-container') || document.querySelector('.app-container');
            if (smashContainer) {
                smashContainer.classList.remove('smash-combo-active');
            }
            document.body.classList.remove('smash-combo-active');
        }, 3000);

        this.playEffect(selectedEffect, taskElement, effectRect);
    }

    // Clear existing effect text to prevent overlapping
    clearExistingEffectText() {
        const existingEffectTexts = document.querySelectorAll(".effect-text");
        existingEffectTexts.forEach((text) => {
            text.remove();
        });
    }

    showComboEffect(comboCount) {
        if (comboCount < 2) return;

        const comboText = document.createElement("div");

        // 特別なコンボメッセージ
        if (comboCount >= 10) {
            comboText.innerHTML = `LEGENDARY x${comboCount}!`;
        } else if (comboCount >= 5) {
            comboText.innerHTML = `AMAZING x${comboCount}!`;
        } else {
            comboText.innerHTML = `COMBO x${comboCount}!`;
        }

        comboText.style.position = "fixed";
        comboText.style.top = "20px";
        comboText.style.left = "50%";
        comboText.style.transform = "translateX(-50%)";
        comboText.style.fontSize =
            comboCount >= 10 ? "36px" : comboCount >= 5 ? "32px" : "28px";
        comboText.style.fontWeight = "bold";
        comboText.style.color =
            comboCount >= 10
                ? "#ff4444"
                : comboCount >= 5
                    ? "#ff6b6b"
                    : "#ff6b6b";
        comboText.style.textShadow = "3px 3px 0px #000, -3px -3px 0px #fff";
        comboText.style.fontFamily = "VT323, monospace";
        comboText.style.zIndex = "99999";
        comboText.style.pointerEvents = "none";
        comboText.style.animation = "comboFlash 0.8s steps(8, end)";
        comboText.style.imageRendering = "pixelated";
        comboText.style.filter =
            "drop-shadow(0 0 10px rgba(255, 107, 107, 0.8))";

        document.body.appendChild(comboText);

        // コンボ音効果
        this.playComboSound(comboCount);

        // 強力なバイブレーション
        if (comboCount >= 3) {
            this.playHapticFeedback("strong");
        }

        // 画面エフェクト
        if (comboCount >= 10) {
            // 10コンボ以上：メガエフェクト
            this.createMegaComboEffect();
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                appContainer.style.animation = "screenFlash 0.3s ease-out";
                setTimeout(() => {
                    appContainer.style.animation = "";
                }, 300);
            }
        } else if (comboCount >= 5) {
            // 5コンボ以上：スーパーエフェクト
            this.createSuperComboEffect();
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                appContainer.style.animation = "screenFlash 0.3s ease-out";
                setTimeout(() => {
                    appContainer.style.animation = "";
                }, 300);
            }
        }

        setTimeout(() => {
            comboText.remove();
        }, 1000);
    }

    playComboSound(comboCount) {
        // Use shared audioContext so mobile browsers treat combo sounds
        // the same as other effect sounds (one context, resumed on gesture).
        if (this.soundEnabled === false) return;
        try {
            if (!this.audioContextReady || !this.audioContext) {
                console.warn("Combo audio: audio context not ready");
                return;
            }

            const audioContext = this.audioContext;

            // Resume if suspended (common on mobile)
            if (audioContext.state === "suspended") {
                audioContext.resume();
            }

            if (comboCount >= 10) {
                // 10コンボ以上：豪華なファンファーレ
                this.playLegendaryComboSound(audioContext);
            } else if (comboCount >= 5) {
                // 5コンボ以上：スーパーコンボサウンド
                this.playSuperComboSound(audioContext);
            } else {
                // 通常のコンボサウンド
                this.playNormalComboSound(audioContext, comboCount);
            }
        } catch (error) {
            console.log("Combo audio not supported:", error);
        }
    }

    playNormalComboSound(audioContext, comboCount) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // コンボ数に応じて音程を上げる
        const baseFreq = 523 + comboCount * 100; // C5からスタート
        oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(
            baseFreq * 1.5,
            audioContext.currentTime + 0.2,
        );

        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.5,
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    playSuperComboSound(audioContext) {
        // C-E-G-C アルペジオ
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = "square";

            const startTime = audioContext.currentTime + index * 0.1;
            const endTime = startTime + 0.3;

            gainNode.gain.setValueAtTime(0.15, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

            oscillator.start(startTime);
            oscillator.stop(endTime);
        });
    }

    playLegendaryComboSound(audioContext) {
        // レジェンダリーファンファーレ
        const melody = [
            { freq: 523, time: 0 }, // C5
            { freq: 659, time: 0.15 }, // E5
            { freq: 784, time: 0.3 }, // G5
            { freq: 1047, time: 0.45 }, // C6
            { freq: 1319, time: 0.6 }, // E6
            { freq: 1568, time: 0.75 }, // G6
            { freq: 2093, time: 0.9 }, // C7
        ];

        melody.forEach((note) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(
                note.freq,
                audioContext.currentTime,
            );
            oscillator.type = "triangle";

            const startTime = audioContext.currentTime + note.time;
            const endTime = startTime + 0.4;

            gainNode.gain.setValueAtTime(0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

            oscillator.start(startTime);
            oscillator.stop(endTime);
        });

        // 追加のハーモニー
        setTimeout(() => {
            const harmonyOsc = audioContext.createOscillator();
            const harmonyGain = audioContext.createGain();

            harmonyOsc.connect(harmonyGain);
            harmonyGain.connect(audioContext.destination);

            harmonyOsc.frequency.setValueAtTime(1047, audioContext.currentTime); // C6
            harmonyOsc.type = "sine";

            harmonyGain.gain.setValueAtTime(0.1, audioContext.currentTime);
            harmonyGain.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 1.0,
            );

            harmonyOsc.start(audioContext.currentTime);
            harmonyOsc.stop(audioContext.currentTime + 1.0);
        }, 100);
    }

    playEffect(effectType, taskElement, effectRect) {
        if (!taskElement) {
            console.warn("No taskElement provided to playEffect");
            return;
        }

        const rect = effectRect && effectRect.width > 0 && effectRect.height > 0
            ? effectRect
            : taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn("Task element has no dimensions");
            return;
        }

        switch (effectType) {
            case "explode":
                this.createExplodeEffect(taskElement, rect);
                this.playSound("explosion");
                this.playHapticFeedback("strong");
                break;
            case "flyAway":
                this.createFlyAwayEffect(taskElement, rect);
                this.playSound("whoosh");
                this.playHapticFeedback("medium");
                break;
            case "crumpleThrow":
                this.createCrumpleThrowEffect(taskElement, rect);
                this.playSound("crumple");
                this.playHapticFeedback("medium");
                break;
            case "shatter":
                this.createShatterEffect(taskElement, rect);
                this.playSound("shatter");
                this.playHapticFeedback("strong");
                break;
            case "vanish":
                this.createVanishEffect(taskElement, rect);
                this.playSound("vanish");
                this.playHapticFeedback("light");
                break;
            case "spinOff":
                this.createSpinOffEffect(taskElement, rect);
                this.playSound("spin");
                this.playHapticFeedback("medium");
                break;
            case "melt":
                this.createMeltEffect(taskElement, rect);
                this.playSound("melt");
                this.playHapticFeedback("light");
                break;
            case "tornado":
                this.createTornadoEffect(taskElement, rect);
                this.playSound("tornado");
                this.playHapticFeedback("strong");
                break;
            case "bounce":
                this.createBounceEffect(taskElement, rect);
                this.playSound("bounce");
                this.playHapticFeedback("medium");
                break;
            case "slideLeft":
                this.createSlideLeftEffect(taskElement, rect);
                this.playSound("slide");
                this.playHapticFeedback("light");
                break;
            case "slideRight":
                this.createSlideRightEffect(taskElement, rect);
                this.playSound("slide");
                this.playHapticFeedback("light");
                break;
            case "flip":
                this.createFlipEffect(taskElement, rect);
                this.playSound("flip");
                this.playHapticFeedback("medium");
                break;
            case "shrink":
                this.createShrinkEffect(taskElement, rect);
                this.playSound("shrink");
                this.playHapticFeedback("light");
                break;
            case "stretch":
                this.createStretchEffect(taskElement, rect);
                this.playSound("stretch");
                this.playHapticFeedback("medium");
                break;
            case "wobble":
                this.createWobbleEffect(taskElement, rect);
                this.playSound("wobble");
                this.playHapticFeedback("medium");
                break;
            case "fadeOut":
                this.createFadeOutEffect(taskElement, rect);
                this.playSound("fadeOut");
                this.playHapticFeedback("light");
                break;
            case "rainbowSmash":
                this.effectLock = true;
                this.createRainbowSmashEffect(taskElement, rect);
                this.playRainbowSmashSound();
                this.playHapticFeedback("strong");
                break;
            case "freeze":
                this.effectLock = true;
                this.playFreezeSound();
                this.createFreezeEffect(taskElement, rect);
                this.playHapticFeedback("strong");
                break;
            case "glitchSlide":
                this.createGlitchSlideEffect(taskElement, rect);
                this.playGlitchSlideSound();
                this.playHapticFeedback("medium");
                break;
            case "neonWarp":
                this.createNeonWarpEffect(taskElement, rect);
                this.playNeonWarpSound();
                this.playHapticFeedback("medium");
                break;
            case "neonBigBang":
                this.effectLock = true;
                this.createNeonBigBangEffect(taskElement, rect);
                this.playNeonBigBangSound();
                this.playHapticFeedback("strong");
                break;
            case "leafScatter":
                this.createLeafScatterEffect(taskElement, rect);
                this.playLeafScatterSound();
                this.playHapticFeedback("light");
                break;
            case "fireflyBurst":
                this.effectLock = true;
                this.createFireflyBurstEffect(taskElement, rect);
                this.playFireflyBurstSound();
                this.playHapticFeedback("medium");
                break;
            case "butterflyFly":
                this.createButterflyFlyEffect(taskElement, rect);
                this.playButterflyFlySound();
                this.playHapticFeedback("light");
                break;
            case "owlBlink": {
                const _owlIsNight = document.documentElement.getAttribute("data-theme") === "dark";
                this.effectLock = true;
                this.createOwlBlinkEffect(taskElement, rect);
                if (_owlIsNight) this.playOwlBlinkSound();
                this.playHapticFeedback("light");
                break;
            }
            case "giantTreeGrow":
                this.effectLock = true;
                this.createGiantTreeGrowEffect(taskElement, rect);
                this.playGiantTreeGrowSound();
                this.playHapticFeedback("strong");
                break;
        }
    }

    /** Dev: trigger freeze effect (e.g. console: window.comicEffects.testFreeze() or testFreeze()) */
    testFreeze() {
        if (this.effectLock) {
            console.warn("Freeze test skipped: effect lock active");
            return;
        }
        const el = document.querySelector(".task-item") || document.body;
        this.playEffect("freeze", el);
    }

    createExplodeEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn("Task element has no dimensions");
            return;
        }

        // Create "BAM!" text overlay with 8bit style
        const bamText = document.createElement("div");
        bamText.innerHTML = "BAM!";
        bamText.className = "effect-text";
        bamText.style.position = "fixed";
        bamText.style.fontSize = "24px";
        bamText.style.fontWeight = "bold";
        bamText.style.color = "#ff6b6b";
        bamText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        bamText.style.fontFamily = "VT323, monospace";
        bamText.style.left = rect.left + rect.width / 2 - 30 + "px";
        bamText.style.top = rect.top + rect.height / 2 - 15 + "px";
        bamText.style.zIndex = "9999";
        bamText.style.pointerEvents = "none";
        bamText.style.transform = "scale(0)";
        bamText.style.transition = "all 0.3s steps(3, end)";
        bamText.style.imageRendering = "pixelated";

        document.body.appendChild(bamText);

        // Pop animation with 8bit steps
        setTimeout(() => {
            bamText.style.transform = "scale(1.5)";
            bamText.style.textShadow = "3px 3px 0px #000, -3px -3px 0px #fff";
        }, 50);

        // Apply CSS animation class
        taskElement.classList.add("explode-effect");

        // Create colorful pixel particles
        this.createExplosionParticles(rect);

        // Make task blink and explode immediately
        this.blinkAndExplodeTask(taskElement);

        // Remove effect class after animation
        setTimeout(() => {
            taskElement.classList.remove("explode-effect");
            bamText.remove();
        }, 1500);
    }

    createFlyAwayEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn("Task element has no dimensions");
            return;
        }

        // Create "済" stamp overlay
        const stampText = document.createElement("div");
        stampText.innerHTML = "済";
        stampText.className = "effect-text";
        stampText.style.position = "fixed";
        stampText.style.fontSize = "48px";
        stampText.style.fontWeight = "bold";
        stampText.style.color = "#ea4335";
        stampText.style.border = "3px solid #ea4335";
        stampText.style.padding = "8px";
        stampText.style.backgroundColor = "rgba(234, 67, 53, 0.1)";
        stampText.style.fontFamily = "VT323, monospace";
        stampText.style.left = rect.left + rect.width / 2 - 40 + "px";
        stampText.style.top = rect.top + rect.height / 2 - 40 + "px";
        stampText.style.zIndex = "9999";
        stampText.style.pointerEvents = "none";
        stampText.style.transform = "scale(0) rotate(-15deg)";
        stampText.style.transition = "all 0.3s steps(3, end)";
        stampText.style.imageRendering = "pixelated";

        document.body.appendChild(stampText);

        // Stamp down effect
        setTimeout(() => {
            stampText.style.transform = "scale(1) rotate(-15deg)";
            stampText.style.boxShadow = "2px 2px 0px rgba(0, 0, 0, 0.5)";
        }, 100);

        // Apply stamp effect to task element
        taskElement.style.backgroundColor = "rgba(234, 67, 53, 0.1)";
        taskElement.style.border = "1px dotted #ea4335";
        taskElement.style.transform = "scale(0.98)";
        taskElement.style.transition = "all 0.4s steps(4, end)";
        taskElement.style.imageRendering = "pixelated";

        // Apply CSS animation class
        taskElement.classList.add("fly-away-effect");

        // Create stamp particles
        this.createStampParticles(rect);

        // Make task grow and tilt immediately
        this.stampAndGrowTask(taskElement);

        // Remove effect class after animation
        setTimeout(() => {
            taskElement.classList.remove("fly-away-effect");
            taskElement.style.backgroundColor = "";
            taskElement.style.border = "";
            taskElement.style.transform = "";
            stampText.remove();
        }, 1800);
    }

    createCrumpleThrowEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn("Task element has no dimensions");
            return;
        }

        // Create "CRUNCH!" text overlay
        const crunchText = document.createElement("div");
        crunchText.innerHTML = "CRUNCH!";
        crunchText.className = "effect-text";
        crunchText.style.position = "fixed";
        crunchText.style.fontSize = "20px";
        crunchText.style.fontWeight = "bold";
        crunchText.style.color = "#fbbc04";
        crunchText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        crunchText.style.fontFamily = "VT323, monospace";
        crunchText.style.left = rect.left + rect.width / 2 - 50 + "px";
        crunchText.style.top = rect.top + rect.height / 2 - 10 + "px";
        crunchText.style.zIndex = "9999";
        crunchText.style.pointerEvents = "none";
        crunchText.style.transform = "scale(0) rotate(0deg)";
        crunchText.style.transition = "all 0.4s steps(4, end)";
        crunchText.style.imageRendering = "pixelated";

        document.body.appendChild(crunchText);

        // Crumple with rotation
        setTimeout(() => {
            crunchText.style.transform = "scale(1.3) rotate(15deg)";
        }, 50);

        // Apply dotted crumple effect to task element
        taskElement.style.border = "2px dotted #fbbc04";
        taskElement.style.transform = "scale(0.8) rotate(5deg)";
        taskElement.style.transition = "all 0.5s steps(5, end)";
        taskElement.style.backgroundColor = "rgba(251, 188, 4, 0.1)";
        taskElement.style.imageRendering = "pixelated";

        // Apply CSS animation class
        taskElement.classList.add("crumple-throw-effect");

        // Create paper-like particles
        this.createCrumpleParticles(rect);

        // Make task fold and crumple immediately
        this.foldAndCrumpleTask(taskElement);

        // Remove effect class after animation
        setTimeout(() => {
            taskElement.classList.remove("crumple-throw-effect");
            taskElement.style.border = "";
            taskElement.style.transform = "";
            taskElement.style.backgroundColor = "";
            crunchText.remove();
        }, 2000);
    }

    createShatterEffect(taskElement, optionalRect) {

        // Apply CSS animation class
        taskElement.classList.add("shatter-effect");

        const rect = optionalRect || taskElement.getBoundingClientRect();
        this.createShatterParticles(rect);

        // Remove effect class after animation
        setTimeout(() => {
            taskElement.classList.remove("shatter-effect");
        }, 1200);
    }

    createVanishEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn("Task element has no dimensions");
            return;
        }

        // Create "POP!" text overlay
        const popText = document.createElement("div");
        popText.innerHTML = "POP!";
        popText.className = "effect-text";
        popText.style.position = "fixed";
        popText.style.fontSize = "24px";
        popText.style.fontWeight = "bold";
        popText.style.color = "#34a853";
        popText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        popText.style.fontFamily = "VT323, monospace";
        popText.style.left = rect.left + rect.width / 2 - 30 + "px";
        popText.style.top = rect.top + rect.height / 2 - 12 + "px";
        popText.style.zIndex = "9999";
        popText.style.pointerEvents = "none";
        popText.style.transform = "scale(0)";
        popText.style.transition = "all 0.2s steps(2, end)";
        popText.style.imageRendering = "pixelated";

        document.body.appendChild(popText);

        // Quick pop animation
        setTimeout(() => {
            popText.style.transform = "scale(1.6)";
        }, 50);

        // Apply pop effect to task element
        taskElement.style.transform = "scale(1.2)";
        taskElement.style.transition = "all 0.3s steps(3, end)";
        taskElement.style.backgroundColor = "rgba(52, 168, 83, 0.2)";
        taskElement.style.imageRendering = "pixelated";

        // Apply CSS animation class
        taskElement.classList.add("vanish-effect");

        // Create pop particles
        this.createPopParticles(rect);

        // Make task fly away dramatically immediately
        this.popAndFlyTask(taskElement);

        // Remove effect class after animation
        setTimeout(() => {
            taskElement.classList.remove("vanish-effect");
            taskElement.style.transform = "";
            taskElement.style.backgroundColor = "";
            popText.remove();
        }, 1000);
    }

    createSpinOffEffect(taskElement, optionalRect) {
        taskElement.classList.add("spin-off-effect");

        const rect = optionalRect || taskElement.getBoundingClientRect();
        this.createSpinTrailParticles(rect);

        // Remove effect class after animation
        setTimeout(() => {
            taskElement.classList.remove("spin-off-effect");
        }, 1500);
    }

    createMeltEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn("Task element has no dimensions");
            return;
        }

        // Create "BURN!" text overlay
        const burnText = document.createElement("div");
        burnText.innerHTML = "BURN!";
        burnText.className = "effect-text";
        burnText.style.position = "fixed";
        burnText.style.fontSize = "22px";
        burnText.style.fontWeight = "bold";
        burnText.style.color = "#ff4444";
        burnText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #ffaa00";
        burnText.style.fontFamily = "VT323, monospace";
        burnText.style.left = rect.left + rect.width / 2 - 40 + "px";
        burnText.style.top = rect.top + rect.height / 2 - 10 + "px";
        burnText.style.zIndex = "9999";
        burnText.style.pointerEvents = "none";
        burnText.style.transform = "scale(0)";
        burnText.style.transition = "all 0.5s steps(5, end)";
        burnText.style.imageRendering = "pixelated";

        document.body.appendChild(burnText);

        // Flicker animation
        let flickerCount = 0;
        const flicker = setInterval(() => {
            burnText.style.color =
                flickerCount % 2 === 0 ? "#ff4444" : "#ffaa00";
            flickerCount++;
            if (flickerCount > 6) clearInterval(flicker);
        }, 100);

        // Scale up with fire effect
        setTimeout(() => {
            burnText.style.transform = "scale(1.4)";
        }, 50);

        // Apply fire effect to task element
        taskElement.style.backgroundColor = "rgba(255, 68, 68, 0.2)";
        taskElement.style.boxShadow = "0 0 20px rgba(255, 68, 68, 0.5)";
        taskElement.style.transform = "scale(1.05)";
        taskElement.style.transition = "all 0.8s steps(8, end)";
        taskElement.style.imageRendering = "pixelated";

        // Apply CSS animation class
        taskElement.classList.add("melt-effect");

        // Create fire particles
        this.createFireParticles(rect);

        // Make task burn and char immediately
        this.burnAndCharTask(taskElement);

        // Remove effect class after animation
        setTimeout(() => {
            taskElement.classList.remove("melt-effect");
            taskElement.style.backgroundColor = "";
            taskElement.style.boxShadow = "";
            taskElement.style.transform = "";
            burnText.remove();
        }, 1800);
    }

    createTornadoEffect(taskElement, optionalRect) {
        taskElement.classList.add("tornado-effect");
        const rect = optionalRect || taskElement.getBoundingClientRect();
        this.createTornadoParticles(rect);

        // Remove effect class after animation
        setTimeout(() => {
            taskElement.classList.remove("tornado-effect");
        }, 2000);
    }

    /** Read theme particle colors from CSS variables; returns null if not set. */
    getThemeParticleColors() {
        try {
            const style = getComputedStyle(document.documentElement);
            const colors = [1, 2, 3, 4].map(n =>
                style.getPropertyValue(`--pd-effect-particle-${n}`).trim()
            ).filter(c => c.length > 0);
            return colors.length === 4 ? colors : null;
        } catch (_) {
            return null;
        }
    }

    createExplosionParticles(rect) {
        if (!rect) return;

        console.log("Task element rect:", rect);

        if (rect.width === 0 && rect.height === 0) {
            console.warn("Task element has no dimensions");
            return;
        }

        // Use viewport coordinates (getBoundingClientRect); particles are position:absolute on body → viewport
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const colors = this.getThemeParticleColors() || [
            "#ff6b6b",
            "#4ecdc4",
            "#45b7d1",
            "#96ceb4",
            "#ffeaa7",
            "#ff9f43",
        ];

        for (let i = 0; i < 25; i++) {
            const particle = document.createElement("div");
            particle.className = "explosion-particles";
            particle.style.backgroundColor =
                colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = centerX + "px";
            particle.style.top = centerY + "px";

            // Random direction for particles
            const angle = (Math.PI * 2 * i) / 25;
            const distance = Math.random() * 100 + 50;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            particle.style.setProperty("--dx", dx + "px");
            particle.style.setProperty("--dy", dy + "px");

            document.body.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 1500);
        }
    }

    createExplosionParticlesAtCenter() {
        console.log("Creating particles at screen center");

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const colors = this.getThemeParticleColors() || [
            "#ff6b6b",
            "#4ecdc4",
            "#45b7d1",
            "#96ceb4",
            "#ffeaa7",
            "#ff9f43",
        ];

        for (let i = 0; i < 25; i++) {
            const particle = document.createElement("div");
            particle.className = "explosion-particles";
            particle.style.backgroundColor =
                colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = centerX + "px";
            particle.style.top = centerY + "px";

            // Random direction for particles
            const angle = (Math.PI * 2 * i) / 25;
            const distance = Math.random() * 100 + 50;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            particle.style.setProperty("--dx", dx + "px");
            particle.style.setProperty("--dy", dy + "px");

            document.body.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 1500);
        }
    }

    create8BitParticles(rect) {
        console.log("Creating subtle 8-bit particles at:", rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const colors = [
            "#ea4335",
            "#34a853",
            "#1a73e8",
            "#fbbc04",
            "#9aa0a6",
            "#5f6368",
        ];

        for (let i = 0; i < 12; i++) {
            const particle = document.createElement("div");
            particle.style.position = "absolute";
            particle.style.width = "6px";
            particle.style.height = "6px";
            particle.style.backgroundColor =
                colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = centerX + "px";
            particle.style.top = centerY + "px";
            particle.style.zIndex = "9998";
            particle.style.pointerEvents = "none";
            particle.style.imageRendering = "pixelated";
            particle.style.boxShadow = "0 0 2px rgba(0,0,0,0.3)";

            // Subtle 8-bit movement pattern
            const angle = (Math.PI * 2 * i) / 12;
            const distance = Math.random() * 60 + 30;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            particle.style.transition = "all 0.6s steps(6, end)";

            document.body.appendChild(particle);

            setTimeout(() => {
                particle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
                particle.style.opacity = "0";
            }, 50);

            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    createSparkleParticles(rect) {
        console.log("Creating sparkle particles at:", rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 6; i++) {
            const sparkle = document.createElement("div");
            sparkle.innerHTML = "★";
            sparkle.style.position = "absolute";
            sparkle.style.fontSize = "12px";
            sparkle.style.color = "#34a853";
            sparkle.style.fontFamily = "Press Start 2P, monospace";
            sparkle.style.left = centerX + "px";
            sparkle.style.top = centerY + "px";
            sparkle.style.zIndex = "9998";
            sparkle.style.pointerEvents = "none";
            sparkle.style.textShadow = "0 0 4px rgba(52, 168, 83, 0.6)";
            sparkle.style.transform = "scale(0)";
            sparkle.style.transition = "all 0.6s steps(4, end)";

            const angle = (Math.PI * 2 * i) / 8;
            const distance = Math.random() * 60 + 30;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            document.body.appendChild(sparkle);

            setTimeout(() => {
                sparkle.style.transform = `translate(${dx}px, ${dy}px) scale(1)`;
            }, 50);

            setTimeout(() => {
                sparkle.style.opacity = "0";
                sparkle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
            }, 500);

            setTimeout(() => {
                sparkle.remove();
            }, 1000);
        }
    }

    createShatterParticles(rect) {
        console.log("Creating shatter particles at:", rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 8; i++) {
            const shard = document.createElement("div");
            shard.style.position = "absolute";
            shard.style.width = "4px";
            shard.style.height = "12px";
            shard.style.backgroundColor = "#9aa0a6";
            shard.style.left = centerX + "px";
            shard.style.top = centerY + "px";
            shard.style.zIndex = "9998";
            shard.style.pointerEvents = "none";
            shard.style.imageRendering = "pixelated";
            shard.style.transform = "scale(0)";
            shard.style.transition = "all 0.6s steps(4, end)";

            const angle = (Math.PI * 2 * i) / 8;
            const distance = Math.random() * 50 + 25;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            const rotation = Math.random() * 360;

            document.body.appendChild(shard);

            setTimeout(() => {
                shard.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation}deg) scale(1)`;
                shard.style.opacity = "0";
            }, 50);

            setTimeout(() => {
                shard.remove();
            }, 800);
        }
    }

    createSpinTrailParticles(rect) {
        console.log("Creating spin trail particles at:", rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 15; i++) {
            const trail = document.createElement("div");
            trail.style.position = "absolute";
            trail.style.width = "3px";
            trail.style.height = "8px";
            trail.style.backgroundColor = "#9aa0a6";
            trail.style.left = centerX + "px";
            trail.style.top = centerY + "px";
            trail.style.zIndex = "9998";
            trail.style.pointerEvents = "none";
            trail.style.imageRendering = "pixelated";
            trail.style.transform = "scale(0)";
            trail.style.transition = "all 1.0s steps(8, end)";
            trail.style.opacity = "0.8";

            const angle = (Math.PI * 2 * i) / 15;
            const distance = Math.random() * 100 + 50;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            const rotation = i * 24; // Create spiral effect

            document.body.appendChild(trail);

            setTimeout(() => {
                trail.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation}deg) scale(1)`;
                trail.style.opacity = "0";
            }, i * 50);

            setTimeout(() => {
                trail.remove();
            }, 1200);
        }
    }

    createCrumpleParticles(rect) {
        console.log("Creating crumple particles at:", rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 12; i++) {
            const particle = document.createElement("div");
            particle.style.position = "absolute";
            particle.style.width = "6px";
            particle.style.height = "6px";
            particle.style.backgroundColor = "#fbbc04";
            particle.style.border = "1px solid #000";
            particle.style.left = centerX + "px";
            particle.style.top = centerY + "px";
            particle.style.zIndex = "9998";
            particle.style.pointerEvents = "none";
            particle.style.imageRendering = "pixelated";
            particle.style.transform = "scale(0)";
            particle.style.transition = "all 0.8s steps(6, end)";

            const angle = (Math.PI * 2 * i) / 12;
            const distance = Math.random() * 40 + 20;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            document.body.appendChild(particle);

            setTimeout(() => {
                particle.style.transform = `translate(${dx}px, ${dy}px) scale(1) rotate(${Math.random() * 360}deg)`;
                particle.style.opacity = "0";
            }, 50);

            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    createFireParticles(rect) {
        console.log("Creating fire particles at:", rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 15; i++) {
            const flame = document.createElement("div");
            flame.style.position = "absolute";
            flame.style.width = "8px";
            flame.style.height = "12px";
            flame.style.backgroundColor = i % 2 === 0 ? "#ff4444" : "#ffaa00";
            flame.style.left = centerX + "px";
            flame.style.top = centerY + "px";
            flame.style.zIndex = "9998";
            flame.style.pointerEvents = "none";
            flame.style.imageRendering = "pixelated";
            flame.style.transform = "scale(0)";
            flame.style.transition = "all 0.6s steps(8, end)";

            const angle = (Math.PI * 2 * i) / 15;
            const distance = Math.random() * 50 + 25;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance - 20; // Fire goes up

            document.body.appendChild(flame);

            setTimeout(() => {
                flame.style.transform = `translate(${dx}px, ${dy}px) scale(1)`;
                flame.style.opacity = "0";
            }, i * 30);

            setTimeout(() => {
                flame.remove();
            }, 800);
        }
    }

    createPopParticles(rect) {
        console.log("Creating pop particles at:", rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 8; i++) {
            const pop = document.createElement("div");
            pop.innerHTML = "★";
            pop.style.position = "absolute";
            pop.style.fontSize = "16px";
            pop.style.color = "#34a853";
            pop.style.fontFamily = "VT323, monospace";
            pop.style.left = centerX + "px";
            pop.style.top = centerY + "px";
            pop.style.zIndex = "9998";
            pop.style.pointerEvents = "none";
            pop.style.transform = "scale(0)";
            pop.style.transition = "all 0.4s steps(4, end)";
            pop.style.imageRendering = "pixelated";

            const angle = (Math.PI * 2 * i) / 8;
            const distance = Math.random() * 60 + 40;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            document.body.appendChild(pop);

            setTimeout(() => {
                pop.style.transform = `translate(${dx}px, ${dy}px) scale(1.5)`;
                pop.style.opacity = "0";
            }, 50);

            setTimeout(() => {
                pop.remove();
            }, 600);
        }
    }

    createStampParticles(rect) {
        console.log("Creating stamp particles at:", rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 6; i++) {
            const stamp = document.createElement("div");
            stamp.innerHTML = "済";
            stamp.style.position = "absolute";
            stamp.style.fontSize = "12px";
            stamp.style.color = "#ea4335";
            stamp.style.fontFamily = "VT323, monospace";
            stamp.style.left = centerX + "px";
            stamp.style.top = centerY + "px";
            stamp.style.zIndex = "9998";
            stamp.style.pointerEvents = "none";
            stamp.style.transform = "scale(0) rotate(-15deg)";
            stamp.style.transition = "all 0.6s steps(6, end)";
            stamp.style.imageRendering = "pixelated";

            const angle = (Math.PI * 2 * i) / 6;
            const distance = Math.random() * 40 + 30;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            document.body.appendChild(stamp);

            setTimeout(() => {
                stamp.style.transform = `translate(${dx}px, ${dy}px) scale(1) rotate(-15deg)`;
                stamp.style.opacity = "0";
            }, i * 100);

            setTimeout(() => {
                stamp.remove();
            }, 800);
        }
    }

    // 1. Pixel Confetti (BAM!) - タスクが点滅してから爆発
    blinkAndExplodeTask(taskElement) {
        console.log("Blinking and exploding task");

        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            taskElement.style.opacity = blinkCount % 2 === 0 ? "0.3" : "1";
            taskElement.style.backgroundColor =
                blinkCount % 2 === 0 ? "#ff6b6b" : "";
            blinkCount++;

            if (blinkCount > 6) {
                clearInterval(blinkInterval);
                // 最後に爆発して消える
                taskElement.style.opacity = "0";
                taskElement.style.transform = "scale(0)";
                taskElement.style.transition = "all 0.3s steps(3, end)";
            }
        }, 100);
    }

    // 2. Crumple Trash (CRUNCH!) - タスクが折りたたまれる
    foldAndCrumpleTask(taskElement) {
        console.log("Folding and crunching task");

        // 段階的に折りたたむ
        setTimeout(() => {
            taskElement.style.transform =
                "scaleY(0.7) scaleX(0.9) rotateX(15deg)";
            taskElement.style.transition = "all 0.3s steps(3, end)";
        }, 100);

        setTimeout(() => {
            taskElement.style.transform =
                "scaleY(0.4) scaleX(0.8) rotateX(30deg)";
            taskElement.style.borderRadius = "8px";
        }, 300);

        setTimeout(() => {
            taskElement.style.transform =
                "scaleY(0.2) scaleX(0.6) rotateX(45deg)";
            taskElement.style.borderRadius = "16px";
        }, 500);

        setTimeout(() => {
            taskElement.style.transform = "scale(0) rotate(90deg)";
            taskElement.style.opacity = "0";
        }, 700);
    }

    // 3. Fire Pixel (BURN!) - タスクが燃えて焦げる
    burnAndCharTask(taskElement) {
        console.log("Burning and charring task");

        // 燃える段階
        setTimeout(() => {
            taskElement.style.backgroundColor = "#ff4444";
            taskElement.style.color = "#fff";
            taskElement.style.boxShadow = "0 0 20px #ff4444";
        }, 100);

        setTimeout(() => {
            taskElement.style.backgroundColor = "#ff8800";
            taskElement.style.transform = "scale(1.05)";
        }, 300);

        setTimeout(() => {
            taskElement.style.backgroundColor = "#cc2200";
            taskElement.style.transform = "scale(0.95)";
        }, 500);

        // 焦げる段階
        setTimeout(() => {
            taskElement.style.backgroundColor = "#444";
            taskElement.style.color = "#999";
            taskElement.style.transform = "scale(0.8)";
            taskElement.style.boxShadow = "0 0 10px #444";
        }, 700);

        setTimeout(() => {
            taskElement.style.backgroundColor = "#222";
            taskElement.style.transform = "scale(0.6)";
            taskElement.style.opacity = "0.5";
        }, 900);

        setTimeout(() => {
            taskElement.style.transform = "scale(0)";
            taskElement.style.opacity = "0";
        }, 1100);
    }

    // 4. Pop Pixel (POP!) - 思いっきり飛んでいく（呼び出し元で body 直下クローンにしているのでそのまま動かしてよい）
    popAndFlyTask(taskElement) {
        console.log("Popping and flying task");

        // ランダムな方向に飛ぶ
        const directions = [
            { x: -200, y: -150, rotate: -180 },
            { x: 200, y: -150, rotate: 180 },
            { x: -150, y: -200, rotate: -90 },
            { x: 150, y: -200, rotate: 90 },
            { x: -250, y: -100, rotate: -135 },
            { x: 250, y: -100, rotate: 135 },
        ];

        const direction =
            directions[Math.floor(Math.random() * directions.length)];

        // 一瞬大きくなってから飛ぶ
        setTimeout(() => {
            taskElement.style.transform = "scale(1.3)";
            taskElement.style.transition = "all 0.1s steps(1, end)";
        }, 50);

        setTimeout(() => {
            taskElement.style.transform = `translate(${direction.x}px, ${direction.y}px) scale(0.3) rotate(${direction.rotate}deg)`;
            taskElement.style.transition = "all 0.8s steps(8, end)";
            taskElement.style.opacity = "0";
        }, 150);
    }

    // 5. Stamp 済 (STAMP!) - 斜めになって大きくなる
    stampAndGrowTask(taskElement) {
        console.log("Stamping and growing task");

        // 段階的に大きくなりながら斜めに
        setTimeout(() => {
            taskElement.style.transform = "scale(1.1) rotate(-2deg)";
            taskElement.style.transition = "all 0.3s steps(3, end)";
        }, 100);

        setTimeout(() => {
            taskElement.style.transform = "scale(1.3) rotate(-5deg)";
            taskElement.style.boxShadow = "0 0 15px rgba(234, 67, 53, 0.5)";
        }, 300);

        setTimeout(() => {
            taskElement.style.transform = "scale(1.5) rotate(-8deg)";
            taskElement.style.boxShadow = "0 0 25px rgba(234, 67, 53, 0.7)";
        }, 500);

        setTimeout(() => {
            taskElement.style.transform = "scale(1.8) rotate(-10deg)";
            taskElement.style.opacity = "0.8";
        }, 700);

        setTimeout(() => {
            taskElement.style.transform = "scale(2) rotate(-12deg)";
            taskElement.style.opacity = "0";
        }, 900);
    }

    createDripParticles(rect) {
        console.log("Creating drip particles at:", rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height;

        for (let i = 0; i < 8; i++) {
            const drip = document.createElement("div");
            drip.style.position = "absolute";
            drip.style.width = "4px";
            drip.style.height = "8px";
            drip.style.backgroundColor = "#fbbc04";
            drip.style.left = centerX + (i - 4) * 10 + "px";
            drip.style.top = centerY + "px";
            drip.style.zIndex = "9998";
            drip.style.pointerEvents = "none";
            drip.style.imageRendering = "pixelated";
            drip.style.borderRadius = "0 0 50% 50%";
            drip.style.transform = "scale(0)";
            drip.style.transition = "all 0.8s steps(6, end)";

            document.body.appendChild(drip);

            setTimeout(() => {
                drip.style.transform = `translateY(40px) scale(1)`;
                drip.style.opacity = "0";
            }, i * 100);

            setTimeout(() => {
                drip.remove();
            }, 1000);
        }
    }

    createTornadoParticles(rect) {
        console.log("Creating tornado particles at:", rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 20; i++) {
            const debris = document.createElement("div");
            debris.style.position = "absolute";
            debris.style.width = "2px";
            debris.style.height = "6px";
            debris.style.backgroundColor = "#5f6368";
            debris.style.left = centerX + "px";
            debris.style.top = centerY + "px";
            debris.style.zIndex = "9998";
            debris.style.pointerEvents = "none";
            debris.style.imageRendering = "pixelated";
            debris.style.transform = "scale(0)";
            debris.style.transition = "all 1.2s steps(12, end)";

            const spiralRadius = 30 + i * 3;
            const angle = i * 18 * (Math.PI / 180); // Spiral pattern
            const dx = Math.cos(angle) * spiralRadius;
            const dy = Math.sin(angle) * spiralRadius - 30;
            const rotation = i * 36;

            document.body.appendChild(debris);

            setTimeout(() => {
                debris.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation}deg) scale(1)`;
                debris.style.opacity = "0";
            }, i * 30);

            setTimeout(() => {
                debris.remove();
            }, 1500);
        }
    }

    playSound(type) {
        if (this.soundEnabled === false) return;
        // Create simple sound effects using Web Audio API
        try {
            if (!this.audioContextReady || !this.audioContext) {
                console.warn("Audio context not ready");
                return;
            }

            // Resume audio context if suspended (common on mobile)
            if (this.audioContext.state === "suspended") {
                this.audioContext.resume();
            }

            const audioContext = this.audioContext;

            // Create oscillator and gain node first
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Clean up after sound completes
            oscillator.onended = () => {
                try {
                    oscillator.disconnect();
                    gainNode.disconnect();
                } catch (e) {
                    // Ignore disconnect errors
                }
            };

            let frequency, duration;

            switch (type) {
                case "explosion":
                    frequency = 80;
                    duration = 0.8;
                    break;
                case "whoosh":
                    frequency = 400;
                    duration = 0.6;
                    break;
                case "crumple":
                    frequency = 300;
                    duration = 0.5;
                    break;
                case "shatter":
                    frequency = 800;
                    duration = 0.4;
                    break;
                case "vanish":
                    frequency = 1000;
                    duration = 0.3;
                    break;
                case "spin":
                    frequency = 600;
                    duration = 0.7;
                    break;
                case "melt":
                    frequency = 200;
                    duration = 0.9;
                    break;
                case "tornado":
                    frequency = 150;
                    duration = 1.0;
                    break;
                case "bounce":
                    frequency = 440;
                    duration = 0.5;
                    break;
                case "slide":
                    frequency = 350;
                    duration = 0.4;
                    break;
                case "flip":
                    frequency = 500;
                    duration = 0.6;
                    break;
                case "shrink":
                    frequency = 700;
                    duration = 0.3;
                    break;
                case "stretch":
                    frequency = 250;
                    duration = 0.5;
                    break;
                case "wobble":
                    frequency = 320;
                    duration = 0.8;
                    break;
                case "fadeOut":
                    frequency = 880;
                    duration = 0.4;
                    break;
                case "taskAdd":
                    // Create custom dual-tone sound
                    const oscillator2 = audioContext.createOscillator();
                    const gainNode2 = audioContext.createGain();

                    oscillator2.connect(gainNode2);
                    gainNode2.connect(audioContext.destination);

                    // Clean up second oscillator
                    oscillator2.onended = () => {
                        try {
                            oscillator2.disconnect();
                            gainNode2.disconnect();
                        } catch (e) {
                            // Ignore disconnect errors
                        }
                    };

                    oscillator.frequency.setValueAtTime(
                        880,
                        audioContext.currentTime,
                    ); // A5 note
                    oscillator2.frequency.setValueAtTime(
                        1108,
                        audioContext.currentTime,
                    ); // C#6 note
                    oscillator.type = "square";
                    oscillator2.type = "square";

                    gainNode.gain.setValueAtTime(
                        0.05,
                        audioContext.currentTime,
                    );
                    gainNode2.gain.setValueAtTime(
                        0.05,
                        audioContext.currentTime,
                    );
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.15,
                    );
                    gainNode2.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.15,
                    );

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.15);
                    oscillator2.start(audioContext.currentTime);
                    oscillator2.stop(audioContext.currentTime + 0.15);
                    return;
                case "taskCancel":
                    // Create simple descending tone for cancel
                    oscillator.frequency.setValueAtTime(
                        400,
                        audioContext.currentTime,
                    );
                    oscillator.frequency.exponentialRampToValueAtTime(
                        200,
                        audioContext.currentTime + 0.15,
                    );
                    oscillator.type = "square";

                    gainNode.gain.setValueAtTime(
                        0.025,
                        audioContext.currentTime,
                    );
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.008,
                        audioContext.currentTime + 0.15,
                    );

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.15);
                    return;
                case "taskEdit":
                    // Create quick click sound for edit actions
                    oscillator.frequency.setValueAtTime(
                        800,
                        audioContext.currentTime,
                    );
                    oscillator.type = "square";

                    gainNode.gain.setValueAtTime(
                        0.06,
                        audioContext.currentTime,
                    );
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.1,
                    );

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    return;
                case "taskDelete":
                    // Create deletion sound effect
                    oscillator.frequency.setValueAtTime(
                        200,
                        audioContext.currentTime,
                    );
                    oscillator.frequency.exponentialRampToValueAtTime(
                        80,
                        audioContext.currentTime + 0.3,
                    );
                    oscillator.type = "square";

                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.3,
                    );

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                    return;
                case "taskComplete":
                    // 単一音の短い上昇トーン（成功・完了）
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.15);
                    oscillator.type = "square";
                    gainNode.gain.setValueAtTime(0.06, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.15);
                    return;
                case "buttonClick":
                    // Short click for buttons (Today, Tomorrow, Repeat, etc.)
                    oscillator.frequency.setValueAtTime(
                        600,
                        audioContext.currentTime,
                    );
                    oscillator.type = "square";

                    gainNode.gain.setValueAtTime(
                        0.05,
                        audioContext.currentTime,
                    );
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.08,
                    );

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.08);
                    return;
                case "perfectTimingGaugeTick":
                    oscillator.frequency.setValueAtTime(
                        900,
                        audioContext.currentTime,
                    );
                    oscillator.type = "square";
                    gainNode.gain.setValueAtTime(
                        0.03,
                        audioContext.currentTime,
                    );
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.005,
                        audioContext.currentTime + 0.06,
                    );
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.06);
                    return;
                case "perfectTimingMiss":
                    oscillator.frequency.setValueAtTime(
                        350,
                        audioContext.currentTime,
                    );
                    oscillator.frequency.exponentialRampToValueAtTime(
                        150,
                        audioContext.currentTime + 0.12,
                    );
                    oscillator.type = "square";
                    gainNode.gain.setValueAtTime(
                        0.05,
                        audioContext.currentTime,
                    );
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.12,
                    );
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.12);
                    return;
                case "perfectTimingGood":
                    oscillator.frequency.setValueAtTime(
                        523,
                        audioContext.currentTime,
                    );
                    gainNode.gain.setValueAtTime(
                        0.06,
                        audioContext.currentTime,
                    );
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.12,
                    );
                    oscillator.type = "square";
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.12);
                    return;
                case "perfectTimingGreat":
                    oscillator.frequency.setValueAtTime(
                        659,
                        audioContext.currentTime,
                    );
                    gainNode.gain.setValueAtTime(
                        0.07,
                        audioContext.currentTime,
                    );
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.14,
                    );
                    oscillator.type = "square";
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.14);
                    return;
                case "perfectTimingPerfect":
                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioContext.destination);
                    osc2.onended = () => {
                        try {
                            osc2.disconnect();
                            gain2.disconnect();
                        } catch (e) {}
                    };
                    oscillator.frequency.setValueAtTime(
                        880,
                        audioContext.currentTime,
                    );
                    oscillator.frequency.exponentialRampToValueAtTime(
                        1320,
                        audioContext.currentTime + 0.2,
                    );
                    osc2.frequency.setValueAtTime(
                        1108,
                        audioContext.currentTime,
                    );
                    osc2.frequency.exponentialRampToValueAtTime(
                        1660,
                        audioContext.currentTime + 0.2,
                    );
                    oscillator.type = "square";
                    osc2.type = "square";
                    gainNode.gain.setValueAtTime(0.07, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.2,
                    );
                    gain2.gain.setValueAtTime(0.05, audioContext.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(
                        0.005,
                        audioContext.currentTime + 0.2,
                    );
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                    osc2.start(audioContext.currentTime);
                    osc2.stop(audioContext.currentTime + 0.2);
                    return;
                case "crtPowerOff":
                    oscillator.frequency.setValueAtTime(120, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.1);
                    oscillator.type = "square";
                    gainNode.gain.setValueAtTime(0.04, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    return;
                case "crtReboot":
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                    oscillator.type = "square";
                    gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.08);
                    return;
                default:
                    return;
            }

            oscillator.frequency.value = frequency;
            oscillator.type = "square";

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + duration,
            );

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.log("Audio playback error:", error);
        }
    }

    // Add haptic feedback for mobile devices
    playHapticFeedback(intensity = "medium") {
        if ("vibrate" in navigator) {
            switch (intensity) {
                case "light":
                    navigator.vibrate(50);
                    break;
                case "medium":
                    navigator.vibrate([100, 50, 100]);
                    break;
                case "strong":
                    navigator.vibrate([200, 100, 200, 100, 200]);
                    break;
            }
        }
    }

    // 5コンボ以上のスーパーエフェクト - 8bitドットスタイル
    createSuperComboEffect() {
        console.log("Creating super combo effect!");

        // 画面中央にピクセル文字「SUPER!」を表示
        const superText = document.createElement("div");
        superText.innerHTML = "SUPER!";
        superText.style.position = "fixed";
        superText.style.left = "50%";
        superText.style.top = "30%";
        superText.style.transform = "translate(-50%, -50%) scale(0)";
        superText.style.fontSize = "32px";
        superText.style.fontFamily = "VT323, monospace";
        superText.style.color = "#ff6b6b";
        superText.style.textShadow = "4px 4px 0px #000, -4px -4px 0px #fff";
        superText.style.zIndex = "9999";
        superText.style.pointerEvents = "none";
        superText.style.transition = "all 0.5s steps(5, end)";
        superText.style.imageRendering = "pixelated";

        document.body.appendChild(superText);

        // テキストアニメーション
        setTimeout(() => {
            superText.style.transform = "translate(-50%, -50%) scale(1.5)";
            superText.style.color = "#ffd93d";
        }, 100);

        setTimeout(() => {
            superText.style.transform = "translate(-50%, -50%) scale(1)";
            superText.style.opacity = "0";
        }, 1000);

        setTimeout(() => {
            superText.remove();
        }, 1500);

        // 画面中央に8bitドット爆発エフェクト
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < 24; i++) {
            const pixel = document.createElement("div");
            pixel.style.position = "fixed";
            pixel.style.width = "8px";
            pixel.style.height = "8px";
            pixel.style.backgroundColor = [
                "#ff3333",
                "#ffff33",
                "#33ff33",
                "#3333ff",
                "#ff33ff",
                "#33ffff",
            ][i % 6];
            pixel.style.left = centerX + "px";
            pixel.style.top = centerY + "px";
            pixel.style.zIndex = "9998";
            pixel.style.pointerEvents = "none";
            pixel.style.borderRadius = "0"; // 完全に四角のピクセル
            pixel.style.transform = "scale(0)";
            pixel.style.transition = "all 1.2s steps(12, end)";
            pixel.style.imageRendering = "pixelated";
            pixel.style.border = "1px solid #000";

            const angle = (Math.PI * 2 * i) / 24;
            const distance = Math.random() * 120 + 80;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            document.body.appendChild(pixel);

            setTimeout(() => {
                pixel.style.transform = `translate(${dx}px, ${dy}px) scale(1)`;
                pixel.style.opacity = "0";
            }, 50);

            setTimeout(() => {
                pixel.remove();
            }, 1300);
        }
    }

    // 10コンボ以上のメガエフェクト - 8bitドットスタイル
    createMegaComboEffect() {
        console.log("Creating MEGA combo effect!");

        // 画面中央にピクセル文字「MEGA!」を表示
        const megaText = document.createElement("div");
        megaText.innerHTML = "MEGA!";
        megaText.style.position = "fixed";
        megaText.style.left = "50%";
        megaText.style.top = "25%";
        megaText.style.transform = "translate(-50%, -50%) scale(0)";
        megaText.style.fontSize = "48px";
        megaText.style.fontFamily = "VT323, monospace";
        megaText.style.color = "#ff3333";
        megaText.style.textShadow = "6px 6px 0px #000, -6px -6px 0px #fff";
        megaText.style.zIndex = "9999";
        megaText.style.pointerEvents = "none";
        megaText.style.transition = "all 0.8s steps(8, end)";
        megaText.style.imageRendering = "pixelated";

        document.body.appendChild(megaText);

        // テキストアニメーション
        setTimeout(() => {
            megaText.style.transform = "translate(-50%, -50%) scale(2)";
            megaText.style.color = "#ffd700";
        }, 100);

        setTimeout(() => {
            megaText.style.transform = "translate(-50%, -50%) scale(1.5)";
            megaText.style.color = "#ff33ff";
        }, 400);

        setTimeout(() => {
            megaText.style.transform = "translate(-50%, -50%) scale(1)";
            megaText.style.opacity = "0";
        }, 1200);

        setTimeout(() => {
            megaText.remove();
        }, 2000);

        // 画面全体に8bitドット星エフェクト
        for (let i = 0; i < 40; i++) {
            const pixelStar = document.createElement("div");
            pixelStar.innerHTML = "★";
            pixelStar.style.position = "fixed";
            pixelStar.style.fontSize = Math.random() * 12 + 8 + "px";
            pixelStar.style.fontFamily = "VT323, monospace";
            pixelStar.style.color = [
                "#ffd700",
                "#ffff33",
                "#ffffff",
                "#ff8833",
                "#ff33ff",
                "#33ffff",
            ][i % 6];
            pixelStar.style.left = Math.random() * window.innerWidth + "px";
            pixelStar.style.top = Math.random() * window.innerHeight + "px";
            pixelStar.style.zIndex = "9998";
            pixelStar.style.pointerEvents = "none";
            pixelStar.style.opacity = "0";
            pixelStar.style.transition = "all 1.8s steps(18, end)";
            pixelStar.style.transform = "scale(0)";
            pixelStar.style.textShadow = "2px 2px 0px #000";
            pixelStar.style.imageRendering = "pixelated";

            document.body.appendChild(pixelStar);

            setTimeout(() => {
                pixelStar.style.opacity = "1";
                pixelStar.style.transform = "scale(1.5)";
            }, i * 40);

            setTimeout(
                () => {
                    pixelStar.style.opacity = "0";
                    pixelStar.style.transform = "scale(0)";
                },
                1000 + i * 40,
            );

            setTimeout(() => {
                pixelStar.remove();
            }, 2000);
        }

        // 追加のドットパーティクル
        for (let i = 0; i < 60; i++) {
            const dotParticle = document.createElement("div");
            dotParticle.style.position = "fixed";
            dotParticle.style.width = "4px";
            dotParticle.style.height = "4px";
            dotParticle.style.backgroundColor = [
                "#ff3333",
                "#33ff33",
                "#3333ff",
                "#ffff33",
                "#ff33ff",
                "#33ffff",
            ][i % 6];
            dotParticle.style.left = Math.random() * window.innerWidth + "px";
            dotParticle.style.top = Math.random() * window.innerHeight + "px";
            dotParticle.style.zIndex = "9997";
            dotParticle.style.pointerEvents = "none";
            dotParticle.style.borderRadius = "0";
            dotParticle.style.opacity = "0";
            dotParticle.style.transition = "all 1.5s steps(15, end)";
            dotParticle.style.transform = "scale(0)";
            dotParticle.style.imageRendering = "pixelated";
            dotParticle.style.border = "1px solid #000";

            document.body.appendChild(dotParticle);

            setTimeout(() => {
                dotParticle.style.opacity = "1";
                dotParticle.style.transform = "scale(2)";
            }, i * 25);

            setTimeout(
                () => {
                    dotParticle.style.opacity = "0";
                    dotParticle.style.transform = "scale(0)";
                },
                800 + i * 25,
            );

            setTimeout(() => {
                dotParticle.remove();
            }, 1800);
        }
    }

    // New effect methods
    createBounceEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        const bounceText = document.createElement("div");
        bounceText.innerHTML = "BOUNCE!";
        bounceText.className = "effect-text";
        bounceText.style.position = "fixed";
        bounceText.style.fontSize = "20px";
        bounceText.style.fontWeight = "bold";
        bounceText.style.color = "#ff9800";
        bounceText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        bounceText.style.fontFamily = "VT323, monospace";
        bounceText.style.left = rect.left + rect.width / 2 - 35 + "px";
        bounceText.style.top = rect.top + rect.height / 2 - 10 + "px";
        bounceText.style.zIndex = "9999";
        bounceText.style.pointerEvents = "none";
        bounceText.style.transform = "scale(0) translateY(0)";
        bounceText.style.transition = "all 0.3s steps(3, end)";
        bounceText.style.imageRendering = "pixelated";

        document.body.appendChild(bounceText);

        setTimeout(() => {
            bounceText.style.transform = "scale(1.2) translateY(-10px)";
        }, 100);

        setTimeout(() => {
            bounceText.style.transform = "scale(1) translateY(0)";
        }, 400);

        setTimeout(() => {
            bounceText.remove();
        }, 1200);

        taskElement.classList.add("bounce-effect");
        setTimeout(() => {
            taskElement.classList.remove("bounce-effect");
        }, 1200);
    }

    createSlideLeftEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        const slideText = document.createElement("div");
        slideText.innerHTML = "SLIDE!";
        slideText.className = "effect-text";
        slideText.style.position = "fixed";
        slideText.style.fontSize = "18px";
        slideText.style.fontWeight = "bold";
        slideText.style.color = "#2196F3";
        slideText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        slideText.style.fontFamily = "VT323, monospace";
        slideText.style.left = rect.left + rect.width / 2 - 30 + "px";
        slideText.style.top = rect.top + rect.height / 2 - 10 + "px";
        slideText.style.zIndex = "9999";
        slideText.style.pointerEvents = "none";
        slideText.style.transform = "scale(0) translateX(0)";
        slideText.style.transition = "all 0.4s steps(4, end)";
        slideText.style.imageRendering = "pixelated";

        document.body.appendChild(slideText);

        setTimeout(() => {
            slideText.style.transform = "scale(1.2) translateX(-20px)";
        }, 100);

        setTimeout(() => {
            slideText.remove();
        }, 1300);

        taskElement.classList.add("slide-left-effect");
        setTimeout(() => {
            taskElement.classList.remove("slide-left-effect");
        }, 1300);
    }

    createSlideRightEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        const slideText = document.createElement("div");
        slideText.innerHTML = "SLIDE!";
        slideText.className = "effect-text";
        slideText.style.position = "fixed";
        slideText.style.fontSize = "18px";
        slideText.style.fontWeight = "bold";
        slideText.style.color = "#2196F3";
        slideText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        slideText.style.fontFamily = "VT323, monospace";
        slideText.style.left = rect.left + rect.width / 2 - 30 + "px";
        slideText.style.top = rect.top + rect.height / 2 - 10 + "px";
        slideText.style.zIndex = "9999";
        slideText.style.pointerEvents = "none";
        slideText.style.transform = "scale(0) translateX(0)";
        slideText.style.transition = "all 0.4s steps(4, end)";
        slideText.style.imageRendering = "pixelated";

        document.body.appendChild(slideText);

        setTimeout(() => {
            slideText.style.transform = "scale(1.2) translateX(20px)";
        }, 100);

        setTimeout(() => {
            slideText.remove();
        }, 1300);

        taskElement.classList.add("slide-right-effect");
        setTimeout(() => {
            taskElement.classList.remove("slide-right-effect");
        }, 1300);
    }

    createFlipEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        const flipText = document.createElement("div");
        flipText.innerHTML = "FLIP!";
        flipText.className = "effect-text";
        flipText.style.position = "fixed";
        flipText.style.fontSize = "22px";
        flipText.style.fontWeight = "bold";
        flipText.style.color = "#9C27B0";
        flipText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        flipText.style.fontFamily = "VT323, monospace";
        flipText.style.left = rect.left + rect.width / 2 - 25 + "px";
        flipText.style.top = rect.top + rect.height / 2 - 10 + "px";
        flipText.style.zIndex = "9999";
        flipText.style.pointerEvents = "none";
        flipText.style.transform = "scale(0) rotateY(0deg)";
        flipText.style.transition = "all 0.5s steps(5, end)";
        flipText.style.imageRendering = "pixelated";

        document.body.appendChild(flipText);

        setTimeout(() => {
            flipText.style.transform = "scale(1.3) rotateY(180deg)";
        }, 100);

        setTimeout(() => {
            flipText.remove();
        }, 1400);

        taskElement.classList.add("flip-effect");
        setTimeout(() => {
            taskElement.classList.remove("flip-effect");
        }, 1400);
    }

    createShrinkEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        taskElement.style.transformOrigin = `${centerX - rect.left}px ${centerY - rect.top}px`;
        const shrinkText = document.createElement("div");
        shrinkText.innerHTML = "SHRINK!";
        shrinkText.className = "effect-text";
        shrinkText.style.position = "fixed";
        shrinkText.style.fontSize = "16px";
        shrinkText.style.fontWeight = "bold";
        shrinkText.style.color = "#FF5722";
        shrinkText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        shrinkText.style.fontFamily = "VT323, monospace";
        shrinkText.style.left = rect.left + rect.width / 2 - 35 + "px";
        shrinkText.style.top = rect.top + rect.height / 2 - 10 + "px";
        shrinkText.style.zIndex = "9999";
        shrinkText.style.pointerEvents = "none";
        shrinkText.style.transform = "scale(1.5)";
        shrinkText.style.transition = "all 0.3s steps(3, end)";
        shrinkText.style.imageRendering = "pixelated";

        document.body.appendChild(shrinkText);

        setTimeout(() => {
            shrinkText.style.transform = "scale(0)";
        }, 100);

        setTimeout(() => {
            shrinkText.remove();
        }, 1000);

        taskElement.classList.add("shrink-effect");
        setTimeout(() => {
            taskElement.classList.remove("shrink-effect");
            // Restore transform-origin after animation
            taskElement.style.transformOrigin = "";
        }, 1000);
    }

    createStretchEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        const stretchText = document.createElement("div");
        stretchText.innerHTML = "STRETCH!";
        stretchText.className = "effect-text";
        stretchText.style.position = "fixed";
        stretchText.style.fontSize = "18px";
        stretchText.style.fontWeight = "bold";
        stretchText.style.color = "#00BCD4";
        stretchText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        stretchText.style.fontFamily = "VT323, monospace";
        stretchText.style.left = rect.left + rect.width / 2 - 40 + "px";
        stretchText.style.top = rect.top + rect.height / 2 - 10 + "px";
        stretchText.style.zIndex = "9999";
        stretchText.style.pointerEvents = "none";
        stretchText.style.transform = "scaleX(0.5) scaleY(1)";
        stretchText.style.transition = "all 0.4s steps(4, end)";
        stretchText.style.imageRendering = "pixelated";

        document.body.appendChild(stretchText);

        setTimeout(() => {
            stretchText.style.transform = "scaleX(1.5) scaleY(0.7)";
        }, 100);

        setTimeout(() => {
            stretchText.remove();
        }, 1100);

        taskElement.classList.add("stretch-effect");
        setTimeout(() => {
            taskElement.classList.remove("stretch-effect");
        }, 1100);
    }

    createWobbleEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        const wobbleText = document.createElement("div");
        wobbleText.innerHTML = "WOBBLE!";
        wobbleText.className = "effect-text";
        wobbleText.style.position = "fixed";
        wobbleText.style.fontSize = "20px";
        wobbleText.style.fontWeight = "bold";
        wobbleText.style.color = "#8BC34A";
        wobbleText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        wobbleText.style.fontFamily = "VT323, monospace";
        wobbleText.style.left = rect.left + rect.width / 2 - 35 + "px";
        wobbleText.style.top = rect.top + rect.height / 2 - 10 + "px";
        wobbleText.style.zIndex = "9999";
        wobbleText.style.pointerEvents = "none";
        wobbleText.style.transform = "scale(0) rotate(0deg)";
        wobbleText.style.transition = "all 0.6s steps(6, end)";
        wobbleText.style.imageRendering = "pixelated";

        document.body.appendChild(wobbleText);

        setTimeout(() => {
            wobbleText.style.transform = "scale(1.2) rotate(15deg)";
        }, 100);

        setTimeout(() => {
            wobbleText.style.transform = "scale(1) rotate(-10deg)";
        }, 400);

        setTimeout(() => {
            wobbleText.remove();
        }, 1500);

        taskElement.classList.add("wobble-effect");
        setTimeout(() => {
            taskElement.classList.remove("wobble-effect");
        }, 1500);
    }

    createFadeOutEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        const fadeText = document.createElement("div");
        fadeText.innerHTML = "FADE!";
        fadeText.className = "effect-text";
        fadeText.style.position = "fixed";
        fadeText.style.fontSize = "18px";
        fadeText.style.fontWeight = "bold";
        fadeText.style.color = "#607D8B";
        fadeText.style.textShadow = "2px 2px 0px #000, -2px -2px 0px #fff";
        fadeText.style.fontFamily = "VT323, monospace";
        fadeText.style.left = rect.left + rect.width / 2 - 25 + "px";
        fadeText.style.top = rect.top + rect.height / 2 - 10 + "px";
        fadeText.style.zIndex = "9999";
        fadeText.style.pointerEvents = "none";
        fadeText.style.transform = "scale(1.2)";
        fadeText.style.opacity = "1";
        fadeText.style.transition = "all 0.4s steps(4, end)";
        fadeText.style.imageRendering = "pixelated";

        document.body.appendChild(fadeText);

        setTimeout(() => {
            fadeText.style.transform = "scale(0.8)";
            fadeText.style.opacity = "0";
        }, 100);

        setTimeout(() => {
            fadeText.remove();
        }, 1200);

        taskElement.classList.add("fade-out-effect");
        setTimeout(() => {
            taskElement.classList.remove("fade-out-effect");
        }, 1200);
    }

    createRainbowSmashEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn("Task element has no dimensions");
            return;
        }

        // Apply CSS animation class to task element
        taskElement.classList.add("rainbow-smash-effect");

        // Create magical "Rainbow" text overlay with healing vibe
        const rainbowText = document.createElement("div");
        rainbowText.innerHTML = "Rainbow";
        rainbowText.className = "effect-text";
        rainbowText.style.position = "fixed";
        rainbowText.style.fontSize = "32px";
        rainbowText.style.fontWeight = "bold";
        rainbowText.style.color = "#ff6b6b";
        rainbowText.style.textShadow =
            "3px 3px 0px #000, -3px -3px 0px #fff, 0 0 10px rgba(255, 107, 107, 0.8)";
        rainbowText.style.fontFamily = "VT323, monospace";
        rainbowText.style.left = rect.left + rect.width / 2 - 70 + "px";
        rainbowText.style.top = rect.top + rect.height / 2 - 20 + "px";
        rainbowText.style.zIndex = "9999";
        rainbowText.style.pointerEvents = "none";
        rainbowText.style.transform = "scale(0)";
        rainbowText.style.transition = "all 0.4s ease-out";
        rainbowText.style.imageRendering = "pixelated";
        rainbowText.style.background =
            "linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)";
        rainbowText.style.backgroundSize = "400% 400%";
        rainbowText.style.animation =
            "rainbowTextGradient 1s ease-in-out infinite";
        rainbowText.style.webkitBackgroundClip = "text";
        rainbowText.style.webkitTextFillColor = "transparent";

        document.body.appendChild(rainbowText);

        // Gentle appearance animation
        setTimeout(() => {
            rainbowText.style.transform = "scale(1.2)";
        }, 100);

        // Create 8bit pixel rainbow with canvas
        this.createPixelRainbow(rect);

        // Add gentle healing sparkle particles
        this.createHealingSparkles(rect);

        // Create soft background glow effect
        this.createSoftGlow();

        // Clean up after 1.5s and release effect lock
        setTimeout(() => {
            taskElement.classList.remove("rainbow-smash-effect");
            rainbowText.remove();
            this.effectLock = false;
        }, 1500);
    }

    createFreezeEffect(taskElement, optionalRect) {
        if (typeof window.FreezeEffect !== "function") {
            console.warn("FreezeEffect module not loaded");
            this.effectLock = false;
            return;
        }
        const self = this;
        const isTaskCard = taskElement && taskElement.classList && taskElement.classList.contains("task-item");
        const contentBelow = document.getElementById("contentBelowTabs");
        if (isTaskCard) {
            taskElement.classList.add("freeze-task-frozen");
        }
        if (contentBelow) {
            contentBelow.classList.add("freeze-list-shake");
        }
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        const freeze = new window.FreezeEffect({
            color: "#00e8ff",
            duration: 800,
            text: "FREEZE",
            textStyle: "font",
            pixelSize: 6,
            showPenguin: true,
            penguinImageUrl: "/assets/penguin.svg",
            showCracks: true,
            particles: 60,
            zIndex: 100000,
            onComplete() {
                if (isTaskCard) {
                    taskElement.classList.remove("freeze-task-frozen");
                }
                if (contentBelow) {
                    contentBelow.classList.remove("freeze-list-shake");
                }
                self.effectLock = false;
            },
        });
        freeze.trigger();
    }

    // ── Synthwave effects ──────────────────────────────────────────────────

    createGlitchSlideEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const FONT = "'Orbitron', 'Courier New', monospace";
        const MAGENTA = "#ff2dff";
        const CYAN = "#00fff0";
        const DUR = 650;

        // "GLITCH!" label
        const label = document.createElement("div");
        label.innerHTML = "GLITCH!";
        label.className = "effect-text";
        label.style.cssText = [
            "position:fixed",
            `font-size:18px`,
            "font-weight:900",
            `color:${CYAN}`,
            `text-shadow:3px 0 ${MAGENTA},-3px 0 ${MAGENTA},0 0 14px ${CYAN}`,
            `font-family:${FONT}`,
            `left:${rect.left + rect.width / 2 - 42}px`,
            `top:${rect.top + rect.height / 2 - 12}px`,
            "z-index:100000",
            "pointer-events:none",
            "transform:scale(0)",
            "transition:transform 0.12s steps(3,end)",
            "letter-spacing:3px",
        ].join(";");
        document.body.appendChild(label);
        setTimeout(() => { label.style.transform = "scale(1.15)"; }, 40);

        // Magenta RGB ghost (offset +6px)
        const ghostM = taskElement.cloneNode(true);
        ghostM.removeAttribute("id");
        ghostM.style.cssText = [
            "position:fixed",
            `left:${rect.left + 6}px`,
            `top:${rect.top}px`,
            `width:${rect.width}px`,
            `height:${rect.height}px`,
            "pointer-events:none",
            "z-index:99997",
            "opacity:0.55",
            "mix-blend-mode:screen",
            `filter:saturate(0) brightness(0) sepia(1) hue-rotate(280deg) saturate(6)`,
            `animation:glitchSlideCard ${DUR}ms cubic-bezier(0.22,1,0.36,1) 35ms forwards`,
            "overflow:hidden",
            "box-sizing:border-box",
        ].join(";");
        document.body.appendChild(ghostM);

        // Cyan RGB ghost (offset -6px)
        const ghostC = taskElement.cloneNode(true);
        ghostC.removeAttribute("id");
        ghostC.style.cssText = [
            "position:fixed",
            `left:${rect.left - 6}px`,
            `top:${rect.top}px`,
            `width:${rect.width}px`,
            `height:${rect.height}px`,
            "pointer-events:none",
            "z-index:99997",
            "opacity:0.55",
            "mix-blend-mode:screen",
            `filter:saturate(0) brightness(0) sepia(1) hue-rotate(160deg) saturate(6)`,
            `animation:glitchSlideCard ${DUR}ms cubic-bezier(0.22,1,0.36,1) 70ms forwards`,
            "overflow:hidden",
            "box-sizing:border-box",
        ].join(";");
        document.body.appendChild(ghostC);

        // Main element
        taskElement.classList.add("glitch-slide-effect");

        setTimeout(() => {
            taskElement.classList.remove("glitch-slide-effect");
            label.remove();
            ghostM.remove();
            ghostC.remove();
        }, DUR + 150);
    }

    createNeonWarpEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const FONT = "'Orbitron', 'Courier New', monospace";
        const MAGENTA = "#ff2dff";
        const CYAN = "#00fff0";
        const DUR = 600;

        // "WARP!" label — appears above, fades right
        const label = document.createElement("div");
        label.innerHTML = "WARP!";
        label.className = "effect-text";
        label.style.cssText = [
            "position:fixed",
            "font-size:22px",
            "font-weight:900",
            `color:${CYAN}`,
            `text-shadow:0 0 8px ${CYAN},0 0 22px ${CYAN},2px 0 ${MAGENTA}`,
            `font-family:${FONT}`,
            `left:${rect.left + rect.width / 2 - 38}px`,
            `top:${rect.top - 32}px`,
            "z-index:100000",
            "pointer-events:none",
            "opacity:1",
            "transition:opacity 0.25s ease,transform 0.25s ease",
            "letter-spacing:4px",
        ].join(";");
        document.body.appendChild(label);
        setTimeout(() => {
            label.style.opacity = "0";
            label.style.transform = "translateX(40px)";
        }, 180);

        // Cyan/magenta streak line at vertical center
        const streak = document.createElement("div");
        streak.style.cssText = [
            "position:fixed",
            `left:${rect.left}px`,
            `top:${rect.top + rect.height / 2 - 1}px`,
            `width:${rect.width}px`,
            "height:2px",
            "pointer-events:none",
            "z-index:99998",
            `background:linear-gradient(to right,transparent,${CYAN},${MAGENTA},transparent)`,
            "opacity:0",
            "transition:opacity 0.08s ease,width 0.35s ease",
            "box-sizing:border-box",
        ].join(";");
        document.body.appendChild(streak);
        setTimeout(() => { streak.style.opacity = "0.9"; streak.style.width = "220px"; }, 80);

        // White flash overlay on the task
        const flash = document.createElement("div");
        flash.style.cssText = [
            "position:fixed",
            `left:${rect.left}px`,
            `top:${rect.top}px`,
            `width:${rect.width}px`,
            `height:${rect.height}px`,
            "pointer-events:none",
            "z-index:99999",
            "background:white",
            "opacity:0",
            "border-radius:4px",
            "animation:neonBigBangFlash 0.3s ease-out 0.15s forwards",
        ].join(";");
        document.body.appendChild(flash);

        // Main element warps right
        taskElement.classList.add("neon-warp-effect");

        setTimeout(() => {
            taskElement.classList.remove("neon-warp-effect");
            label.remove();
            streak.remove();
            flash.remove();
        }, DUR + 100);
    }

    createNeonBigBangEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            this.effectLock = false;
            return;
        }

        const FONT = "'Orbitron', 'Courier New', monospace";
        const MAGENTA = "#ff2dff";
        const CYAN = "#00fff0";
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxLen = Math.hypot(window.innerWidth, window.innerHeight);

        // "CLEARED!!" label
        const label = document.createElement("div");
        label.innerHTML = "CLEARED!!";
        label.className = "effect-text";
        label.style.cssText = [
            "position:fixed",
            "font-size:26px",
            "font-weight:900",
            `color:${CYAN}`,
            `text-shadow:0 0 10px ${CYAN},0 0 30px ${CYAN},0 0 60px ${MAGENTA},2px 2px 0 ${MAGENTA}`,
            `font-family:${FONT}`,
            `left:${cx - 95}px`,
            `top:${cy - 52}px`,
            "z-index:100000",
            "pointer-events:none",
            "transform:scale(0)",
            "transition:transform 0.2s cubic-bezier(0.22,1,0.36,1)",
            "letter-spacing:4px",
            "white-space:nowrap",
        ].join(";");
        document.body.appendChild(label);
        setTimeout(() => { label.style.transform = "scale(1.05)"; }, 40);

        // 8 rays: alternating magenta/cyan at 45° increments
        const rayColors = [MAGENTA, CYAN, MAGENTA, CYAN, MAGENTA, CYAN, MAGENTA, CYAN];
        const rays = rayColors.map((color, i) => {
            const angleDeg = i * 45;
            const angleRad = angleDeg * Math.PI / 180;
            const ray = document.createElement("div");
            ray.style.cssText = [
                "position:fixed",
                `left:${cx}px`,
                `top:${cy - 2}px`,
                `width:${maxLen}px`,
                "height:4px",
                "pointer-events:none",
                `z-index:99998`,
                `background:linear-gradient(to right,${color} 0%,${color} 30%,transparent 100%)`,
                "transform-origin:0 50%",
                `transform:rotate(${angleRad}rad) scaleX(0)`,
                "opacity:1",
                `box-shadow:0 0 6px ${color},0 0 14px ${color}`,
                `transition:transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 18}ms,opacity 0.4s ease ${400 + i * 18}ms`,
            ].join(";");
            document.body.appendChild(ray);
            setTimeout(() => {
                ray.style.transform = `rotate(${angleRad}rad) scaleX(1)`;
            }, 20 + i * 10);
            setTimeout(() => { ray.style.opacity = "0"; }, 420 + i * 18);
            return ray;
        });

        // Center radial flash
        const flash = document.createElement("div");
        flash.style.cssText = [
            "position:fixed",
            `left:${rect.left}px`,
            `top:${rect.top}px`,
            `width:${rect.width}px`,
            `height:${rect.height}px`,
            "pointer-events:none",
            "z-index:99999",
            `background:radial-gradient(circle,white 0%,${MAGENTA} 45%,transparent 70%)`,
            "opacity:0",
            "border-radius:4px",
            "animation:neonBigBangFlash 0.5s ease-out forwards",
        ].join(";");
        document.body.appendChild(flash);

        // Neon particles
        const pColors = [MAGENTA, CYAN, "#ff88ff", "#88ffff", "#ffffff"];
        const particles = Array.from({ length: 22 }, (_, p) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 70 + Math.random() * 160;
            const color = pColors[p % pColors.length];
            const size = 3 + Math.random() * 5;
            const el = document.createElement("div");
            el.style.cssText = [
                "position:fixed",
                `left:${cx - size / 2}px`,
                `top:${cy - size / 2}px`,
                `width:${size}px`,
                `height:${size}px`,
                "pointer-events:none",
                "z-index:99999",
                `background:${color}`,
                `box-shadow:0 0 6px ${color}`,
                "border-radius:50%",
                `transition:transform 0.75s cubic-bezier(0.25,1,0.5,1) ${20 + p * 12}ms,opacity 0.75s ease ${20 + p * 12}ms`,
            ].join(";");
            document.body.appendChild(el);
            setTimeout(() => {
                el.style.transform = `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px)`;
                el.style.opacity = "0";
            }, 30 + p * 12);
            return el;
        });

        // Main task element
        taskElement.classList.add("neon-big-bang-effect");

        setTimeout(() => {
            taskElement.classList.remove("neon-big-bang-effect");
            label.remove();
            flash.remove();
            rays.forEach(r => r.remove());
            particles.forEach(p => p.remove());
            this.effectLock = false;
        }, 1800);
    }

    // ──────────────────────────────────────────────────────────────────────

    createPixelRainbow(rect) {
        // Create canvas for 8bit rainbow
        const canvas = document.createElement("canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = "fixed";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.zIndex = "9998";
        canvas.style.pointerEvents = "none";
        canvas.style.imageRendering = "pixelated";

        document.body.appendChild(canvas);
        const ctx = canvas.getContext("2d");

        // Disable image smoothing for true pixel art
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        // Rainbow colors in 8bit style
        const rainbowColors = [
            "#ff6b6b", // Red
            "#feca57", // Orange
            "#48dbfb", // Blue
            "#ff9ff3", // Pink
            "#54a0ff", // Light Blue
            "#5f27cd", // Purple
            "#00d2d3", // Cyan
        ];

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.4;

        let animationFrame = 0;
        const totalFrames = 60; // ~1 second at 60fps

        const animateRainbow = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const progress = animationFrame / totalFrames;
            const easeProgress =
                progress < 0.5
                    ? 2 * progress * progress
                    : 1 - 2 * (1 - progress) * (1 - progress);

            // Draw rainbow using pixel blocks instead of smooth arcs
            rainbowColors.forEach((color, colorIndex) => {
                const baseRadius = maxRadius * 0.6 + colorIndex * 12;
                const blockSize = 8; // 8x8 pixel blocks
                const maxAngle = Math.PI * easeProgress; // Arc progress

                // Calculate number of blocks needed for this arc
                const circumference = Math.PI * baseRadius;
                const blockCount = Math.floor(
                    circumference / (blockSize * 1.2),
                );

                for (let i = 0; i < blockCount; i++) {
                    const angle = (Math.PI / blockCount) * i;
                    if (angle > maxAngle) break;

                    // Calculate pixel block position for upward rainbow
                    const x = centerX + Math.cos(Math.PI - angle) * baseRadius;
                    const y = centerY - Math.sin(angle) * baseRadius; // Changed to negative for upward arc

                    // Draw pixel block
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        Math.floor(x - blockSize / 2),
                        Math.floor(y - blockSize / 2),
                        blockSize,
                        blockSize,
                    );

                    // Add inner layer for thickness
                    const innerRadius = baseRadius - blockSize;
                    if (innerRadius > 0) {
                        const innerX =
                            centerX + Math.cos(Math.PI - angle) * innerRadius;
                        const innerY = centerY - Math.sin(angle) * innerRadius; // Changed to negative for upward arc

                        ctx.fillRect(
                            Math.floor(innerX - blockSize / 2),
                            Math.floor(innerY - blockSize / 2),
                            blockSize,
                            blockSize,
                        );
                    }
                }
            });

            animationFrame++;
            if (animationFrame <= totalFrames) {
                requestAnimationFrame(animateRainbow);
            } else {
                // Fade out
                setTimeout(() => {
                    canvas.style.opacity = "0";
                    canvas.style.transition = "opacity 0.5s ease-out";
                    setTimeout(() => canvas.remove(), 500);
                }, 250);
            }
        };

        animateRainbow();
    }

    createHealingSparkles(rect) {
        const sparkleCount = 20;
        const sparkles = [];

        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement("div");
            sparkle.innerHTML = "✦";
            sparkle.style.position = "fixed";
            sparkle.style.fontSize = "12px";
            sparkle.style.color = "#ffd700";
            sparkle.style.textShadow = "0 0 6px rgba(255, 215, 0, 0.8)";
            sparkle.style.zIndex = "9997";
            sparkle.style.pointerEvents = "none";
            sparkle.style.imageRendering = "pixelated";

            // Random position around task
            const angle = (Math.PI * 2 * i) / sparkleCount;
            const distance = 60 + Math.random() * 40;
            const x = rect.left + rect.width / 2 + Math.cos(angle) * distance;
            const y = rect.top + rect.height / 2 + Math.sin(angle) * distance;

            sparkle.style.left = x + "px";
            sparkle.style.top = y + "px";
            sparkle.style.transform = "scale(0)";
            sparkle.style.transition = "all 1s ease-out";

            document.body.appendChild(sparkle);
            sparkles.push(sparkle);

            // Gentle floating animation
            setTimeout(() => {
                sparkle.style.transform = "scale(1) translateY(-20px)";
                sparkle.style.opacity = "0.8";
            }, i * 50);

            // Remove after animation
            setTimeout(() => {
                sparkle.remove();
            }, 1250);
        }
    }

    createSoftGlow() {
        // Soft healing background glow
        const glow = document.createElement("div");
        glow.style.position = "fixed";
        glow.style.top = "0";
        glow.style.left = "0";
        glow.style.width = "100vw";
        glow.style.height = "100vh";
        glow.style.background =
            "radial-gradient(circle, rgba(255, 107, 107, 0.1) 0%, rgba(254, 202, 87, 0.1) 25%, rgba(72, 219, 251, 0.1) 50%, rgba(255, 159, 243, 0.1) 75%, rgba(84, 160, 255, 0.1) 100%)";
        glow.style.zIndex = "9996";
        glow.style.pointerEvents = "none";
        glow.style.opacity = "0";
        glow.style.transition = "opacity 0.5s ease-in-out";

        document.body.appendChild(glow);

        // Fade in then out
        setTimeout(() => (glow.style.opacity = "1"), 100);
        setTimeout(() => {
            glow.style.opacity = "0";
            setTimeout(() => glow.remove(), 500);
        }, 1000);
    }

    // ── Synthwave effect sounds ────────────────────────────────────────────

    playGlitchSlideSound() {
        if (this.soundEnabled === false) return;
        try {
            if (!this.audioContext || !this.audioContextReady) return;
            if (this.audioContext.state === "suspended") this.audioContext.resume();
            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // Rapid sawtooth bursts at random frequencies (glitch stutter)
            const bursts = [
                { freq: 880,  time: 0,    dur: 0.045 },
                { freq: 220,  time: 0.06, dur: 0.045 },
                { freq: 1320, time: 0.12, dur: 0.04  },
                { freq: 165,  time: 0.18, dur: 0.07  },
            ];
            bursts.forEach((b) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(b.freq, now + b.time);
                gain.gain.setValueAtTime(0.07, now + b.time);
                gain.gain.exponentialRampToValueAtTime(0.001, now + b.time + b.dur);
                osc.start(now + b.time);
                osc.stop(now + b.time + b.dur);
            });

            // Downward sweep: digital slide-out
            const sweep = ctx.createOscillator();
            const sweepGain = ctx.createGain();
            sweep.connect(sweepGain);
            sweepGain.connect(ctx.destination);
            sweep.type = "sawtooth";
            sweep.frequency.setValueAtTime(660, now + 0.26);
            sweep.frequency.exponentialRampToValueAtTime(80, now + 0.58);
            sweepGain.gain.setValueAtTime(0.07, now + 0.26);
            sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
            sweep.start(now + 0.26);
            sweep.stop(now + 0.58);
        } catch (e) {}
    }

    playNeonWarpSound() {
        if (this.soundEnabled === false) return;
        try {
            if (!this.audioContext || !this.audioContextReady) return;
            if (this.audioContext.state === "suspended") this.audioContext.resume();
            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // Main warp sweep: 80Hz → 2400Hz (acceleration)
            const warpOsc  = ctx.createOscillator();
            const warpGain = ctx.createGain();
            warpOsc.connect(warpGain);
            warpGain.connect(ctx.destination);
            warpOsc.type = "sawtooth";
            warpOsc.frequency.setValueAtTime(80, now);
            warpOsc.frequency.exponentialRampToValueAtTime(2400, now + 0.45);
            warpGain.gain.setValueAtTime(0.08, now);
            warpGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
            warpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
            warpOsc.start(now);
            warpOsc.stop(now + 0.55);

            // Harmonic layer (sine, one octave up)
            const harmOsc  = ctx.createOscillator();
            const harmGain = ctx.createGain();
            harmOsc.connect(harmGain);
            harmGain.connect(ctx.destination);
            harmOsc.type = "sine";
            harmOsc.frequency.setValueAtTime(160, now);
            harmOsc.frequency.exponentialRampToValueAtTime(4800, now + 0.45);
            harmGain.gain.setValueAtTime(0.04, now);
            harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            harmOsc.start(now);
            harmOsc.stop(now + 0.5);

            // Bright click at warp peak
            const clickOsc  = ctx.createOscillator();
            const clickGain = ctx.createGain();
            clickOsc.connect(clickGain);
            clickGain.connect(ctx.destination);
            clickOsc.type = "sine";
            clickOsc.frequency.setValueAtTime(4000, now + 0.44);
            clickGain.gain.setValueAtTime(0.14, now + 0.44);
            clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
            clickOsc.start(now + 0.44);
            clickOsc.stop(now + 0.52);
        } catch (e) {}
    }

    playNeonBigBangSound() {
        if (this.soundEnabled === false) return;
        try {
            if (!this.audioContext || !this.audioContextReady) return;
            if (this.audioContext.state === "suspended") this.audioContext.resume();
            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // Sub bass hit (impact)
            const bassOsc  = ctx.createOscillator();
            const bassGain = ctx.createGain();
            bassOsc.connect(bassGain);
            bassGain.connect(ctx.destination);
            bassOsc.type = "sine";
            bassOsc.frequency.setValueAtTime(60, now);
            bassOsc.frequency.exponentialRampToValueAtTime(28, now + 0.3);
            bassGain.gain.setValueAtTime(0.3, now);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            bassOsc.start(now);
            bassOsc.stop(now + 0.3);

            // Rising arpeggio: sawtooth, E minor pentatonic
            [82, 123, 165, 247, 330, 494, 659].forEach((freq, i) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(freq, now + 0.05 + i * 0.1);
                gain.gain.setValueAtTime(0.09, now + 0.05 + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + i * 0.1);
                osc.start(now + 0.05 + i * 0.1);
                osc.stop(now + 0.18 + i * 0.1);
            });

            // Lead synth: sustained E5 with vibrato
            const vibratoOsc  = ctx.createOscillator();
            const vibratoGain = ctx.createGain();
            const leadOsc     = ctx.createOscillator();
            const leadGain    = ctx.createGain();
            vibratoOsc.connect(vibratoGain);
            vibratoGain.connect(leadOsc.frequency);
            leadOsc.connect(leadGain);
            leadGain.connect(ctx.destination);
            vibratoOsc.type = "sine";
            vibratoOsc.frequency.setValueAtTime(6, now + 0.75);
            vibratoGain.gain.setValueAtTime(0, now + 0.75);
            vibratoGain.gain.linearRampToValueAtTime(18, now + 1.1);
            leadOsc.type = "sawtooth";
            leadOsc.frequency.setValueAtTime(659, now + 0.75);
            leadGain.gain.setValueAtTime(0.1, now + 0.75);
            leadGain.gain.linearRampToValueAtTime(0.13, now + 0.95);
            leadGain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);
            vibratoOsc.start(now + 0.75);
            vibratoOsc.stop(now + 1.7);
            leadOsc.start(now + 0.75);
            leadOsc.stop(now + 1.7);
        } catch (e) {}
    }

    // ── Forest Bit effects ───────────────────────────────────────────────

    createLeafScatterEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const isNight = document.documentElement.getAttribute("data-theme") === "dark";
        const leafColors = isNight
            ? ["#c8e6a0", "#a0c878", "#78a050", "#f0ff80"]
            : ["#4aaa4a", "#2d6b2d", "#f9e04b", "#7acc7a"];

        // "GROW!" label
        const label = document.createElement("div");
        label.className = "effect-text";
        label.textContent = "GROW!";
        label.style.cssText = [
            "position:fixed",
            "font-size:18px",
            "font-weight:900",
            `color:${leafColors[0]}`,
            `text-shadow:1px 1px 0 rgba(0,0,0,0.4)`,
            `font-family:'Press Start 2P','Courier New',monospace`,
            `left:${rect.left + rect.width / 2 - 30}px`,
            `top:${rect.top - 28}px`,
            "z-index:100000",
            "pointer-events:none",
            "transition:opacity 0.3s ease,transform 0.3s ease",
            "letter-spacing:2px",
        ].join(";");
        document.body.appendChild(label);
        setTimeout(() => { label.style.opacity = "0"; label.style.transform = "translateY(-12px)"; }, 400);
        setTimeout(() => label.remove(), 750);

        // Main element animation
        taskElement.classList.add("leaf-scatter-effect");
        setTimeout(() => taskElement.classList.remove("leaf-scatter-effect"), 900);

        // Pixel leaf particles (4×4px squares)
        const count = 10;
        for (let i = 0; i < count; i++) {
            const leaf = document.createElement("div");
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
            const dist  = Math.random() * 60 + 30;
            const lx    = Math.cos(angle) * dist;
            const ly    = Math.random() * 60 + 50;   // always downward (gravity)
            const lr    = Math.random() * 180 - 90;
            leaf.style.cssText = [
                "position:fixed",
                `left:${centerX}px`,
                `top:${centerY}px`,
                "width:6px",
                "height:6px",
                `background:${leafColors[Math.floor(Math.random() * leafColors.length)]}`,
                "pointer-events:none",
                "z-index:99998",
                `--lx:${lx}px`,
                `--ly:${ly}px`,
                `--lr:${lr}deg`,
                `animation:leafFloat ${0.7 + Math.random() * 0.4}s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s forwards`,
            ].join(";");
            document.body.appendChild(leaf);
            setTimeout(() => leaf.remove(), 1200);
        }
    }

    createFireflyBurstEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) { this.effectLock = false; return; }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const glowColor = "#c8e6a0";

        // "BLOOM!" label
        const label = document.createElement("div");
        label.className = "effect-text";
        label.textContent = "BLOOM!";
        label.style.cssText = [
            "position:fixed",
            "font-size:20px",
            "font-weight:900",
            `color:${glowColor}`,
            `text-shadow:0 0 8px ${glowColor},0 0 20px ${glowColor}`,
            `font-family:'Press Start 2P','Courier New',monospace`,
            `left:${rect.left + rect.width / 2 - 36}px`,
            `top:${rect.top - 32}px`,
            "z-index:100000",
            "pointer-events:none",
            "transition:opacity 0.35s ease,transform 0.35s ease",
            "letter-spacing:2px",
        ].join(";");
        document.body.appendChild(label);
        setTimeout(() => { label.style.opacity = "0"; label.style.transform = "translateY(-14px)"; }, 600);
        setTimeout(() => label.remove(), 980);

        // Firefly dots (2×2px with glow)
        const fireflyCount = 9;
        for (let i = 0; i < fireflyCount; i++) {
            const ff = document.createElement("div");
            const angle = (Math.PI * 2 * i) / fireflyCount + (Math.random() - 0.5) * 0.5;
            const dist  = Math.random() * 70 + 40;
            const fx    = Math.cos(angle) * dist;
            const fy    = -(Math.random() * 60 + 30);  // float upward
            const delay = i * 0.06;
            ff.style.cssText = [
                "position:fixed",
                `left:${centerX}px`,
                `top:${centerY}px`,
                "width:4px",
                "height:4px",
                `background:${glowColor}`,
                `box-shadow:0 0 6px 3px ${glowColor}`,
                "pointer-events:none",
                "z-index:99999",
                `--fx:${fx}px`,
                `--fy:${fy}px`,
                `animation:fireflyFloat ${0.9 + Math.random() * 0.5}s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
            ].join(";");
            document.body.appendChild(ff);
            setTimeout(() => ff.remove(), 1600);
        }

        // Brief screen edge glow overlay
        const glow = document.createElement("div");
        glow.style.cssText = [
            "position:fixed",
            "inset:0",
            `background:radial-gradient(ellipse at center, transparent 40%, color-mix(in srgb, ${glowColor} 12%, transparent) 100%)`,
            "pointer-events:none",
            "z-index:99997",
            "transition:opacity 0.5s ease",
        ].join(";");
        document.body.appendChild(glow);
        setTimeout(() => { glow.style.opacity = "0"; }, 300);
        setTimeout(() => { glow.remove(); this.effectLock = false; }, 900);
    }

    playLeafScatterSound() {
        if (this.soundEnabled === false) return;
        try {
            if (!this.audioContext || !this.audioContextReady) return;
            if (this.audioContext.state === "suspended") this.audioContext.resume();
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            // 3-note bird call ascending: G4→B4→D5
            const notes = [
                { f: 392, ef: 494, t: 0.00 },
                { f: 494, ef: 587, t: 0.10 },
                { f: 587, ef: 784, t: 0.20 },
            ];
            notes.forEach(({ f, ef, t }) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(f, now + t);
                osc.frequency.linearRampToValueAtTime(ef, now + t + 0.06);
                gain.gain.setValueAtTime(0, now + t);
                gain.gain.linearRampToValueAtTime(0.055, now + t + 0.008);
                gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.14);
                osc.start(now + t); osc.stop(now + t + 0.15);
            });
        } catch (e) {}
    }

    playFireflyBurstSound() {
        if (this.soundEnabled === false) return;
        try {
            if (!this.audioContext || !this.audioContextReady) return;
            if (this.audioContext.state === "suspended") this.audioContext.resume();
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            // Full bird chorus: two phrases + sustained finish
            const phrase = (start) => {
                [[392, 494], [494, 587], [587, 784], [784, 988]].forEach(([f, ef], i) => {
                    const osc  = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(f, now + start + i * 0.09);
                    osc.frequency.linearRampToValueAtTime(ef, now + start + i * 0.09 + 0.06);
                    gain.gain.setValueAtTime(0, now + start + i * 0.09);
                    gain.gain.linearRampToValueAtTime(0.050, now + start + i * 0.09 + 0.009);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + start + i * 0.09 + 0.16);
                    osc.start(now + start + i * 0.09);
                    osc.stop(now + start + i * 0.09 + 0.17);
                });
            };
            phrase(0.00);
            phrase(0.45);
            // Held finish
            [784, 988].forEach((f, i) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(f, now + 0.95);
                gain.gain.setValueAtTime(0.040, now + 0.95);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95 + 0.55 + i * 0.12);
                osc.start(now + 0.95);
                osc.stop(now + 0.95 + 0.56 + i * 0.12);
            });
        } catch (e) {}
    }

    createButterflyFlyEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const isNight = document.documentElement.getAttribute("data-theme") === "dark";
        const wingColors = isNight
            ? ["#c8e6a0", "#a0c878", "#f0ff80"]
            : ["#4aaa4a", "#7acc7a", "#f9e04b"];

        // "FLY!" label
        const label = document.createElement("div");
        label.className = "effect-text";
        label.textContent = "FLY!";
        label.style.cssText = [
            "position:fixed",
            "font-size:18px",
            "font-weight:900",
            `color:${wingColors[0]}`,
            "text-shadow:1px 1px 0 rgba(0,0,0,0.4)",
            `font-family:'Press Start 2P','Courier New',monospace`,
            `left:${rect.left + rect.width / 2 - 22}px`,
            `top:${rect.top - 28}px`,
            "z-index:100000",
            "pointer-events:none",
            "transition:opacity 0.3s ease,transform 0.3s ease",
            "letter-spacing:2px",
        ].join(";");
        document.body.appendChild(label);
        setTimeout(() => { label.style.opacity = "0"; label.style.transform = "translateY(-12px)"; }, 400);
        setTimeout(() => label.remove(), 750);

        // 3 butterflies, each = left-wing + right-wing pixel pair
        const paths = [
            { bx: -90, by: -70, delay: 0    },
            { bx:  15, by: -95, delay: 0.10 },
            { bx:  85, by: -65, delay: 0.18 },
        ];
        paths.forEach(({ bx, by, delay }, i) => {
            const color = wingColors[i % wingColors.length];

            const leftWing = document.createElement("div");
            leftWing.style.cssText = [
                "display:inline-block", "width:6px", "height:5px",
                `background:${color}`,
                "transform-origin:right center",
                `animation:wingFlap 0.22s ease-in-out ${delay}s infinite`,
            ].join(";");

            const rightWing = document.createElement("div");
            rightWing.style.cssText = [
                "display:inline-block", "width:6px", "height:5px",
                `background:${color}`,
                "transform-origin:left center",
                `animation:wingFlap 0.22s ease-in-out ${delay + 0.11}s infinite`,
            ].join(";");

            const bf = document.createElement("div");
            bf.style.cssText = [
                "position:fixed",
                `left:${centerX}px`, `top:${centerY}px`,
                "pointer-events:none", "z-index:99999",
                "display:flex", "gap:1px", "align-items:center",
                `--bx:${bx}px`, `--by:${by}px`,
                `animation:butterflyFly ${0.9 + i * 0.08}s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
            ].join(";");
            bf.appendChild(leftWing);
            bf.appendChild(rightWing);
            document.body.appendChild(bf);
            setTimeout(() => bf.remove(), 1400);
        });
    }

    createOwlBlinkEffect(taskElement, optionalRect) {
        const isNight = document.documentElement.getAttribute("data-theme") === "dark";

        // Day mode: fall back to leaf scatter
        if (!isNight) {
            this.effectLock = false;
            this.createLeafScatterEffect(taskElement, optionalRect);
            this.playLeafScatterSound();
            return;
        }

        const rect = optionalRect || taskElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) { this.effectLock = false; return; }

        // Pixel art palette
        const eyeAmber  = "#ffc800";
        const eyeDark   = "#050f07";
        // Pixel glow: sharp double shadow, no blur gradients
        const glowBig = `0 0 0 2px ${eyeAmber}, 0 0 12px 6px rgba(255,200,0,0.7), 0 0 32px 14px rgba(255,200,0,0.3)`;
        const glowSm  = `0 0 0 1px ${eyeAmber}, 0 0 6px 3px rgba(255,200,0,0.5)`;

        // ── Overlay (near-instant for pixel snap feel) ────────────────────
        const overlay = document.createElement("div");
        overlay.style.cssText = [
            "position:fixed", "inset:0",
            "background:#020d04",
            "pointer-events:none",
            "z-index:99998",
            "opacity:0",
            "transition:opacity 0.15s steps(3)",
        ].join(";");
        document.body.appendChild(overlay);
        requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = "0.92"; }));

        // ── Helper: pixel-style eye (square, no border-radius) ───────────
        //   container clips the lid; box-shadow on ball provides glow outside
        const makeEye = (x, y, size, glowCss) => {
            const half = Math.floor(size / 2);

            // Wrapper: no overflow:hidden — lets glow bleed out
            const wrap = document.createElement("div");
            wrap.style.cssText = [
                "position:fixed",
                `left:${x - half}px`, `top:${y - half}px`,
                `width:${size}px`, `height:${size}px`,
                "pointer-events:none",
                "z-index:100000",
                "transform-origin:center center",
            ].join(";");

            // Eyeball (square pixel art)
            const ball = document.createElement("div");
            ball.style.cssText = [
                "position:absolute", "inset:0",
                `background:${eyeAmber}`,
                `box-shadow:${glowCss}`,
                "transform:scaleY(0)",
                "transform-origin:center center",
            ].join(";");

            // Pupil (square, centered)
            const ps = Math.max(4, Math.floor(size * 0.3));
            const po = Math.floor((size - ps) / 2);
            const pupil = document.createElement("div");
            pupil.style.cssText = [
                "position:absolute",
                `left:${po}px`, `top:${po}px`,
                `width:${ps}px`, `height:${ps}px`,
                "background:#1a0600",
            ].join(";");
            ball.appendChild(pupil);

            // Lid (clips from top, inside wrap, clips to eye area)
            const lidWrap = document.createElement("div");
            lidWrap.style.cssText = [
                "position:absolute", "inset:0",
                "overflow:hidden",
                "z-index:1",
            ].join(";");
            const lid = document.createElement("div");
            lid.style.cssText = [
                "position:absolute",
                "left:0", "right:0", "top:0",
                `height:${size}px`,
                `background:${eyeDark}`,
                "transform:scaleY(0)",
                "transform-origin:top center",
            ].join(";");
            lidWrap.appendChild(lid);

            wrap.appendChild(ball);
            wrap.appendChild(lidWrap);
            document.body.appendChild(wrap);
            return { wrap, ball, lid };
        };

        // ── Eyes (48px primary, 12px ambient) ────────────────────────────
        const cx = window.innerWidth  / 2;
        const cy = window.innerHeight / 2 - 10;
        const L = makeEye(cx - 36, cy, 48, glowBig);
        const R = makeEye(cx + 36, cy, 48, glowBig);
        // Two pairs of ambient forest eyes, offset into the "distance"
        const bg = [
            makeEye(cx - 130, cy + 55, 12, glowSm),
            makeEye(cx - 112, cy + 55, 12, glowSm),
            makeEye(cx + 106, cy + 70, 10, glowSm),
            makeEye(cx + 122, cy + 70, 10, glowSm),
        ];
        bg.forEach(e => { e.ball.style.opacity = "0"; });

        // ── Timeline (~2.4s total) ────────────────────────────────────────
        // t=0    overlay snaps in
        // t=120  eyes snap open (steps(4))
        // t=380  bg eyes pop in
        // t=550  gaze shift left→right (owlShift, steps(2))
        // t=900  BLINK both — lid steps(3) close, hold 120ms, steps(2) open
        // t=1500 wink L
        // t=1850 fade out (steps(2))
        // t=2100 cleanup

        // Snap open: pixel pop
        L.ball.style.animation = "owlEyeIn 0.14s steps(4) 120ms both";
        R.ball.style.animation = "owlEyeIn 0.14s steps(4) 160ms both";

        // Bg eyes pop in
        setTimeout(() => {
            bg.forEach((e, i) => {
                setTimeout(() => {
                    e.ball.style.opacity   = "0.7";
                    e.ball.style.transform = "scaleY(1)";
                    e.ball.style.animation = "owlEyeIn 0.10s steps(3) both";
                }, i * 40);
            });
        }, 380);

        // Gaze: snappy translate step
        setTimeout(() => {
            [L.wrap, R.wrap].forEach(w => {
                w.style.animation = "owlShift 0.30s steps(2) forwards";
            });
        }, 550);

        // Pixel blink helper
        const doBlink = (eyeObj, delay, closeDur, holdDur, openDur) => {
            setTimeout(() => {
                eyeObj.lid.style.animation = `owlLidClose ${closeDur}ms steps(3) forwards`;
                setTimeout(() => {
                    eyeObj.lid.style.animation = `owlLidOpen ${openDur}ms steps(2) forwards`;
                }, closeDur + holdDur);
            }, delay);
        };

        // Main blink at t=900
        doBlink(L, 900,  140, 120, 100);
        doBlink(R, 920,  140, 120, 100);

        // Wink left at t=1500
        doBlink(L, 1500, 100, 80,  80);

        // Fade out
        setTimeout(() => {
            [L.wrap, R.wrap, ...bg.map(e => e.wrap)].forEach(el => {
                el.style.animation = "";
                el.style.transition = "opacity 0.20s steps(2)";
                el.style.opacity = "0";
            });
            overlay.style.transition = "opacity 0.20s steps(2)";
            overlay.style.opacity = "0";
        }, 1850);

        // Cleanup
        setTimeout(() => {
            [overlay, L.wrap, R.wrap, ...bg.map(e => e.wrap)].forEach(el => el.remove());
            this.effectLock = false;
        }, 2100);
    }

    createGiantTreeGrowEffect(taskElement, optionalRect) {
        const rect = optionalRect || taskElement?.getBoundingClientRect?.() || { top: 0, bottom: 100, left: 0, right: 100, width: 100, height: 40 };
        const W  = window.innerWidth;
        const H  = window.innerHeight;
        const cx = W / 2;

        const LEAF = ['#2d6b2d', '#4aaa4a', '#7acc7a', '#c8e6a0', '#f9e04b'];

        const TRUNK_W = Math.round(Math.max(36, W * 0.052));
        const TRUNK_H = Math.round(H * 0.74);

        // Crown tiers: [widthPx, heightPx, leafColorIdx]  bottom → top
        const TIERS = [
            [Math.round(W * 0.30), Math.round(H * 0.12), 0],
            [Math.round(W * 0.22), Math.round(H * 0.10), 1],
            [Math.round(W * 0.14), Math.round(H * 0.09), 2],
            [Math.round(W * 0.08), Math.round(H * 0.08), 4],
        ];
        const TOTAL_CROWN_H = TIERS.reduce((s, [, h]) => s + h, 0);
        const CROWN_BASE_Y  = H - TRUNK_H;

        // effectRect from React only has {left,top,width,height} — derive bottom safely
        const cardBottom = typeof rect.bottom === 'number' ? rect.bottom : rect.top + rect.height;

        // ── Dark flash overlay ────────────────────────────────────────────
        const overlay = document.createElement('div');
        overlay.style.cssText = [
            'position:fixed', 'inset:0',
            'background:rgba(10,30,10,0.45)',
            'pointer-events:none', 'z-index:99990',
            'opacity:0', 'transition:opacity 0.08s steps(2)',
        ].join(';');
        document.body.appendChild(overlay);
        requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = '1'; }));

        // ── Trunk ─────────────────────────────────────────────────────────
        const trunk = document.createElement('div');
        trunk.style.cssText = [
            'position:fixed',
            `left:${cx - TRUNK_W / 2}px`, 'bottom:0',
            `width:${TRUNK_W}px`, `height:${TRUNK_H}px`,
            `background:repeating-linear-gradient(to right,`
                + `#4a2c0a 0%,#4a2c0a 33%,#6b4020 33%,#6b4020 66%,#4a2c0a 66%)`,
            'transform:scaleY(0)', 'transform-origin:bottom center',
            'pointer-events:none', 'z-index:99995',
        ].join(';');
        document.body.appendChild(trunk);

        // ── Crown tiers ───────────────────────────────────────────────────
        let yOffset = 0;
        const crownEls = TIERS.map(([w, h, ci]) => {
            const el = document.createElement('div');
            el.style.cssText = [
                'position:fixed',
                `left:${cx - w / 2}px`,
                `top:${CROWN_BASE_Y - yOffset - h}px`,
                `width:${w}px`, `height:${h}px`,
                `background:${LEAF[ci]}`,
                `box-shadow:inset 0 0 0 3px ${LEAF[Math.max(0, ci - 1)]}`,
                'transform:scaleY(0)', 'transform-origin:bottom center',
                'pointer-events:none', 'z-index:99996',
            ].join(';');
            document.body.appendChild(el);
            yOffset += h;
            return el;
        });

        // ── TIMELINE ──────────────────────────────────────────────────────
        // Trunk tip reaches card bottom when trunk height = (H - cardBottom).
        // Fraction of full trunk height → time offset within the 300ms growth animation.
        const trunkFraction = Math.min(1, Math.max(0, (H - cardBottom) / TRUNK_H));
        const cardHitDelay  = 30 + Math.round(300 * trunkFraction);

        // t=  0: overlay
        // t= 30: trunk shoots up
        // t=cardHit: trunk tip reaches card → card squish + launch
        // t=cardHit+160: crown bursts open
        // t=cardHit+380: GROW! label
        // t=cardHit+600: tree fades out
        // t=cardHit+800: cleanup

        // Trunk burst
        setTimeout(() => {
            trunk.style.transition = 'transform 0.30s steps(10)';
            trunk.style.transform  = 'scaleY(1)';
        }, 30);

        // Card gets hit by trunk tip → squish (CSS class) then launch (CSS class)
        // Using CSS @keyframes so animation overrides !important inline styles on the clone.
        setTimeout(() => {
            taskElement.classList.remove('tree-push-launch');
            taskElement.classList.add('tree-push-squish');

            // Effect text appears at card position on impact
            const effectText = document.createElement('div');
            effectText.className = 'effect-text';
            effectText.textContent = 'GROW!!';
            effectText.style.cssText = [
                'position:fixed',
                `left:${rect.left + rect.width / 2 - 38}px`,
                `top:${rect.top - 28}px`,
                "font-family:'Press Start 2P','Courier New',monospace",
                'font-size:18px',
                'font-weight:900',
                'color:#f9e04b',
                'text-shadow:0 0 8px #f9e04b, 2px 2px 0 #2d6b2d, -1px -1px 0 #2d6b2d',
                'letter-spacing:2px',
                'pointer-events:none',
                'z-index:100001',
                'transition:transform 0.35s steps(6), opacity 0.35s steps(4)',
            ].join(';');
            document.body.appendChild(effectText);
            // Float upward with the card
            requestAnimationFrame(() => requestAnimationFrame(() => {
                effectText.style.transform = 'translateY(-50px)';
                effectText.style.opacity   = '0';
            }));
            setTimeout(() => effectText.remove(), 500);

            setTimeout(() => {
                taskElement.classList.remove('tree-push-squish');
                taskElement.classList.add('tree-push-launch');
            }, 90);
        }, cardHitDelay);

        // Crown bursts open (bottom tier first)
        crownEls.forEach((el, i) => {
            setTimeout(() => {
                el.style.transition = 'transform 0.18s steps(5)';
                el.style.transform  = 'scaleY(1)';
            }, cardHitDelay + 160 + i * 40);
        });

        // GROW! label
        setTimeout(() => {
            const label = document.createElement('div');
            label.textContent = 'GROW!';
            const fs = Math.round(Math.max(18, TRUNK_W * 0.52));
            label.style.cssText = [
                'position:fixed',
                `left:${cx - fs * 1.5}px`,
                `top:${CROWN_BASE_Y - TOTAL_CROWN_H - fs * 1.8}px`,
                'font-family:monospace',
                `font-size:${fs}px`,
                'font-weight:bold', 'letter-spacing:3px',
                'color:#f9e04b',
                'pointer-events:none', 'z-index:100001',
                'opacity:0', 'transition:opacity 0.06s steps(2)',
            ].join(';');
            document.body.appendChild(label);
            requestAnimationFrame(() => requestAnimationFrame(() => { label.style.opacity = '1'; }));
            setTimeout(() => { label.style.opacity = '0'; }, 340);
            setTimeout(() => label.remove(), 500);
        }, cardHitDelay + 380);

        // Fade tree
        setTimeout(() => {
            [trunk, overlay, ...crownEls].forEach(el => {
                el.style.transition = 'opacity 0.16s steps(3)';
                el.style.opacity    = '0';
            });
        }, cardHitDelay + 600);

        // Cleanup (must finish before React's 1100ms clone removal)
        setTimeout(() => {
            [trunk, overlay, ...crownEls].forEach(el => el.remove());
            taskElement.classList.remove('tree-push-squish', 'tree-push-launch');
            this.effectLock = false;
        }, cardHitDelay + 800);
    }

    playGiantTreeGrowSound() {
        if (this.soundEnabled === false) return;
        try {
            if (!this.audioContext || !this.audioContextReady) return;
            if (this.audioContext.state === "suspended") this.audioContext.resume();
            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // Low-freq impact thump (roots breaking ground)
            const thump = ctx.createOscillator();
            const thumpG = ctx.createGain();
            thump.type = 'sine';
            thump.frequency.setValueAtTime(62, now);
            thump.frequency.exponentialRampToValueAtTime(28, now + 0.16);
            thumpG.gain.setValueAtTime(0.20, now);
            thumpG.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
            thump.connect(thumpG); thumpG.connect(ctx.destination);
            thump.start(now); thump.stop(now + 0.22);

            // Rising sweep — matches trunk growth (30ms → 330ms visual)
            const sweep = ctx.createOscillator();
            const sweepG = ctx.createGain();
            sweep.type = 'sine';
            sweep.frequency.setValueAtTime(170, now + 0.03);
            sweep.frequency.exponentialRampToValueAtTime(580, now + 0.36);
            sweepG.gain.setValueAtTime(0, now + 0.03);
            sweepG.gain.linearRampToValueAtTime(0.040, now + 0.08);
            sweepG.gain.exponentialRampToValueAtTime(0.001, now + 0.40);
            sweep.connect(sweepG); sweepG.connect(ctx.destination);
            sweep.start(now + 0.03); sweep.stop(now + 0.42);

            // Crown pop — 3 ascending chirps at crown burst (t≈0.34s)
            [[880, 1047], [1175, 1397], [1760, 2093]].forEach(([f, ef], i) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                const t = now + 0.36 + i * 0.07;
                osc.frequency.setValueAtTime(f, t);
                osc.frequency.linearRampToValueAtTime(ef, t + 0.06);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.046, t + 0.008);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + 0.14);
            });
        } catch(e) {}
    }

    playButterflyFlySound() {
        if (this.soundEnabled === false) return;
        try {
            if (!this.audioContext || !this.audioContextReady) return;
            if (this.audioContext.state === "suspended") this.audioContext.resume();
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            // Light, airy: 3 quick ascending chirps (high sine)
            [[880, 1046], [1046, 1175], [1175, 1397]].forEach(([f, ef], i) => {
                const osc = ctx.createOscillator(); const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(f, now + i * 0.10);
                osc.frequency.linearRampToValueAtTime(ef, now + i * 0.10 + 0.05);
                gain.gain.setValueAtTime(0, now + i * 0.10);
                gain.gain.linearRampToValueAtTime(0.042, now + i * 0.10 + 0.007);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.10 + 0.13);
                osc.start(now + i * 0.10);
                osc.stop(now + i * 0.10 + 0.14);
            });
        } catch (e) {}
    }

    playOwlBlinkSound() {
        if (this.soundEnabled === false) return;
        try {
            if (!this.audioContext || !this.audioContextReady) return;
            if (this.audioContext.state === "suspended") this.audioContext.resume();
            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // "Hoo-hoo" — great horned owl style
            // Each hoot: pitch rises on breath onset then glides down,
            // vibrato LFO at ~5.5Hz, soft upper harmonic for warmth.
            // Combo感を損なわないよう、全体長を少し短く調整。
            const hoot = (startT, baseFreq, dur) => {
                // Vibrato LFO
                const lfo = ctx.createOscillator();
                const lfoGain = ctx.createGain();
                lfo.type = "sine";
                lfo.frequency.value = 5.5;
                lfoGain.gain.value = 7; // ±7Hz pitch wobble
                lfo.connect(lfoGain);

                // Main oscillator
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                lfoGain.connect(osc.frequency);
                osc.type = "sine";
                // Breath onset: slight rise then settle and fall
                osc.frequency.setValueAtTime(baseFreq + 14, startT);
                osc.frequency.linearRampToValueAtTime(baseFreq, startT + 0.07);
                osc.frequency.linearRampToValueAtTime(baseFreq - 10, startT + dur);
                // Envelope: soft attack, flat sustain, slow tail
                gain.gain.setValueAtTime(0, startT);
                gain.gain.linearRampToValueAtTime(0.072, startT + 0.055);
                gain.gain.setValueAtTime(0.072, startT + dur * 0.55);
                gain.gain.exponentialRampToValueAtTime(0.001, startT + dur);
                osc.connect(gain);
                gain.connect(ctx.destination);

                // Upper harmonic (2×) for warmth — very quiet
                const harm = ctx.createOscillator();
                const harmGain = ctx.createGain();
                harm.type = "sine";
                harm.frequency.setValueAtTime((baseFreq + 14) * 2, startT);
                harm.frequency.linearRampToValueAtTime(baseFreq * 2, startT + 0.07);
                harm.frequency.linearRampToValueAtTime((baseFreq - 10) * 2, startT + dur);
                harmGain.gain.setValueAtTime(0, startT);
                harmGain.gain.linearRampToValueAtTime(0.016, startT + 0.055);
                harmGain.gain.setValueAtTime(0.016, startT + dur * 0.55);
                harmGain.gain.exponentialRampToValueAtTime(0.001, startT + dur);
                harm.connect(harmGain);
                harmGain.connect(ctx.destination);

                lfo.start(startT); lfo.stop(startT + dur);
                osc.start(startT); osc.stop(startT + dur);
                harm.start(startT); harm.stop(startT + dur);
            };

            // First hoot at t+260ms, second at t+880ms — 全体尺を短めに。
            hoot(now + 0.26, 278, 0.38);
            hoot(now + 0.88, 260, 0.42);
        } catch (e) {}
    }

    // ──────────────────────────────────────────────────────────────────────

    playRainbowSmashSound() {
        try {
            if (!this.audioContext || this.audioContext.state === "suspended") {
                this.initAudioContext();
                if (this.audioContext.state === "suspended") {
                    this.audioContext.resume();
                }
            }

            // Healing chiptune melody - gentle and soothing
            const healingMelody = [
                { freq: 523, time: 0, duration: 0.4 }, // C5
                { freq: 659, time: 0.2, duration: 0.4 }, // E5
                { freq: 784, time: 0.4, duration: 0.4 }, // G5
                { freq: 1047, time: 0.6, duration: 0.6 }, // C6
                { freq: 880, time: 0.9, duration: 0.4 }, // A5
                { freq: 988, time: 1.2, duration: 0.4 }, // B5
                { freq: 1047, time: 1.5, duration: 0.8 }, // C6 (sustained)
                { freq: 784, time: 2.0, duration: 0.6 }, // G5 (gentle ending)
            ];

            // Harmony layer for richness
            const harmonyMelody = [
                { freq: 330, time: 0, duration: 0.8 }, // E4
                { freq: 392, time: 0.4, duration: 0.8 }, // G4
                { freq: 523, time: 0.8, duration: 0.8 }, // C5
                { freq: 659, time: 1.2, duration: 1.2 }, // E5 (sustained)
            ];

            // Play main melody
            healingMelody.forEach((note) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(
                    note.freq,
                    this.audioContext.currentTime + note.time,
                );
                oscillator.type = "triangle"; // Softer than square wave

                const startTime = this.audioContext.currentTime + note.time;
                const endTime = startTime + note.duration;

                gainNode.gain.setValueAtTime(0.15, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

                oscillator.start(startTime);
                oscillator.stop(endTime);
            });

            // Play harmony layer
            harmonyMelody.forEach((note) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(
                    note.freq,
                    this.audioContext.currentTime + note.time,
                );
                oscillator.type = "sine"; // Even softer for harmony

                const startTime = this.audioContext.currentTime + note.time;
                const endTime = startTime + note.duration;

                gainNode.gain.setValueAtTime(0.08, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

                oscillator.start(startTime);
                oscillator.stop(endTime);
            });
        } catch (error) {
            console.log("Rainbow Smash audio not supported:", error);
        }
    }

    playFreezeSound() {
        if (this.soundEnabled === false) return;
        try {
            if (!this.audioContext || this.audioContext.state === "suspended") {
                this.initAudioContext();
                if (this.audioContext?.state === "suspended") this.audioContext.resume();
            }
            if (!this.audioContext) return;

            const ctx = this.audioContext;
            const now = ctx.currentTime;
            const freezeChime = [
                { freq: 2400, time: 0, duration: 0.12 },
                { freq: 2000, time: 0.06, duration: 0.12 },
                { freq: 1600, time: 0.12, duration: 0.18 },
                { freq: 1200, time: 0.2, duration: 0.2 },
            ];
            freezeChime.forEach((n) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(n.freq, now + n.time);
                gain.gain.setValueAtTime(0.12, now + n.time);
                gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);
                osc.start(now + n.time);
                osc.stop(now + n.time + n.duration);
            });
        } catch (e) {
            console.log("Freeze sound not supported:", e);
        }
    }

    playWorldShutdownCrtHardCut() {
        const cfg = WORLD_SHUTDOWN_CRT_CONFIG;
        if (this.isWorldShutdownPlaying) return;
        this.isWorldShutdownPlaying = true;

        const container = document.querySelector(".app-container");
        const logo = document.querySelector(".app-logo");
        if (!container || !logo) {
            this.isWorldShutdownPlaying = false;
            return;
        }

        let overlay = this._worldShutdownOverlay;
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "world-shutdown-overlay";
            overlay.setAttribute("aria-hidden", "true");
            overlay.style.background = "rgba(0,0,0,1)";
            document.body.appendChild(overlay);
            this._worldShutdownOverlay = overlay;
        }

        let noise = this._worldShutdownNoise;
        if (!noise) {
            noise = document.createElement("div");
            noise.id = "world-shutdown-noise";
            noise.setAttribute("aria-hidden", "true");
            document.body.appendChild(noise);
            this._worldShutdownNoise = noise;
        }

        let scanline = this._worldShutdownScanline;
        if (!scanline) {
            scanline = document.createElement("div");
            scanline.id = "world-shutdown-scanline";
            scanline.setAttribute("aria-hidden", "true");
            document.body.appendChild(scanline);
            this._worldShutdownScanline = scanline;
        }

        let textEl = this._worldShutdownText;
        if (!textEl) {
            textEl = document.createElement("div");
            textEl.id = "world-shutdown-text";
            textEl.setAttribute("aria-hidden", "true");
            const line1 = document.createElement("span");
            line1.className = "line1";
            line1.textContent = "CHECK: NULL";
            const line2 = document.createElement("span");
            line2.className = "line2";
            line2.textContent = "REBOOTING...";
            textEl.appendChild(line1);
            textEl.appendChild(line2);
            document.body.appendChild(textEl);
            this._worldShutdownText = textEl;
        }

        const line1El = textEl.querySelector(".line1");
        const line2El = textEl.querySelector(".line2");

        const unlock = () => {
            try {
                container.style.pointerEvents = "";
                container.style.transform = "";
                container.style.opacity = "";
                container.style.transition = "";
                container.style.transformOrigin = "";
                container.style.filter = "";
                overlay.style.opacity = "";
                overlay.style.transition = "";
                noise.style.opacity = "";
                noise.style.transition = "";
                scanline.classList.remove("scanline-animate");
                scanline.style.animation = "";
                scanline.style.opacity = "";
                scanline.style.top = "";
                if (line1El) { line1El.style.opacity = ""; line1El.style.transition = ""; }
                if (line2El) { line2El.style.opacity = ""; line2El.style.transition = ""; }
                logo.style.transform = "";
                logo.style.opacity = "";
                logo.style.transition = "";
                logo.style.transformOrigin = "";
            } catch (e) {}
            this.isWorldShutdownPlaying = false;
        };

        const visibilityCleanup = () => {
            if (document.hidden) unlock();
        };
        document.addEventListener("visibilitychange", visibilityCleanup);

        const phaseAEnd = cfg.phaseAEnd;
        const preCollapseEnd = phaseAEnd + cfg.preCollapseDurationMs;
        const collapseEnd = preCollapseEnd + cfg.collapseDurationMs;
        const lineHoldEnd = collapseEnd + cfg.lineHoldMs;
        const blackoutStart = lineHoldEnd;
        const blackoutEnd = blackoutStart + cfg.blackoutDurationMs;
        const rebootStart = blackoutEnd;

        const runScanline = () => {
            scanline.style.animation = `worldShutdownScanline ${cfg.scanlineDurationMs}ms ease-out forwards`;
            scanline.classList.add("scanline-animate");
            setTimeout(() => {
                scanline.classList.remove("scanline-animate");
            }, cfg.scanlineDurationMs);
        };

        try {
            container.style.transformOrigin = "center center";
            container.style.pointerEvents = "none";
            overlay.style.pointerEvents = "none";
            noise.style.pointerEvents = "none";
            scanline.style.pointerEvents = "none";
            textEl.style.pointerEvents = "none";

            // (A) Logo check removal 0–320ms
            logo.style.transformOrigin = "center center";
            logo.style.transition = `transform ${cfg.logoRemovalTransformMs}ms ease, opacity ${cfg.logoRemovalOpacityMs}ms ease`;
            logo.style.transform = `scale(${cfg.logoScaleEnd}) translateY(${cfg.logoTranslateY}px) rotate(${cfg.logoRotate}deg)`;
            logo.style.opacity = "0";

            // (B) Collapse 320–780ms (2-phase)
            setTimeout(() => {
                container.style.transition = `transform ${cfg.preCollapseDurationMs}ms ease-in, opacity ${cfg.preCollapseDurationMs}ms ease-in`;
                container.style.transform = `scaleY(${cfg.preCollapseScaleY})`;
                container.style.opacity = String(cfg.containerOpacityCollapse);
            }, phaseAEnd);

            setTimeout(() => {
                container.style.transition = `transform ${cfg.collapseDurationMs}ms ease-in, opacity ${cfg.collapseDurationMs}ms ease-in`;
                container.style.transform = `scaleY(${cfg.scaleYMin})`;
            }, preCollapseEnd);

            // (C) LINE STAGE 780–1040ms
            setTimeout(() => {
                container.style.filter = "brightness(1.15)";
                container.style.transition = "transform 0.06s ease";
                requestAnimationFrame(() => {
                    container.style.transform = `scaleY(${cfg.scaleYMin}) translateX(2px)`;
                    setTimeout(() => {
                        container.style.transform = `scaleY(${cfg.scaleYMin}) translateX(-1px)`;
                        setTimeout(() => {
                            container.style.transform = `scaleY(${cfg.scaleYMin})`;
                        }, 60);
                    }, 60);
                });
            }, collapseEnd);

            // (D) HARD BLACK CUT IN @1040ms (0ms instant)
            // (E) BLACKOUT HOLD — text + noise (no fade out; cut at black out)
            setTimeout(() => {
                container.style.filter = "";
                overlay.style.transition = "none";
                overlay.style.opacity = "1";
                noise.style.transition = "none";
                noise.style.opacity = String(cfg.noiseOpacity);
                if (line1El) { line1El.style.opacity = "0"; line1El.style.transition = ""; }
                if (line2El) { line2El.style.opacity = "0"; line2El.style.transition = ""; }

                if (this.soundEnabled) this.playSound("crtPowerOff");

                setTimeout(() => {
                    if (line1El) {
                        line1El.style.transition = `opacity ${cfg.textLine1FadeMs}ms ease`;
                        line1El.style.opacity = "1";
                    }
                }, cfg.textLine1DelayMs);

                setTimeout(() => {
                    if (line2El) {
                        line2El.style.transition = `opacity ${cfg.textLine2FadeMs}ms ease`;
                        line2El.style.opacity = "1";
                    }
                }, cfg.textLine2DelayMs);
            }, blackoutStart);

            // (F) HARD BLACK CUT OUT @2240ms + (G) Reboot
            setTimeout(() => {
                overlay.style.transition = "none";
                overlay.style.opacity = "0";
                noise.style.transition = "none";
                noise.style.opacity = "0";
                if (line1El) { line1El.style.opacity = "0"; line1El.style.transition = ""; }
                if (line2El) { line2El.style.opacity = "0"; line2El.style.transition = ""; }

                if (this.soundEnabled) this.playSound("crtReboot");

                container.style.transition = `transform ${cfg.rebootDurationMs}ms ease-out, opacity ${cfg.rebootDurationMs}ms ease-out`;
                container.style.transform = "scaleY(1)";
                container.style.opacity = "1";

                runScanline();
                setTimeout(() => {
                    runScanline();
                }, cfg.scanlineDurationMs + cfg.scanlineGapMs);

                // (F) Logo restore (reboot + 80ms)
                setTimeout(() => {
                    logo.style.transform = `scale(${cfg.logoReturnScaleStart})`;
                    logo.style.opacity = "0";
                    logo.style.transition = `transform ${cfg.logoReturnMs}ms ease-out, opacity ${cfg.logoReturnMs}ms ease`;
                    requestAnimationFrame(() => {
                        logo.style.transform = "scale(1)";
                        logo.style.opacity = "1";
                    });
                }, cfg.logoReturnDelayMs);
            }, rebootStart);

            setTimeout(() => {
                document.removeEventListener("visibilitychange", visibilityCleanup);
                unlock();
            }, cfg.lockInputMs);
        } catch (e) {
            document.removeEventListener("visibilitychange", visibilityCleanup);
            unlock();
        }
    }
}

// Task Animation Effects (simplified)
class TaskAnimationEffects {
    constructor() {
        this.comicEffects = new ComicEffectsManager();
    }

    animateTaskCompletion(taskElement, effectRect) {
        if (!taskElement) return;

        // Check if it's a real DOM element
        if (taskElement.nodeType !== 1) {
            console.error("TaskAnimationEffects - Not a DOM element!");
            return;
        }

        // Add subtle completion animation
        taskElement.classList.add("task-completing");

        // Animate checkbox
        const checkbox = taskElement.querySelector(".task-checkbox");
        if (checkbox) {
            checkbox.classList.add("task-checkbox-completing");
        }

        // Play random comic effect (pass effectRect so position is correct when clone isn't laid out yet)
        this.comicEffects.playRandomEffect(taskElement, effectRect);

        // Remove animation classes
        setTimeout(() => {
            taskElement.classList.remove("task-completing");
            if (checkbox) {
                checkbox.classList.remove("task-checkbox-completing");
            }
        }, 600);
    }

    animateTaskAddition(taskElement) {
        if (!taskElement) return;

        taskElement.classList.add("task-item-new");

        setTimeout(() => {
            taskElement.classList.remove("task-item-new");
        }, 300);
    }
}

// Expose to window so React (main.tsx) and vanilla (script.js) can both initialize it
window.TaskAnimationEffects = TaskAnimationEffects;
