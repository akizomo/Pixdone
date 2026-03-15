/**
 * Task completion effects.
 * runVanillaCompletionEffect: uses vanilla animations.js (ComicEffectsManager) for parity.
 * playTaskCompleteEffect: legacy React-only effect (kept for fallback if vanilla not loaded).
 */

export interface EffectRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

declare global {
  interface Window {
    taskAnimationEffects?: {
      animateTaskCompletion: (taskElement: HTMLElement, effectRect: EffectRect) => void;
    };
  }
}

function getRectWithTransformCompensation(taskElement: HTMLElement): EffectRect {
  const rect = taskElement.getBoundingClientRect();
  const cs = window.getComputedStyle(taskElement);
  let tx = 0;
  let ty = 0;
  const tf = cs?.transform ?? 'none';
  if (tf && tf !== 'none') {
    const m2 = tf.match(/^matrix\(([^)]+)\)$/);
    if (m2) {
      const parts = m2[1].split(',').map((s) => parseFloat(s.trim()));
      if (parts.length === 6 && Number.isFinite(parts[4]) && Number.isFinite(parts[5])) {
        tx = parts[4];
        ty = parts[5];
      }
    } else {
      const m3 = tf.match(/^matrix3d\(([^)]+)\)$/);
      if (m3) {
        const parts = m3[1].split(',').map((s) => parseFloat(s.trim()));
        if (parts.length === 16 && Number.isFinite(parts[12]) && Number.isFinite(parts[13])) {
          tx = parts[12];
          ty = parts[13];
        }
      }
    }
  }
  return {
    left: rect.left - tx,
    top: rect.top - ty,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Run the same completion effect as vanilla: clone with .completed, position fixed,
 * animateTaskCompletion (ComicEffectsManager), hide original, call onDone, cleanup after ~1100ms.
 */
export function runVanillaCompletionEffect(
  taskEl: HTMLElement | null,
  onDone: () => void
): void {
  if (!taskEl?.nodeType || taskEl.nodeType !== 1) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[runVanillaCompletionEffect] No valid taskEl');
    }
    onDone();
    return;
  }

  const taskRect = getRectWithTransformCompensation(taskEl);
  if (taskRect.width === 0 || taskRect.height === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[runVanillaCompletionEffect] Zero rect', taskRect);
    }
    onDone();
    return;
  }

  if (!window.taskAnimationEffects) {
    if (typeof window.TaskAnimationEffects !== 'undefined') {
      window.taskAnimationEffects = new window.TaskAnimationEffects();
    }
    if (!window.taskAnimationEffects) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[runVanillaCompletionEffect] taskAnimationEffects not available. Ensure /freeze-effect.js and /animations.js load before the app.');
      }
      onDone();
      return;
    }
  }

  // Hide original immediately so only the clone is visible (pseudo-morph effect)
  try {
    taskEl.style.visibility = 'hidden';
  } catch {
    // ignore
  }

  const effectCloneBase = taskEl.cloneNode(true) as HTMLElement;
  effectCloneBase.classList.add('completed');

  // Make clone look checked: React uses button[role="checkbox"] (no .task-checkbox class)
  const cloneCheckbox = effectCloneBase.querySelector('.task-checkbox') ?? effectCloneBase.querySelector('button[role="checkbox"]');
  if (cloneCheckbox instanceof HTMLElement) {
    cloneCheckbox.classList.add('completed');
    cloneCheckbox.setAttribute('aria-checked', 'true');
    cloneCheckbox.style.borderColor = 'var(--pd-color-accent-default)';
    cloneCheckbox.style.background = 'var(--pd-color-accent-default)';
    if (!cloneCheckbox.textContent?.trim()) {
      const check = document.createElement('span');
      check.setAttribute('aria-hidden', 'true');
      check.style.cssText = 'font-size: 0.875rem; line-height: 1;';
      check.textContent = '✓';
      cloneCheckbox.appendChild(check);
    }
  }

  // Completed look for title (muted + strikethrough) — task body is second child (flex:1) > first span
  const taskBody = effectCloneBase.children[1];
  const titleSpan = taskBody?.querySelector('span');
  if (titleSpan instanceof HTMLElement) {
    titleSpan.style.color = 'var(--pd-color-text-muted)';
    titleSpan.style.textDecoration = 'line-through';
  }

  const left = taskRect.left;
  const top = taskRect.top;
  const width = taskRect.width;
  const height = taskRect.height;

  effectCloneBase.classList.add('task-effect-clone');
  // Append effect styles so we keep the clone's original layout (display:flex, padding, etc.)
  const existingStyle = effectCloneBase.getAttribute('style') ?? '';
  const effectStyles = [
    'position: fixed !important',
    `left: ${left}px !important`,
    `top: ${top}px !important`,
    `width: ${width}px !important`,
    `height: ${height}px !important`,
    'margin: 0 !important',
    'pointer-events: none !important',
    'visibility: visible !important',
    'z-index: 99999 !important',
    'box-sizing: border-box !important',
    'opacity: 1 !important',
    'min-width: 0 !important',
    'overflow: hidden !important',
  ].join('; ');
  effectCloneBase.setAttribute('style', existingStyle ? `${existingStyle}; ${effectStyles}` : effectStyles);
  document.body.appendChild(effectCloneBase);

  document.body.classList.add('task-effect-playing');
  document.documentElement.classList.add('task-effect-playing');

  const effectRect: EffectRect = { left, top, width, height };
  window.taskAnimationEffects.animateTaskCompletion(effectCloneBase, effectRect);

  setTimeout(() => {
    if (effectCloneBase.parentNode) {
      effectCloneBase.remove();
    }
    if (taskEl.parentNode) {
      taskEl.style.visibility = '';
    }
    document.body.classList.remove('task-effect-playing');
    document.documentElement.classList.remove('task-effect-playing');
    onDone();
  }, 1100);
}

// --- Legacy React-only effect (used when vanilla not available or mobile) ---

const EFFECTS = [
  { cls: 'pd-effect-flyaway', dur: 1800, label: 'GONE!' },
  { cls: 'pd-effect-bounce', dur: 1200, label: 'DONE!' },
  { cls: 'pd-effect-vanish', dur: 1000, label: 'POOF!' },
  { cls: 'pd-effect-explode', dur: 1500, label: 'BOOM!' },
  { cls: 'pd-effect-slideleft', dur: 1300, label: 'CLEAR!' },
] as const;

export function playTaskCompleteEffect(taskEl: HTMLElement, onDone: () => void): void {
  const effect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
  const rect = taskEl.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    onDone();
    return;
  }

  const clone = taskEl.cloneNode(true) as HTMLElement;
  clone.className = 'pd-effect-clone';
  clone.style.top = `${rect.top}px`;
  clone.style.left = `${rect.left}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  document.body.appendChild(clone);

  void clone.offsetHeight;
  clone.classList.add(effect.cls);

  taskEl.style.visibility = 'hidden';

  const label = document.createElement('div');
  label.className = 'pd-effect-label';
  label.textContent = effect.label;
  label.style.top = `${rect.top - 10}px`;
  label.style.left = `${rect.left + rect.width / 2 - 30}px`;
  document.body.appendChild(label);

  const cleanup = () => {
    clone.remove();
    label.remove();
    onDone();
  };
  setTimeout(cleanup, effect.dur + 50);
}
