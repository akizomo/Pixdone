import { useEffect, useRef } from 'react';
import { EFFECTS_REGISTRY } from '../data/effectsRegistry';
import { runVanillaCompletionEffect } from '../services/taskAnimations';
import type { EffectDef } from '../data/effectsRegistry';
import './EffectCapturePage.css';

/**
 * Dev-only capture page used by scripts/capture-effect-shots.mjs.
 *
 * Navigate to /__capture-effects in dev. The page:
 *   1. Renders a fixed task-row target at a known screen position.
 *   2. Exposes `window.__lpCapture = { effects, fire(key), target }` so a
 *      Playwright driver can drive the capture loop from Node.
 *   3. Has a transparent background so `page.screenshot({ omitBackground })`
 *      yields a PNG with alpha.
 *
 * NEVER use in prod — the route branch in App.tsx should be dev-only.
 */

interface CaptureAPI {
  effects: Array<{ key: string; name: string; rarity: EffectDef['rarity'] }>;
  /**
   * Fires the given effect on the capture target. Resolves when the engine's
   * onDone callback fires (~1100ms after start). Callers should screenshot
   * BEFORE the resolve, typically 400–700ms after calling fire.
   */
  fire: (effectKey: string) => Promise<void>;
  getCloneRect: () => DOMRect | null;
}

declare global {
  interface Window {
    __lpCapture?: CaptureAPI;
  }
}

export function EffectCapturePage() {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Make body/html transparent so omitBackground works.
    const prevHtmlBg = document.documentElement.style.background;
    const prevBodyBg = document.body.style.background;
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';

    const api: CaptureAPI = {
      effects: EFFECTS_REGISTRY.map((e) => ({ key: e.key, name: e.name, rarity: e.rarity })),
      fire: (effectKey: string) => new Promise<void>((resolve) => {
        const el = targetRef.current;
        if (!el) return resolve();
        el.style.visibility = '';
        runVanillaCompletionEffect(
          el,
          () => resolve(),
          effectKey,
        );
      }),
      getCloneRect: () => {
        const clone = document.querySelector<HTMLElement>('.task-effect-clone');
        return clone ? clone.getBoundingClientRect() : null;
      },
    };

    window.__lpCapture = api;

    return () => {
      document.documentElement.style.background = prevHtmlBg;
      document.body.style.background = prevBodyBg;
      delete window.__lpCapture;
    };
  }, []);

  return (
    <div
      className="effect-capture__row-1"
    >
      {/* Fixed-size task target at viewport center. The engine clones this
          and positions the clone at its current rect. Give it room around
          so outward particles have space before the screenshot clip. */}
      <div
        ref={targetRef}
        className="task-item effect-capture__text-1"
      >
        <button
          type="button"
          role="checkbox"
          aria-checked="false"
          className="effect-capture__box-1"
        />
        <div className="effect-capture__box-2">
          <span>Finish the report</span>
        </div>
      </div>
      <div
        className="effect-capture__text-2"
      >
        Effect capture — drive via window.__lpCapture from Playwright
      </div>
    </div>
  );
}
