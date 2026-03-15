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
        this.effects = [
            "explode",
            "flyAway",
            "crumpleThrow",
            "shatter",
            "vanish",
            "spinOff",
            "melt",
            "tornado",
            "bounce",
            "slideLeft",
            "slideRight",
            "flip",
            "shrink",
            "stretch",
            "wobble",
            "fadeOut",
        ];
        this.superRareEffects = ["rainbowSmash", "freeze"];
        this.epicChance = 0.05; // 5% chance (shared by rainbow and freeze)
        this.rainbowSmashChance = this.epicChance;
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
                animation: rainbowSmashCard 3s ease-out forwards;
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
        `;
        document.head.appendChild(style);
    }

    // Play random effect on task completion (effectRect = optional viewport rect when clone not laid out)
    playRandomEffect(taskElement, effectRect) {
        if (this.effectLock) return;
        const random = Math.random();
        let selectedEffect;
        const params = typeof window !== "undefined" && window.location ? new URLSearchParams(window.location.search) : null;
        const forceFreeze = params && params.get("effect") === "freeze";
        const forceRainbow = params && params.get("effect") === "rainbow";

        if (forceFreeze) {
            console.log("❄️ Epic Freeze effect (forced by ?effect=freeze)");
            selectedEffect = "freeze";
        } else if (forceRainbow) {
            console.log("🌈 Rainbow Smash (forced by ?effect=rainbow)");
            selectedEffect = "rainbowSmash";
        } else if (random < this.epicChance) {
            const epicRoll = Math.random();
            if (epicRoll < 0.5) {
                console.log("❄️ Epic Freeze effect triggered!");
                selectedEffect = "freeze";
            } else {
                console.log("🌈 Super rare Rainbow Smash effect triggered!");
                selectedEffect = "rainbowSmash";
            }
        } else {
            selectedEffect =
                this.effects[Math.floor(Math.random() * this.effects.length)];
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

        if (timeSinceLastEffect < 5000) {
            // 5秒以内なら連続コンボ
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

        this.comboTimeout = setTimeout(() => {
            this.comboCount = 0;
        }, 5000);

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

        const colors = [
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

        const colors = [
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
        rainbowText.style.transition = "all 0.8s ease-out";
        rainbowText.style.imageRendering = "pixelated";
        rainbowText.style.background =
            "linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)";
        rainbowText.style.backgroundSize = "400% 400%";
        rainbowText.style.animation =
            "rainbowTextGradient 2s ease-in-out infinite";
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

        // Clean up after 3 seconds and release effect lock
        setTimeout(() => {
            taskElement.classList.remove("rainbow-smash-effect");
            rainbowText.remove();
            this.effectLock = false;
        }, 3000);
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
            penguinImageUrl: "assets/penguin.svg",
            showCracks: true,
            particles: 60,
            zIndex: 9999,
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
        const totalFrames = 120; // 2 seconds at 60fps

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
                    canvas.style.transition = "opacity 1s ease-out";
                    setTimeout(() => canvas.remove(), 1000);
                }, 500);
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
            sparkle.style.transition = "all 2s ease-out";

            document.body.appendChild(sparkle);
            sparkles.push(sparkle);

            // Gentle floating animation
            setTimeout(() => {
                sparkle.style.transform = "scale(1) translateY(-20px)";
                sparkle.style.opacity = "0.8";
            }, i * 100);

            // Remove after animation
            setTimeout(() => {
                sparkle.remove();
            }, 2500);
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
        glow.style.transition = "opacity 1s ease-in-out";

        document.body.appendChild(glow);

        // Fade in then out
        setTimeout(() => (glow.style.opacity = "1"), 100);
        setTimeout(() => {
            glow.style.opacity = "0";
            setTimeout(() => glow.remove(), 1000);
        }, 2000);
    }

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

// Expose for React app (vanilla script.js sets window.taskAnimationEffects itself)
if (typeof window !== "undefined") {
    window.TaskAnimationEffects = TaskAnimationEffects;
}
