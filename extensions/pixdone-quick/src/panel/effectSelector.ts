/**
 * Random effect selection for PixDone Quick — gated by free / paid tier.
 *
 * Per the PixDone Quick spec:
 *   - Free users: COMMON effects only
 *   - Paid users: COMMON + RARE + EPIC (challenge effects excluded since
 *     `ownedChallengeEffects` requires a Firestore round-trip we don't yet
 *     wire up in the extension; web app keeps showing those)
 *
 * Probability stays in lock-step with the web app for paid users
 * (`weightedRandomEffect`: EPIC ~10% / RARE ~33% / COMMON rest). Free users
 * draw uniformly from the COMMON pool — there's no need to rarity-weight a
 * single-tier pool.
 *
 * `isPremium` is sourced from the auth payload synced by the web app at
 * sign-in (see `ExtensionLinkPage.buildAuthPayload`).
 */
import type { ThemeKey } from '@app/design-system/themes/themeRegistry';
import {
  COMMON_EFFECTS,
  EFFECTS_REGISTRY,
  buildDrawPool,
  weightedRandomEffect,
} from '@app/data/effectsRegistry';

export interface EffectSelectionContext {
  isPremium: boolean;
  visualTheme: ThemeKey;
}

const DEFAULT_CONTEXT: EffectSelectionContext = {
  isPremium: false,
  visualTheme: 'arcade',
};

export function pickRandomEffectKey(
  ctx: EffectSelectionContext = DEFAULT_CONTEXT,
): string | undefined {
  // Free users: only COMMON keys are activated. `buildDrawPool` then keeps
  // those that pass the `access === 'free_unlocked'` filter.
  // Paid users: every effect key is activated. `buildDrawPool` admits free +
  // premium-gated effects (challenge-gated stay out via `ownedChallengeEffects=[]`).
  const activatedKeys = ctx.isPremium
    ? EFFECTS_REGISTRY.map((e) => e.key)
    : COMMON_EFFECTS.map((e) => e.key);
  const pool = buildDrawPool(ctx.isPremium, ctx.visualTheme, activatedKeys);
  if (pool.length === 0) return undefined;
  return weightedRandomEffect(pool).key;
}

/**
 * Post a message to the MAIN-world bridge (src/main-world/bridge.js). Using
 * `window.postMessage` (not `CustomEvent`) because Chrome's isolated-world
 * boundary makes `CustomEvent.detail` unreadable from MAIN world — postMessage
 * uses structured clone and crosses reliably.
 *
 * Rect coords are in viewport (fixed) pixels. When `cloneId` is provided, the
 * bridge animates that existing DOM element (found via data-attribute) so the
 * user sees the cloned task card scale/fade/shatter. When omitted the bridge
 * falls back to spawning a transparent placeholder — particles still fire but
 * the card-level visual morph is absent.
 */
export function dispatchPlayEffect(
  key: string,
  rect: { left: number; top: number; width: number; height: number },
  cloneId?: string,
): void {
  window.postMessage(
    {
      __tag: 'pixdone-quick:play-effect',
      key,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      cloneId: cloneId ?? null,
    },
    '*',
  );
}

/**
 * Build a full-fidelity card clone of the task row by copying every computed
 * style onto inline `style=""` attributes on each descendant. Because our
 * panel renders inside a Shadow DOM, a plain `cloneNode(true)` appended to
 * `document.body` loses all styling (CSS selectors can't cross the shadow
 * boundary). Inlining the resolved `window.getComputedStyle()` values gives
 * us a pixel-equivalent clone that renders correctly anywhere in the host
 * document — matching what `app/src/services/taskAnimations.ts`
 * (`runVanillaCompletionEffect`) does natively on the global DOM.
 *
 * The clone is positioned fixed at the source rect, marked `.completed` and
 * tagged with `data-pixdone-quick-clone` so the MAIN-world bridge can find it
 * and drive the vanilla animation on the REAL card (not a placeholder).
 *
 * Returns the generated clone ID (caller must append the element to
 * `document.body` and remove it when done — we keep the caller in control of
 * lifecycle so error paths can restore the hidden original).
 */
export interface BuiltEffectClone {
  el: HTMLElement;
  id: string;
}

// Curated list of CSS properties to copy onto each clone descendant. The
// previous implementation iterated `getComputedStyle().length` (~500 props)
// which is fine for correctness but stalls the event loop for ~50ms before
// the first animation frame can render. Keeping the property set minimal
// (visual + layout, no obscure properties like `block-size` or `view-
// transition-name`) is the difference between a snappy effect and one that
// feels delayed compared to the main app.
const CLONE_CSS_PROPERTIES = [
  // Layout
  'display', 'flex-direction', 'align-items', 'justify-content', 'gap',
  'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-wrap',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'box-sizing', 'overflow',
  // Visual
  'background', 'background-color', 'background-image',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-color', 'border-style', 'border-width', 'border-radius',
  'box-shadow', 'opacity',
  // Typography
  'color', 'font-family', 'font-size', 'font-weight', 'font-style',
  'line-height', 'letter-spacing', 'text-align', 'text-decoration',
  'text-overflow', 'white-space', 'word-break', 'overflow-wrap',
  // Pixel-art rendering
  'image-rendering',
] as const;

export function buildEffectClone(
  src: HTMLElement,
  rect: { left: number; top: number; width: number; height: number },
): BuiltEffectClone {
  const clone = src.cloneNode(true) as HTMLElement;
  const id = `pixdone-quick-clone-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  clone.dataset.pixdoneQuickClone = id;
  clone.setAttribute('aria-hidden', 'true');

  // Resolve theme-driven colors at the source (still in shadow DOM where the
  // `--pd-*` custom properties are defined). The clone gets appended to
  // document.body where those vars are NOT defined, so we have to bake the
  // resolved RGB values into the inline overrides — otherwise `var(...)`
  // fallback chains would surface and the checkbox/title colors would drift
  // from what the user sees in the panel.
  const srcStyle = window.getComputedStyle(src);
  const accentColor =
    srcStyle.getPropertyValue('--pd-color-accent-default').trim() || '#7b61ff';
  const accentTextColor =
    srcStyle.getPropertyValue('--pd-color-accent-text').trim() || '#ffffff';
  const mutedColor =
    srcStyle.getPropertyValue('--pd-color-text-muted').trim() || '#9aa0a6';
  // Pull the resolved body font from the source so the ✓ glyph renders in the
  // panel's pixel font (Handjet) instead of whatever the host page has set on
  // its own `span` selectors. Without this, sites that style spans with serif
  // fonts produce a thin elegant ✓ that visibly clashes with the pixel-art UI.
  const checkboxSrc = src.querySelector<HTMLElement>('.task-checkbox');
  const checkboxFontFamily = checkboxSrc
    ? window.getComputedStyle(checkboxSrc).fontFamily
    : srcStyle.fontFamily;

  // Copy computed styles from the shadow-rooted source onto the clone tree.
  // Walk both trees in parallel; `cloneNode(true)` guarantees matching order.
  const srcTree: HTMLElement[] = [src, ...Array.from(src.querySelectorAll<HTMLElement>('*'))];
  const cloneTree: HTMLElement[] = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];
  const len = Math.min(srcTree.length, cloneTree.length);
  for (let i = 0; i < len; i++) {
    const s = srcTree[i]!;
    const c = cloneTree[i]!;
    const cs = window.getComputedStyle(s);
    let declarations = '';
    for (const prop of CLONE_CSS_PROPERTIES) {
      const value = cs.getPropertyValue(prop);
      if (value) declarations += `${prop}:${value};`;
    }
    c.setAttribute('style', declarations);
  }

  // Mark as visually completed — mirrors `runVanillaCompletionEffect` in the
  // web app. TaskItem renders the checkbox as a `<button role="checkbox">`
  // styled by `.task-checkbox--checked`. Since we've just inlined the
  // UNCHECKED computed styles above, we have to override the checkbox's
  // border/background back to the accent color, and add the ✓ mark element.
  clone.classList.add('completed');
  const checkbox =
    clone.querySelector<HTMLElement>('button[role="checkbox"]') ??
    clone.querySelector<HTMLElement>('.task-checkbox');
  if (checkbox) {
    checkbox.setAttribute('aria-checked', 'true');
    checkbox.classList.add('task-checkbox--checked');
    checkbox.style.setProperty('background-color', accentColor, 'important');
    checkbox.style.setProperty('background', accentColor, 'important');
    checkbox.style.setProperty('border-color', accentColor, 'important');
    checkbox.style.setProperty('color', accentTextColor, 'important');
    if (!checkbox.querySelector('.task-checkbox__mark')) {
      const tick = document.createElement('span');
      tick.className = 'task-checkbox__mark';
      tick.setAttribute('aria-hidden', 'true');
      tick.textContent = '✓';
      // Match TaskItem.css `.task-checkbox__mark` exactly: font-size sm,
      // line-height 1 — and inherit font-family from the panel's pixel font
      // so the glyph shape matches the main app instead of the host page's
      // default body font.
      tick.style.cssText =
        `font-family:${checkboxFontFamily};` +
        `color:${accentTextColor};` +
        `font-size:0.875rem;` +
        `line-height:1;` +
        `font-weight:700;`;
      checkbox.appendChild(tick);
    }
  }

  // Muted + strikethrough title — TaskItem uses BEM `.task-item__title`, NOT
  // any of the kebab-singular variants. Without the right selector the title
  // stayed the same color through the effect, breaking parity with the web
  // app's "completed" appearance.
  const title = clone.querySelector<HTMLElement>('.task-item__title');
  if (title) {
    title.style.setProperty('color', mutedColor, 'important');
    title.style.setProperty('text-decoration', 'line-through', 'important');
  }

  // Position fixed at the source rect. Append these declarations AFTER the
  // inlined computed styles so they win.
  const existing = clone.getAttribute('style') ?? '';
  const positioning = [
    'position:fixed',
    `left:${rect.left}px`,
    `top:${rect.top}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    'margin:0',
    'pointer-events:none',
    'z-index:9998',
    'box-sizing:border-box',
    'visibility:visible',
    'opacity:1',
    'will-change:transform,opacity,filter',
  ].join(';');
  clone.setAttribute('style', `${existing};${positioning}`);

  return { el: clone, id };
}
