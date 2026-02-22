/**
 * Idle Rare Effect - 8-bit Penguin Animation
 * 
 * Shows a penguin sliding in from bottom-left when user is idle for 10 seconds.
 * Displays a speech bubble saying "Are you frozen?" then fades out.
 * 
 * Configuration constants:
 * - IDLE_MS: Time in milliseconds before effect triggers (default: 10000 = 10 seconds)
 * - COOLDOWN_MS: Minimum time between effect triggers (default: 90000 = 90 seconds)
 * - SHOW_MS: Duration the effect is visible (default: 5000 = 5 seconds)
 * - PROBABILITY: Probability of showing effect (0.0 to 1.0, default: 1.0 for testing)
 * - PENGUIN_ASSET_PATH: Path to penguin image asset (default: '/assets/penguin.png')
 *   Note: Place your penguin image (PNG recommended, 64x64px) at /public/assets/penguin.png
 *   If using SVG, update this path to '/assets/penguin.svg' and adjust CSS background-size if needed
 * - SPEECH_TEXT: Text to display in speech bubble (default: 'Are you frozen?')
 */

// Configuration constants
const IDLE_MS = 10000; // 10 seconds
const COOLDOWN_MS = 0; // 0 = no cooldown, repeat every 10 seconds of idle time
const SHOW_MS = 5000; // 5 seconds
const PROBABILITY = 1.0; // 1.0 = always show (for testing), change to 0.2 for 20% chance
// Use relative path to work with both dev (public/) and production (/) environments
const PENGUIN_ASSET_PATH = 'assets/penguin.svg'; // SVG format penguin asset (relative path)
const SPEECH_TEXT = () => (typeof window !== 'undefined' && typeof window.t === 'function' ? window.t('areYouFrozen') : 'Are you frozen?');

class IdleRareEffect {
    constructor() {
        this.idleTimer = null;
        this.cooldownTimer = null;
        this.isShowing = false;
        this.isPaused = false;
        this.lastTriggerTime = 0;
        this.lastActivityTime = 0; // track last user activity for idle logic
        this.overlay = null;
        this.penguin = null;
        this.bubble = null;
        this.isInitialized = false;
        
        // Bind methods to preserve 'this' context
        this.resetIdleTimer = this.resetIdleTimer.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    /**
     * Initialize the idle rare effect system
     * Idempotent - safe to call multiple times
     */
    init() {
        if (this.isInitialized) {
            console.log('[IdleRareEffect] Already initialized');
            return;
        }

        console.log('[IdleRareEffect] Initializing...');
        
        // Create overlay DOM structure
        this.createOverlay();
        
        // Setup event listeners for idle detection
        this.setupIdleDetection();
        
        // Setup visibility change handler
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Treat init as "last activity" so effect only shows after IDLE_MS of no interaction
        this.lastActivityTime = Date.now();
        // Start idle timer
        this.startIdleTimer();
        
        this.isInitialized = true;
        console.log('[IdleRareEffect] Initialized successfully');
    }

    /**
     * Create the overlay DOM structure (idempotent)
     */
    createOverlay() {
        // Check if overlay already exists
        if (document.getElementById('idle-rare-overlay')) {
            this.overlay = document.getElementById('idle-rare-overlay');
            this.penguin = document.getElementById('idle-rare-penguin');
            this.bubble = document.getElementById('idle-rare-bubble');
            return;
        }

        // Find root container (prefer .app-container, fallback to body)
        const rootContainer = document.querySelector('.app-container') || document.body;
        
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'idle-rare-overlay';
        this.overlay.className = 'idle-rare-overlay idle-hidden';
        
        // Create penguin element using img tag for better SVG support
        this.penguin = document.createElement('img');
        this.penguin.id = 'idle-rare-penguin';
        this.penguin.className = 'idle-rare-penguin';
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b664e9e2-880c-42ae-a5b0-70db45902353', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 'log_' + Date.now(),
                runId: 'debug-penguin-load',
                hypothesisId: 'H_path_resolution,H_file_existence',
                location: 'idleRareEffect.js:95',
                message: 'Setting penguin src attribute',
                data: {
                    penguinAssetPath: PENGUIN_ASSET_PATH,
                    currentUrl: window.location.href,
                    baseUrl: window.location.origin,
                    expectedFullUrl: window.location.origin + PENGUIN_ASSET_PATH
                },
                timestamp: Date.now()
            })
        }).catch(() => { });
        // #endregion
        
        this.penguin.src = PENGUIN_ASSET_PATH;
        this.penguin.alt = 'Penguin';
        this.penguin.onerror = (e) => {
            console.error('[IdleRareEffect] Failed to load penguin image from:', PENGUIN_ASSET_PATH);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b664e9e2-880c-42ae-a5b0-70db45902353', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: 'log_' + Date.now(),
                    runId: 'debug-penguin-load',
                    hypothesisId: 'H_path_resolution,H_file_existence',
                    location: 'idleRareEffect.js:98',
                    message: 'Penguin image load error',
                    data: {
                        penguinAssetPath: PENGUIN_ASSET_PATH,
                        errorType: e.type,
                        targetSrc: e.target ? e.target.src : null,
                        currentSrc: this.penguin.currentSrc,
                        naturalWidth: this.penguin.naturalWidth,
                        naturalHeight: this.penguin.naturalHeight
                    },
                    timestamp: Date.now()
                })
            }).catch(() => { });
            // #endregion
        };
        this.penguin.onload = () => {
            console.log('[IdleRareEffect] Penguin image loaded successfully from:', PENGUIN_ASSET_PATH);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b664e9e2-880c-42ae-a5b0-70db45902353', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: 'log_' + Date.now(),
                    runId: 'debug-penguin-load',
                    hypothesisId: 'H_path_resolution,H_file_existence',
                    location: 'idleRareEffect.js:101',
                    message: 'Penguin image loaded successfully',
                    data: {
                        penguinAssetPath: PENGUIN_ASSET_PATH,
                        currentSrc: this.penguin.currentSrc,
                        naturalWidth: this.penguin.naturalWidth,
                        naturalHeight: this.penguin.naturalHeight,
                        complete: this.penguin.complete
                    },
                    timestamp: Date.now()
                })
            }).catch(() => { });
            // #endregion
        };
        
        // Create speech bubble element
        this.bubble = document.createElement('div');
        this.bubble.id = 'idle-rare-bubble';
        this.bubble.className = 'idle-rare-bubble';
        this.bubble.textContent = typeof SPEECH_TEXT === 'function' ? SPEECH_TEXT() : SPEECH_TEXT;
        
        // Append elements
        this.overlay.appendChild(this.penguin);
        this.overlay.appendChild(this.bubble);
        rootContainer.appendChild(this.overlay);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b664e9e2-880c-42ae-a5b0-70db45902353', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 'log_' + Date.now(),
                runId: 'debug-penguin-load',
                hypothesisId: 'H_path_resolution,H_file_existence',
                location: 'idleRareEffect.js:108',
                message: 'Overlay created and appended to DOM',
                data: {
                    penguinSrc: this.penguin.src,
                    penguinCurrentSrc: this.penguin.currentSrc,
                    penguinComplete: this.penguin.complete,
                    penguinNaturalWidth: this.penguin.naturalWidth,
                    penguinNaturalHeight: this.penguin.naturalHeight,
                    overlayInDOM: this.overlay.parentNode !== null,
                    penguinInDOM: this.penguin.parentNode !== null,
                    rootContainer: rootContainer.tagName + (rootContainer.id ? '#' + rootContainer.id : '') + (rootContainer.className ? '.' + rootContainer.className.split(' ')[0] : '')
                },
                timestamp: Date.now()
            })
        }).catch(() => { });
        // #endregion
        
        console.log('[IdleRareEffect] Overlay created');
    }

    /**
     * Setup event listeners for idle detection
     * Use capture phase so activity is detected even if other code calls stopPropagation
     */
    setupIdleDetection() {
        const events = ['mousemove', 'mousedown', 'mouseup', 'keydown', 'keyup', 'touchstart', 'touchmove', 'touchend', 'scroll', 'click', 'input'];
        
        events.forEach(eventType => {
            document.addEventListener(eventType, this.resetIdleTimer, { passive: true, capture: true });
        });
        
        console.log('[IdleRareEffect] Idle detection listeners setup');
    }

    /**
     * Reset the idle timer when user interacts
     */
    resetIdleTimer() {
        this.lastActivityTime = Date.now();
        if (this.isPaused) {
            return;
        }
        if (this.isShowing) {
            this.clearIdleTimer();
            return;
        }
        this.clearIdleTimer();
        this.startIdleTimer();
    }

    /**
     * Start the idle timer
     */
    startIdleTimer() {
        if (this.isPaused || this.isShowing) {
            return;
        }
        
        this.clearIdleTimer();
        
        this.idleTimer = setTimeout(() => {
            this.checkAndShowEffect();
        }, IDLE_MS);
        
        console.log(`[IdleRareEffect] Idle timer started (${IDLE_MS}ms)`);
    }

    /**
     * Clear the idle timer
     */
    clearIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    /**
     * Check if any modal/overlay is currently displayed
     */
    isModalOpen() {
        return !!(
            document.querySelector('.modal-overlay.active') ||
            document.querySelector('.task-bottom-sheet.open') ||
            document.querySelector('.celebration-overlay.active')
        );
    }

    /**
     * Check if effect should be shown and trigger it
     * Only show when user has been idle for at least IDLE_MS since last activity
     */
    checkAndShowEffect() {
        // Don't show if already showing
        if (this.isShowing) {
            return;
        }
        
        const now = Date.now();
        const idleDuration = now - this.lastActivityTime;
        if (idleDuration < IDLE_MS) {
            const remaining = IDLE_MS - idleDuration;
            this.idleTimer = setTimeout(() => this.checkAndShowEffect(), remaining);
            return;
        }
        
        // Check cooldown
        const timeSinceLastTrigger = now - this.lastTriggerTime;
        if (timeSinceLastTrigger < COOLDOWN_MS) {
            console.log(`[IdleRareEffect] Cooldown active (${COOLDOWN_MS - timeSinceLastTrigger}ms remaining)`);
            this.startIdleTimer();
            return;
        }
        
        // Check probability gate
        if (Math.random() > PROBABILITY) {
            console.log('[IdleRareEffect] Probability gate blocked effect');
            this.startIdleTimer();
            return;
        }
        
        // Check if tab is visible
        if (document.hidden) {
            console.log('[IdleRareEffect] Tab hidden, skipping effect');
            this.startIdleTimer();
            return;
        }
        
        // Don't show when a modal is open
        if (this.isModalOpen()) {
            console.log('[IdleRareEffect] Modal open, skipping effect');
            this.startIdleTimer();
            return;
        }
        
        // Show the effect
        this.showEffect();
    }

    /**
     * Show the idle rare effect
     */
    showEffect() {
        if (this.isShowing || !this.overlay || !this.penguin || !this.bubble) {
            return;
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b664e9e2-880c-42ae-a5b0-70db45902353', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 'log_' + Date.now(),
                runId: 'debug-penguin-load',
                hypothesisId: 'H_css_display',
                location: 'idleRareEffect.js:220',
                message: 'Before showing effect - penguin state',
                data: {
                    penguinSrc: this.penguin.src,
                    penguinCurrentSrc: this.penguin.currentSrc,
                    penguinComplete: this.penguin.complete,
                    penguinNaturalWidth: this.penguin.naturalWidth,
                    penguinNaturalHeight: this.penguin.naturalHeight,
                    penguinDisplay: window.getComputedStyle(this.penguin).display,
                    penguinVisibility: window.getComputedStyle(this.penguin).visibility,
                    penguinOpacity: window.getComputedStyle(this.penguin).opacity,
                    penguinLeft: window.getComputedStyle(this.penguin).left,
                    overlayDisplay: window.getComputedStyle(this.overlay).display,
                    overlayClasses: this.overlay.className,
                    penguinClasses: this.penguin.className
                },
                timestamp: Date.now()
            })
        }).catch(() => { });
        // #endregion
        
        console.log('[IdleRareEffect] Showing effect');
        this.isShowing = true;
        this.lastTriggerTime = Date.now();
        
        // Reset classes
        this.overlay.classList.remove('idle-hidden', 'idle-out');
        this.penguin.classList.remove('idle-penguin-in', 'idle-penguin-out');
        this.bubble.classList.remove('idle-bubble-in', 'idle-bubble-out');
        // Reset transform
        this.penguin.style.transform = '';
        
        // Force reflow to ensure classes are applied
        this.overlay.offsetHeight;
        
        // Show overlay
        this.overlay.classList.remove('idle-hidden');
        
        // #region agent log
        setTimeout(() => {
            fetch('http://127.0.0.1:7242/ingest/b664e9e2-880c-42ae-a5b0-70db45902353', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: 'log_' + Date.now(),
                    runId: 'debug-penguin-load',
                    hypothesisId: 'H_css_display',
                    location: 'idleRareEffect.js:240',
                    message: 'After removing idle-hidden - penguin state',
                    data: {
                        penguinSrc: this.penguin.src,
                        penguinCurrentSrc: this.penguin.currentSrc,
                        penguinComplete: this.penguin.complete,
                        penguinNaturalWidth: this.penguin.naturalWidth,
                        penguinNaturalHeight: this.penguin.naturalHeight,
                        penguinDisplay: window.getComputedStyle(this.penguin).display,
                        penguinVisibility: window.getComputedStyle(this.penguin).visibility,
                        penguinOpacity: window.getComputedStyle(this.penguin).opacity,
                        penguinLeft: window.getComputedStyle(this.penguin).left,
                        overlayDisplay: window.getComputedStyle(this.overlay).display,
                        overlayClasses: this.overlay.className,
                        penguinClasses: this.penguin.className
                    },
                    timestamp: Date.now()
                })
            }).catch(() => { });
        }, 100);
        // #endregion
        
        // Trigger penguin slide-in animation
        setTimeout(() => {
            this.penguin.classList.add('idle-penguin-in');
        }, 10);
        
        // Trigger bubble fade-in animation (after penguin starts moving)
        setTimeout(() => {
            this.bubble.classList.add('idle-bubble-in');
        }, 300);
        
        // Hide effect after SHOW_MS
        setTimeout(() => {
            this.hideEffect();
        }, SHOW_MS);
    }

    /**
     * Hide the idle rare effect
     */
    hideEffect() {
        if (!this.isShowing || !this.overlay) {
            return;
        }
        
        console.log('[IdleRareEffect] Hiding effect');
        
        // Fade out speech bubble first
        this.bubble.classList.add('idle-bubble-out');
        this.bubble.classList.remove('idle-bubble-in');
        
        // Then slide penguin back out (flipped to face left)
        setTimeout(() => {
            this.penguin.classList.add('idle-penguin-out');
            this.penguin.classList.remove('idle-penguin-in');
        }, 100); // Small delay for bubble fade
        
        // Remove animation classes and hide overlay after slide-out completes
        setTimeout(() => {
            this.overlay.classList.add('idle-hidden');
            this.penguin.classList.remove('idle-penguin-in', 'idle-penguin-out');
            this.bubble.classList.remove('idle-bubble-in', 'idle-bubble-out');
            // Reset transform
            this.penguin.style.transform = '';
            
            this.isShowing = false;
            
            // Restart idle timer
            this.startIdleTimer();
        }, 900); // Match CSS slide-out duration (800ms) + buffer
    }

    /**
     * Handle visibility change (pause/resume timers)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Tab hidden - pause
            console.log('[IdleRareEffect] Tab hidden, pausing');
            this.isPaused = true;
            this.clearIdleTimer();
            
            // If effect is showing, hide it
            if (this.isShowing) {
                this.hideEffect();
            }
        } else {
            // Tab visible - resume; treat as fresh so idle is measured from now
            console.log('[IdleRareEffect] Tab visible, resuming');
            this.isPaused = false;
            this.lastActivityTime = Date.now();
            this.startIdleTimer();
        }
    }

    /**
     * Cleanup and destroy the effect system
     */
    destroy() {
        console.log('[IdleRareEffect] Destroying...');
        
        // Clear timers
        this.clearIdleTimer();
        if (this.cooldownTimer) {
            clearTimeout(this.cooldownTimer);
            this.cooldownTimer = null;
        }
        
        // Remove event listeners
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(eventType => {
            document.removeEventListener(eventType, this.resetIdleTimer);
        });
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Remove overlay
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Reset state
        this.overlay = null;
        this.penguin = null;
        this.bubble = null;
        this.isShowing = false;
        this.isPaused = false;
        this.isInitialized = false;
        
        console.log('[IdleRareEffect] Destroyed');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.pixDoneApp) {
            // Wait for app to be initialized
            setTimeout(() => {
                window.idleRareEffect = new IdleRareEffect();
                window.idleRareEffect.init();
            }, 1000);
        } else {
            // Fallback: initialize directly
            window.idleRareEffect = new IdleRareEffect();
            window.idleRareEffect.init();
        }
    });
} else {
    // DOM already ready
    setTimeout(() => {
        window.idleRareEffect = new IdleRareEffect();
        window.idleRareEffect.init();
    }, 1000);
}
