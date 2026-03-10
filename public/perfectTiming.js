/**
 * Perfect Timing - Long-press minigame for task completion
 * PixDone: Hold 350ms to enter timing mode; release to judge. All results complete the task.
 */
(function (global) {
    'use strict';

    const config = {
        holdThresholdMs: 350,
        /** ゲージ速度の候補（毎回ランダムに1つ適用して慣れを防ぐ） */
        indicatorSpeedOptions: [320, 400, 480],
        barWidth: 200,
        zoneWidth: { good: 0.25, great: 0.15, perfect: 0.08 },
    };

    let state = {
        active: false,
        taskId: null,
        taskElement: null,
        checkbox: null,
        holdTimer: null,
        rafId: null,
        overlay: null,
        indicator: null,
        indicatorPos: 0,
        indicatorDir: 1,
        /** 今回のゲージ速度（indicatorSpeedOptions からランダム選択） */
        indicatorSpeedPxPerSec: 400,
        startTime: 0,
        completedTap: false,
    };

    function ensureOverlay() {
        if (state.overlay && document.body.contains(state.overlay)) return state.overlay;
        const overlay = document.createElement('div');
        overlay.className = 'perfect-timing-overlay';
        overlay.innerHTML = `
            <div class="perfect-timing-bar">
                <div class="perfect-timing-indicator"></div>
                <div class="perfect-timing-zone perfect-timing-zone-good"></div>
                <div class="perfect-timing-zone perfect-timing-zone-great"></div>
                <div class="perfect-timing-zone perfect-timing-zone-perfect"></div>
            </div>
        `;
        state.overlay = overlay;
        state.indicator = overlay.querySelector('.perfect-timing-indicator');
        return overlay;
    }

    function closeOverlay() {
        if (state.rafId) {
            cancelAnimationFrame(state.rafId);
            state.rafId = null;
        }
        if (state.holdTimer) {
            clearTimeout(state.holdTimer);
            state.holdTimer = null;
        }
        if (state.overlay && state.overlay.parentNode) {
            state.overlay.remove();
        }
        state.active = false;
        state.taskId = null;
        state.taskElement = null;
        state.checkbox = null;
    }

    function judgeZone() {
        const barWidth = config.barWidth;
        const center = state.indicatorPos + 8;
        const normalized = center / barWidth;
        const pw = config.zoneWidth.perfect;
        const gw = config.zoneWidth.great;
        const go = config.zoneWidth.good;
        const mid = 0.5;
        if (normalized >= mid - pw / 2 && normalized <= mid + pw / 2) return 'perfect';
        if (normalized >= mid - gw / 2 && normalized <= mid + gw / 2) return 'great';
        if (normalized >= mid - go / 2 && normalized <= mid + go / 2) return 'good';
        return 'miss';
    }

    function tickIndicator(t) {
        if (!state.active || !state.indicator) return;
        const prevDir = state.indicatorDir;
        state.indicatorPos += state.indicatorDir * state.indicatorSpeedPxPerSec * 0.016;
        if (state.indicatorPos <= 0) {
            state.indicatorPos = 0;
            state.indicatorDir = 1;
            if (prevDir !== 1 && typeof global.comicEffects?.playSound === 'function') {
                global.comicEffects.playSound('perfectTimingGaugeTick');
            }
        } else if (state.indicatorPos >= config.barWidth - 16) {
            state.indicatorPos = config.barWidth - 16;
            state.indicatorDir = -1;
            if (prevDir !== -1 && typeof global.comicEffects?.playSound === 'function') {
                global.comicEffects.playSound('perfectTimingGaugeTick');
            }
        }
        state.indicator.style.left = state.indicatorPos + 'px';
        state.rafId = requestAnimationFrame(tickIndicator);
    }

    function positionOverlay(rect) {
        if (!state.overlay) return;
        const bar = state.overlay.querySelector('.perfect-timing-bar');
        const cx = rect.left + rect.width / 2;
        const top = rect.top - 60;
        state.overlay.style.left = Math.max(16, Math.min(window.innerWidth - config.barWidth - 32, cx - config.barWidth / 2)) + 'px';
        state.overlay.style.top = Math.max(16, top) + 'px';
        const zoneGood = state.overlay.querySelector('.perfect-timing-zone-good');
        const zoneGreat = state.overlay.querySelector('.perfect-timing-zone-great');
        const zonePerfect = state.overlay.querySelector('.perfect-timing-zone-perfect');
        const w = config.barWidth;
        const mid = w / 2;
        zoneGood.style.left = (mid - w * config.zoneWidth.good / 2) + 'px';
        zoneGood.style.width = (w * config.zoneWidth.good) + 'px';
        zoneGreat.style.left = (mid - w * config.zoneWidth.great / 2) + 'px';
        zoneGreat.style.width = (w * config.zoneWidth.great) + 'px';
        zonePerfect.style.left = (mid - w * config.zoneWidth.perfect / 2) + 'px';
        zonePerfect.style.width = (w * config.zoneWidth.perfect) + 'px';
    }

    function onRelease(completeTask) {
        if (!state.active) return;
        const result = judgeZone();
        const taskElement = state.taskElement;
        const checkbox = state.checkbox;
        const taskId = state.taskId;
        closeOverlay();
        const rect = taskElement ? taskElement.getBoundingClientRect() : { left: window.innerWidth / 2 - 24, top: window.innerHeight / 2 - 24, width: 48, height: 48 };
        if (global.PerfectTimingEffects) {
            global.PerfectTimingEffects.playCompleteEffect({
                result,
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                anchorRect: rect,
                checkbox,
                taskElement,
            });
        }
        if (typeof completeTask === 'function') {
            completeTask(taskId, taskElement, true, result);
        }
    }

    function onPointerDown(e, getTaskInfo, completeTask) {
        const cb = e.target.closest('.task-checkbox');
        if (!cb) return;
        const taskCard = cb.closest('.task-card, .task-item');
        const taskId = taskCard?.dataset?.taskId;
        if (!taskId) return;

        e.preventDefault();
        e.stopPropagation();

        // 完了済みの場合はタップで未完了に戻す（PerfectTimingは不要）
        if (cb.classList.contains('completed')) {
            state.taskId = taskId;
            state.taskElement = taskCard;
            state.checkbox = cb;
            state.completedTap = true;
            return;
        }

        const info = typeof getTaskInfo === 'function' ? getTaskInfo(taskId) : null;
        if (info && info.disabled) return;

        state.taskId = taskId;
        state.taskElement = taskCard;
        state.checkbox = cb;

        state.holdTimer = setTimeout(() => {
            state.holdTimer = null;
            state.active = true;
            const opts = config.indicatorSpeedOptions;
            state.indicatorSpeedPxPerSec = opts[Math.floor(Math.random() * opts.length)];
            const overlay = ensureOverlay();
            const rect = taskCard.getBoundingClientRect();
            positionOverlay(rect);
            document.body.appendChild(overlay);
            state.indicatorPos = 0;
            state.indicatorDir = 1;
            state.startTime = performance.now();
            tickIndicator(state.startTime);
        }, config.holdThresholdMs);
    }

    function onPointerUp(e, completeTask) {
        if (!state.taskId && !state.holdTimer) return;

        if (state.completedTap) {
            const cb = state.checkbox;
            const taskCard = state.taskElement;
            const taskId = state.taskId;
            const releasedOnCheckbox = cb && (e.target === cb || cb.contains(e.target));
            state.taskId = null;
            state.taskElement = null;
            state.checkbox = null;
            state.completedTap = false;
            if (releasedOnCheckbox && taskId && typeof completeTask === 'function') {
                completeTask(taskId, taskCard, false);
            }
            return;
        }

        if (state.holdTimer) {
            clearTimeout(state.holdTimer);
            state.holdTimer = null;
            const cb = state.checkbox;
            const taskCard = state.taskElement;
            const taskId = state.taskId;
            state.taskId = null;
            state.taskElement = null;
            state.checkbox = null;
            const releasedOnCheckbox = cb && (e.target === cb || cb.contains(e.target));
            if (releasedOnCheckbox && taskId && typeof completeTask === 'function') {
                completeTask(taskId, taskCard, false);
            }
        } else if (state.active) {
            onRelease(completeTask);
        }
    }

    function onPointerCancel(e) {
        if (state.holdTimer || state.active || state.completedTap) {
            closeOverlay();
            state.taskId = null;
            state.taskElement = null;
            state.checkbox = null;
            state.completedTap = false;
        }
    }

    let _getTaskInfo = null;
    let _completeTask = null;

    function setup(getTaskInfo, completeTask) {
        _getTaskInfo = getTaskInfo;
        _completeTask = completeTask;
        document.addEventListener('pointerdown', (e) => {
            if (!e.target.closest('.task-checkbox')) return;
            onPointerDown(e, getTaskInfo, completeTask);
        }, { passive: false });

        document.addEventListener('pointerup', (e) => {
            if (state.taskId || state.holdTimer) onPointerUp(e, completeTask);
        }, { passive: false });

        document.addEventListener('pointercancel', (e) => {
            onPointerCancel(e);
        }, { passive: false });

        // When overlay was opened by keyboard (e.g. Space long-press), release Space to judge
        document.addEventListener('keyup', (e) => {
            if (!state.active) return;
            const isSpace = (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) && !e.ctrlKey && !e.altKey && !e.metaKey;
            if (!isSpace) return;
            e.preventDefault();
            onRelease(completeTask);
        }, true);
    }

    /**
     * Open the Perfect Timing overlay for a task programmatically (e.g. from FAB long-press).
     * Release is handled by the global pointerup listener.
     * @param {string} taskId
     * @param {HTMLElement} taskElement
     * @returns {boolean} true if opened, false if task is disabled or PT not ready
     */
    function openForTask(taskId, taskElement) {
        if (!_getTaskInfo || !_completeTask) return false;
        const info = _getTaskInfo(taskId);
        if (info && info.disabled) return false;
        const checkbox = taskElement ? taskElement.querySelector('.task-checkbox') : null;
        state.taskId = taskId;
        state.taskElement = taskElement;
        state.checkbox = checkbox;
        state.active = true;
        const opts = config.indicatorSpeedOptions;
        state.indicatorSpeedPxPerSec = opts[Math.floor(Math.random() * opts.length)];
        const overlay = ensureOverlay();
        const rect = taskElement ? taskElement.getBoundingClientRect() : { left: window.innerWidth / 2 - 24, top: window.innerHeight / 2 - 60, width: 48, height: 48 };
        positionOverlay(rect);
        document.body.appendChild(overlay);
        state.indicatorPos = 0;
        state.indicatorDir = 1;
        state.startTime = performance.now();
        tickIndicator(state.startTime);
        return true;
    }

    global.PerfectTimingManager = {
        setup,
        closeOverlay,
        openForTask,
        config,
    };
})(typeof window !== 'undefined' ? window : this);
