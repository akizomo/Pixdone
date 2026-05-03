/**
 * PixDone Quick — MAIN-world bridge
 *
 * Runs alongside animations.js in the host page's MAIN world. Listens for
 * `window.postMessage` envelopes from the content-script isolated world
 * (where the React panel lives), creates a placeholder anchor at the given
 * viewport rect, and drives the vanilla animation via the shared
 * `TaskAnimationEffects` class.
 *
 * We use `postMessage` (not `CustomEvent`) because Chrome's V8 isolation
 * makes `CustomEvent.detail` inaccessible across worlds — postMessage's
 * structured clone reliably delivers the payload.
 *
 * The placeholder is needed because the real task row lives inside our Shadow
 * DOM and isn't reachable from MAIN world. animations.js applies effect
 * classes to the anchor element, but the user-visible fireworks (particles,
 * "BAM!" text, etc.) are spawned on document.body — so they overlay the host
 * page correctly regardless of where the anchor lives.
 */

(function () {
  const MESSAGE_TAG = 'pixdone-quick:play-effect';
  const LONG_EFFECT_KEYS = new Set(['fighterLv2', 'fighterLv3', 'fighterLv4', 'fighterLv5']);

  function ensureEffects() {
    if (window.taskAnimationEffects) return window.taskAnimationEffects;
    if (typeof window.TaskAnimationEffects === 'function') {
      try {
        window.taskAnimationEffects = new window.TaskAnimationEffects();
      } catch (err) {
        console.warn('[pixdone-quick/bridge] failed to instantiate TaskAnimationEffects', err);
        return null;
      }
      return window.taskAnimationEffects;
    }
    return null;
  }

  function createPlaceholder(rect) {
    const el = document.createElement('div');
    el.setAttribute('data-pixdone-quick-placeholder', '');
    el.style.cssText = [
      'position: fixed',
      'left: ' + rect.left + 'px',
      'top: ' + rect.top + 'px',
      'width: ' + rect.width + 'px',
      'height: ' + rect.height + 'px',
      'margin: 0',
      'padding: 0',
      'pointer-events: none',
      'box-sizing: border-box',
      'z-index: 2147483600',
      'background: transparent',
    ].join('; ');
    return el;
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || data.__tag !== MESSAGE_TAG) return;

    const key = String(data.key || '');
    const left = Number(data.left);
    const top = Number(data.top);
    const width = Number(data.width);
    const height = Number(data.height);
    if (!key || !Number.isFinite(left) || !Number.isFinite(top) || width <= 0 || height <= 0) return;

    const effects = ensureEffects();
    if (!effects || !effects.comicEffects) {
      console.warn('[pixdone-quick/bridge] TaskAnimationEffects not available');
      return;
    }

    const rect = { left: left, top: top, width: width, height: height };

    // Prefer the isolated-world-provided clone (real task card with inlined
    // styles). The clone lives in the shared document, so we can find it by
    // data attribute even though it was created in the other world. Falling
    // back to a transparent placeholder still fires particles/text overlays.
    let target = null;
    let targetIsClone = false;
    if (data.cloneId) {
      target = document.querySelector(
        '[data-pixdone-quick-clone="' + String(data.cloneId).replace(/"/g, '') + '"]',
      );
      if (target) targetIsClone = true;
    }
    if (!target) {
      target = createPlaceholder(rect);
      document.body.appendChild(target);
    }

    try {
      effects.comicEffects.setActiveEffects([key]);
      effects.animateTaskCompletion(target, rect);
    } catch (err) {
      console.warn('[pixdone-quick/bridge] effect play failed', err);
    }

    const cleanupDelay = LONG_EFFECT_KEYS.has(key) ? 1550 : 1100;
    setTimeout(function () {
      // Placeholders are owned by the bridge — always remove. Clones are owned
      // by the isolated-world panel (see QuickPanelApp.handleComplete timeout)
      // so we leave them alone here.
      if (!targetIsClone && target && target.parentNode) {
        target.parentNode.removeChild(target);
      }
    }, cleanupDelay);
  });

  // Pre-instantiate so the first effect doesn't pay construction cost.
  ensureEffects();
  console.log('[pixdone-quick/bridge] MAIN-world bridge ready');
})();
