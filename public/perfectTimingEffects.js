/**
 * Perfect Timing - Result-specific effects (MISS/GOOD/GREAT/PERFECT)
 * PixDone: Effects only vary by result; task always completes.
 */
(function (global) {
    'use strict';

    const config = {
        particles: { miss: 0, good: 12, great: 24, perfect: 44 },
        lowSpecParticles: { good: 6, great: 12, perfect: 22 },
    };

    function getParticleCount(result) {
        const base = config.particles[result] ?? 0;
        const low = config.lowSpecParticles[result];
        const lowSpec = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        return lowSpec && low !== undefined ? low : base;
    }

    const textStyles = {
        miss: { color: '#9aa0a6', fontSize: '18px', scaleIn: 0.9, scaleOut: 0.85 },
        good: { color: '#fbbc04', fontSize: '22px', scaleIn: 1.1, scaleOut: 0.95 },
        great: { color: '#34a853', fontSize: '28px', scaleIn: 1.2, scaleOut: 0.95 },
        perfect: { color: '#ffd700', fontSize: '36px', scaleIn: 1.3, scaleOut: 0.95 },
    };

    function showResultText(text, x, y, anchorRect, result = 'good') {
        const style = textStyles[result] || textStyles.good;
        const el = document.createElement('div');
        el.textContent = text;
        el.className = 'perfect-timing-result-text perfect-timing-result-' + result;
        el.style.position = 'fixed';
        el.style.fontSize = style.fontSize;
        el.style.fontWeight = 'bold';
        el.style.color = style.color;
        el.style.textShadow = '2px 2px 0px #000, -2px -2px 0px #fff';
        el.style.fontFamily = "'VT323', monospace";
        el.style.zIndex = '10001';
        el.style.pointerEvents = 'none';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.transition = 'all 0.3s steps(3, end)';
        el.style.imageRendering = 'pixelated';

        let left = x;
        let top = y - 24;
        if (anchorRect) {
            if (left < 40) left = 40;
            if (left > window.innerWidth - 40) left = window.innerWidth - 40;
            if (top < 40) top = 40;
            if (top > window.innerHeight - 40) top = window.innerHeight - 40;
        }
        el.style.left = left + 'px';
        el.style.top = top + 'px';

        document.body.appendChild(el);
        const scaleIn = result === 'miss' ? 1 : style.scaleIn;
        requestAnimationFrame(() => {
            el.style.transform = `translate(-50%, -50%) scale(${scaleIn})`;
        });
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = `translate(-50%, -50%) scale(${style.scaleOut})`;
            setTimeout(() => el.remove(), 400);
        }, result === 'miss' ? 600 : 800);
    }

    function animateIcon(checkbox, type) {
        if (!checkbox) return;
        const specs = {
            miss: [{ t: 60, s: 0.96 }, { t: 120, s: 1 }, true ],
            good: [{ t: 90, s: 1.1 }, { t: 180, s: 1 }, false ],
            great: [{ t: 90, s: 1.14 }, { t: 200, s: 1 }, false ],
        };
        const seq = specs[type];
        if (!seq) return;
        const wobble = seq[2];
        const start = performance.now();
        const run = (now) => {
            const elapsed = now - start;
            let scale, rotate = 0;
            if (elapsed < seq[0].t) {
                const p = elapsed / seq[0].t;
                scale = 1 + (seq[0].s - 1) * p;
                if (wobble) rotate = Math.sin(elapsed * 0.15) * 3;
            } else if (elapsed < seq[1].t) {
                const p = (elapsed - seq[0].t) / (seq[1].t - seq[0].t);
                scale = seq[0].s + (1 - seq[0].s) * p;
                if (wobble) rotate = Math.sin(elapsed * 0.1) * 2 * (1 - p);
            } else {
                checkbox.style.transform = 'scale(1)';
                return;
            }
            checkbox.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
            requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
    }

    function createParticles(count, rect, opts = {}) {
        const { speedMin = 140, speedMax = 320, gravity = 700, life = 240, squareRatio = 1 } = opts;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = speedMin + Math.random() * (speedMax - speedMin);
            const vx = (Math.cos(angle) * speed) / 60;
            const vy = (Math.sin(angle) * speed) / 60 - (speed * 0.3) / 60;
            const span = document.createElement('span');
            span.className = 'perfect-timing-particle';
            span.style.position = 'fixed';
            span.style.left = cx + 'px';
            span.style.top = cy + 'px';
            span.style.width = '6px';
            span.style.height = '6px';
            span.style.background = ['#ff6b6b', '#feca57', '#48dbfb', '#34a853'][i % 4];
            span.style.borderRadius = Math.random() > squareRatio ? '50%' : '0';
            span.style.pointerEvents = 'none';
            span.style.zIndex = '10000';
            document.body.appendChild(span);
            particles.push({ el: span, x: cx, y: cy, vx, vy, life, t: 0 });
        }
        let lastTime = performance.now();
        const animate = (now) => {
            const dt = Math.min(0.05, (now - lastTime) / 1000);
            lastTime = now;
            let allDone = true;
            particles.forEach((p) => {
                if (p.t >= p.life) {
                    p.el.remove();
                    return;
                }
                allDone = false;
                p.vy += (gravity * 0.016) * (dt / 0.016);
                p.x += p.vx * 60 * dt;
                p.y += p.vy * 60 * dt;
                p.el.style.left = p.x + 'px';
                p.el.style.top = p.y + 'px';
                p.t += dt * 1000;
                p.el.style.opacity = Math.max(0, 1 - p.t / p.life);
            });
            if (!allDone) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    function createRing(rect, opts = {}) {
        const {
            delay = 0,
            life = 400,
            scaleFrom = 0.4,
            scaleTo = 2.2,
            alphaFrom = 0.5,
            borderColor = 'rgba(255,107,107,0.8)',
            borderWidth = 3,
        } = opts;
        const ring = document.createElement('div');
        ring.className = 'perfect-timing-ring';
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        ring.style.position = 'fixed';
        ring.style.left = cx + 'px';
        ring.style.top = cy + 'px';
        ring.style.width = '48px';
        ring.style.height = '48px';
        ring.style.marginLeft = '-24px';
        ring.style.marginTop = '-24px';
        ring.style.border = `${borderWidth}px solid ${borderColor}`;
        ring.style.borderRadius = '50%';
        ring.style.transformOrigin = '50% 50%';
        ring.style.transform = `scale(${scaleFrom})`;
        ring.style.opacity = alphaFrom;
        ring.style.pointerEvents = 'none';
        ring.style.zIndex = '9999';
        ring.style.transition = 'none';
        document.body.appendChild(ring);
        setTimeout(() => {
            ring.style.transition = `transform ${life}ms ease-out, opacity ${life}ms ease-out`;
            ring.style.transform = `scale(${scaleTo})`;
            ring.style.opacity = '0';
            setTimeout(() => ring.remove(), life + 50);
        }, delay);
    }

    function animateTaskCard(taskElement, result) {
        if (!taskElement || taskElement.nodeType !== 1) return;
        taskElement.dataset.perfectTimingResult = result;

        const rect = taskElement.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        taskElement.style.transformOrigin = `${centerX}px ${centerY}px`;

        const specs = {
            miss: {
                flash: 'rgba(0,0,0,0.25)',
                finalBg: '#5f6368',
                duration: 150,
                scaleSteps: [{ t: 0, s: 0.98 }, { t: 150, s: 1 }],
                boxShadow: '',
            },
            good: {
                flash: 'rgba(251,188,4,0.4)',
                finalBg: '#8bc34a',
                duration: 250,
                scaleSteps: [{ t: 0, s: 1 }, { t: 80, s: 1.05 }, { t: 250, s: 1 }],
                boxShadow: '',
            },
            great: {
                flash: 'rgba(76,175,80,0.6)',
                finalBg: '#4caf50',
                duration: 350,
                scaleSteps: [{ t: 0, s: 1 }, { t: 100, s: 1.1 }, { t: 350, s: 1 }],
                boxShadow: '',
            },
            perfect: {
                flash: 'rgba(255,215,0,0.5)',
                finalBg: '#388e3c',
                duration: 450,
                scaleSteps: [{ t: 0, s: 1 }, { t: 120, s: 1.2 }, { t: 450, s: 1.02 }],
                boxShadow: '0 0 0 2px rgba(255,215,0,0.4), 2px 2px 0px var(--shadow-color, rgba(0,0,0,0.3))',
            },
        };
        const spec = specs[result] || specs.good;
        const origTransition = taskElement.style.transition;
        const origBoxShadow = taskElement.style.boxShadow;

        const transDur = 120;
        taskElement.style.transition = `background ${spec.duration}ms ease-out, transform ${transDur}ms ease-out, box-shadow ${spec.duration}ms ease-out`;
        taskElement.style.background = spec.flash;
        taskElement.style.transform = `scale(${spec.scaleSteps[0].s})`;

        const steps = spec.scaleSteps;
        for (let i = 1; i < steps.length; i++) {
            const step = steps[i];
            setTimeout(() => {
                if (taskElement.parentNode) {
                    taskElement.style.transform = `scale(${step.s})`;
                }
            }, step.t);
        }

        setTimeout(() => {
            if (taskElement.parentNode) {
                taskElement.style.background = spec.finalBg;
                taskElement.style.boxShadow = spec.boxShadow || origBoxShadow || '2px 2px 0px var(--shadow-color, rgba(0,0,0,0.3))';
            }
        }, 60);

        setTimeout(() => {
            if (taskElement.parentNode) {
                taskElement.style.transition = origTransition || '';
                taskElement.style.background = spec.finalBg;
                const finalScale = result === 'perfect' ? 1.02 : 1;
                taskElement.style.transform = `scale(${finalScale})`;
                taskElement.style.boxShadow = spec.boxShadow || origBoxShadow || '';
            }
        }, spec.duration + 100);
    }

    function playMiss(checkbox, rect, taskElement) {
        const darkFlash = document.createElement('div');
        darkFlash.className = 'perfect-timing-flash';
        darkFlash.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.15);pointer-events:none;z-index:9998;animation:perfectTimingFlash 100ms ease-out forwards;';
        document.body.appendChild(darkFlash);
        setTimeout(() => darkFlash.remove(), 120);
        animateIcon(checkbox, 'miss');
        if (taskElement) animateTaskCard(taskElement, 'miss');
        showResultText('MISS', rect.left + rect.width / 2, rect.top + rect.height / 2, rect, 'miss');
        if (typeof global.comicEffects?.playSound === 'function') {
            global.comicEffects.playSound('perfectTimingMiss');
        }
    }

    function playGood(checkbox, rect, taskElement) {
        animateIcon(checkbox, 'good');
        createRing(rect, {
            life: 400, scaleFrom: 0.45, scaleTo: 2.0, alphaFrom: 0.55,
            borderColor: 'rgba(251,188,4,0.6)', borderWidth: 3
        });
        createParticles(getParticleCount('good'), rect, { speedMin: 120, speedMax: 280, gravity: 0, life: 220 });
        if (taskElement) animateTaskCard(taskElement, 'good');
        showResultText('GOOD', rect.left + rect.width / 2, rect.top + rect.height / 2, rect, 'good');
        if (typeof global.comicEffects?.playSound === 'function') {
            global.comicEffects.playSound('perfectTimingGood');
        }
        if (navigator.vibrate) navigator.vibrate([8]);
    }

    function playGreat(checkbox, rect, taskElement) {
        const lightFlash = document.createElement('div');
        lightFlash.className = 'perfect-timing-flash';
        lightFlash.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.05);pointer-events:none;z-index:9998;animation:perfectTimingFlash 80ms ease-out forwards;';
        document.body.appendChild(lightFlash);
        setTimeout(() => lightFlash.remove(), 100);
        animateIcon(checkbox, 'great');
        createRing(rect, {
            delay: 0, life: 450, scaleFrom: 0.4, scaleTo: 2.3, alphaFrom: 0.6,
            borderColor: 'rgba(52,168,83,0.7)', borderWidth: 4
        });
        createRing(rect, {
            delay: 50, life: 450, scaleFrom: 0.35, scaleTo: 2.5, alphaFrom: 0.5,
            borderColor: 'rgba(52,168,83,0.5)', borderWidth: 3
        });
        createParticles(getParticleCount('great'), rect, {
            speedMin: 180, speedMax: 420, gravity: 0, life: 300, squareRatio: 0.75
        });
        if (taskElement) animateTaskCard(taskElement, 'great');
        showResultText('GREAT', rect.left + rect.width / 2, rect.top + rect.height / 2, rect, 'great');
        if (typeof global.comicEffects?.playSound === 'function') {
            global.comicEffects.playSound('perfectTimingGreat');
        }
        if (navigator.vibrate) navigator.vibrate([12]);
    }

    function playPerfectCrack(checkbox, rect, taskElement) {
        const app = document.querySelector('.app-container') || document.body;
        app.style.transform = 'scale(0.995)';
        app.style.transition = 'transform 40ms ease-out';
        setTimeout(() => {
            app.style.transform = 'scale(1)';
            app.style.transition = '';
        }, 40);

        const flash = document.createElement('div');
        flash.className = 'perfect-timing-flash';
        flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.18);pointer-events:none;z-index:9998;animation:perfectTimingFlash 80ms ease-out forwards;';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 100);

        const crack = document.createElement('div');
        crack.className = 'perfect-timing-crack';
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        crack.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:64px;height:64px;margin:-32px 0 0 -32px;background:radial-gradient(circle at 30% 30%, transparent 40%, rgba(255,255,255,0.9) 70%);border:2px solid rgba(100,100,100,0.6);border-radius:50%;transform:rotate(${(Math.random() - 0.5) * 24}deg);pointer-events:none;z-index:9999;opacity:0;transition:opacity 60ms ease-out;`;
        document.body.appendChild(crack);
        requestAnimationFrame(() => { crack.style.opacity = '1'; });
        setTimeout(() => {
            crack.style.transition = 'opacity 360ms ease-out';
            crack.style.opacity = '0';
            setTimeout(() => crack.remove(), 400);
        }, 60);

        createRing(rect, {
            delay: 20, life: 500, scaleFrom: 0.35, scaleTo: 2.5, alphaFrom: 0.7,
            borderColor: 'rgba(255,215,0,0.8)', borderWidth: 4
        });
        createRing(rect, {
            delay: 60, life: 500, scaleFrom: 0.3, scaleTo: 2.7, alphaFrom: 0.55,
            borderColor: 'rgba(255,215,0,0.6)', borderWidth: 3
        });
        createRing(rect, {
            delay: 100, life: 500, scaleFrom: 0.25, scaleTo: 2.9, alphaFrom: 0.4,
            borderColor: 'rgba(255,215,0,0.4)', borderWidth: 3
        });
        createParticles(getParticleCount('perfect'), rect, {
            speedMin: 220, speedMax: 520, gravity: 0, life: 320, squareRatio: 0.7
        });
        if (taskElement) animateTaskCard(taskElement, 'perfect');
        showResultText('PERFECT', rect.left + rect.width / 2, rect.top + rect.height / 2, rect, 'perfect');
        if (typeof global.comicEffects?.playSound === 'function') {
            global.comicEffects.playSound('perfectTimingPerfect');
        }
        if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    }

    function playCompleteEffect(opts) {
        const { result, x, y, anchorRect, checkbox, taskElement } = opts;
        const rect = anchorRect || { left: x - 24, top: y - 24, width: 48, height: 48 };
        if (result === 'miss') playMiss(checkbox, rect, taskElement);
        else if (result === 'good') playGood(checkbox, rect, taskElement);
        else if (result === 'great') playGreat(checkbox, rect, taskElement);
        else if (result === 'perfect') playPerfectCrack(checkbox, rect, taskElement);
    }

    global.PerfectTimingEffects = {
        playCompleteEffect,
        showResultText,
        playMiss,
        playGood,
        playGreat,
        playPerfectCrack,
        config,
    };
})(typeof window !== 'undefined' ? window : this);
