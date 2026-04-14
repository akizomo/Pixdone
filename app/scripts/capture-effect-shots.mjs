#!/usr/bin/env node
/**
 * Capture peak-frame screenshots of every Rare/Epic effect in EFFECTS_REGISTRY
 * using Playwright against a running Vite dev server. Saves each as a PNG
 * under app/public/effect-shots/{key}.png.
 *
 * Prereqs:
 *   1. `npm run dev` is running (default http://localhost:5173 or 5174)
 *   2. Chromium is installed: `npx playwright install chromium`
 *
 * Usage:
 *   node scripts/capture-effect-shots.mjs [--url http://localhost:5174] [--only common,rare,epic]
 *
 * How it works:
 *   - Opens /__capture-effects (dev-only route, transparent background)
 *   - Waits for window.__lpCapture to be exposed
 *   - For each effect:
 *       1. Calls window.__lpCapture.fire(key) which clones the target
 *          and runs runVanillaCompletionEffect
 *       2. Waits PEAK_MS for particles to spread
 *       3. Queries the clone rect (expanded with PADDING) and screenshots it
 *       4. Waits for the engine's onDone promise before the next effect
 */

import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'public', 'effect-shots');

// Timing: how long after .fire() before we take the screenshot.
// Most effects peak between 350–650ms. Tune per effect if needed.
const PEAK_MS = 550;

// Per-effect peak override. Any effect not listed uses PEAK_MS.
// Use this for effects with delayed climaxes (e.g. bomb: 3→2→1→BOOM).
const PEAK_MS_OVERRIDES = {
  bomb: 1050,         // countdown 3→2→1→BOOM — catch the flash just before cleanup (1100ms)
  freeze: 800,        // crystallize → shatter
  giantTreeGrow: 850, // tree grows into frame late
  neonBigBang: 700,   // supernova peak
  owlBlink: 750,      // owl appears mid-frame
};

// Bounding-box padding so outward particles aren't clipped.
const PADDING = 160;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { url: null, only: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--url') out.url = args[++i];
    else if (a === '--only') out.only = args[++i].split(',').map((s) => s.trim().toLowerCase());
  }
  return out;
}

async function detectDevUrl(candidate) {
  if (candidate) return candidate;
  // Probe common ports starting from 5173.
  for (const port of [5173, 5174, 5175, 5176]) {
    try {
      const res = await fetch(`http://localhost:${port}/`, { method: 'HEAD' }).catch(() => null);
      if (res && res.ok) return `http://localhost:${port}`;
    } catch { /* ignore */ }
  }
  return 'http://localhost:5174';
}

async function main() {
  const { url: cliUrl, only } = parseArgs();
  const baseUrl = await detectDevUrl(cliUrl);
  console.log(`[capture] Using dev server: ${baseUrl}`);

  if (existsSync(OUT_DIR)) {
    await rm(OUT_DIR, { recursive: true, force: true });
  }
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1000, height: 720 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  page.on('pageerror', (err) => console.warn('[page error]', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.warn('[console]', msg.text());
  });

  const captureUrl = `${baseUrl}/__capture-effects`;
  console.log(`[capture] Navigating to ${captureUrl}`);
  await page.goto(captureUrl, { waitUntil: 'domcontentloaded' });

  // Wait until the page has exposed the capture API AND animations.js has
  // loaded (window.taskAnimationEffects is set from public/animations.js).
  await page.waitForFunction(
    () => !!window.__lpCapture && !!window.taskAnimationEffects,
    null,
    { timeout: 15_000 },
  );

  const effects = await page.evaluate(() => window.__lpCapture.effects);
  console.log(`[capture] Found ${effects.length} effects in registry`);

  const rarityFilter = only ? new Set(only) : null;
  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const effect of effects) {
    if (rarityFilter && !rarityFilter.has(effect.rarity.toLowerCase())) {
      skipped++;
      continue;
    }

    const outFile = path.join(OUT_DIR, `${effect.key}.png`);
    process.stdout.write(`[capture] ${effect.rarity.padEnd(6)} ${effect.key.padEnd(18)} → `);

    try {
      // Reset engine-level combo state BEFORE firing, so rapid captures
      // don't accumulate "COMBO x2!" / "MEGA!" banners in later screenshots.
      await page.evaluate(() => {
        const fx = window.taskAnimationEffects?.comicEffects;
        if (fx) {
          fx.comboCount = 0;
          if (fx.comboTimeout) {
            clearTimeout(fx.comboTimeout);
            fx.comboTimeout = null;
          }
        }
        document.body.classList.remove('smash-combo-active');
        document.documentElement.classList.remove('smash-combo-active');
      });

      // Fire the effect. The promise resolves when engine cleanup runs (~1100ms).
      // We screenshot BEFORE awaiting resolution.
      const firePromise = page.evaluate((key) => window.__lpCapture.fire(key), effect.key);

      // Wait for the clone to be mounted and effect to reach peak.
      await page.waitForFunction(() => !!document.querySelector('.task-effect-clone'), null, {
        timeout: 2_000,
      });
      const peakMs = PEAK_MS_OVERRIDES[effect.key] ?? PEAK_MS;
      await page.waitForTimeout(peakMs);

      // Remove any leftover combo / MEGA banners injected at <body> level
      // (they live at position:fixed top:20px and bleed into our clip).
      await page.evaluate(() => {
        document.querySelectorAll('body > div').forEach((el) => {
          const style = el instanceof HTMLElement ? el.style : null;
          if (!style) return;
          // combo banners use position:fixed + top:20px + zIndex 99999
          if (style.position === 'fixed' && style.zIndex === '99999' && !el.classList.contains('task-effect-clone')) {
            el.remove();
          }
        });
      });

      const rect = await page.evaluate(() => {
        const clone = document.querySelector('.task-effect-clone');
        if (!clone) return null;
        const r = clone.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });

      if (!rect) {
        console.log('NO_CLONE');
        failed++;
        await firePromise.catch(() => {});
        continue;
      }

      const clip = {
        x: Math.max(0, Math.floor(rect.x - PADDING)),
        y: Math.max(0, Math.floor(rect.y - PADDING)),
        width: Math.min(1000, Math.ceil(rect.width + PADDING * 2)),
        height: Math.min(720, Math.ceil(rect.height + PADDING * 2)),
      };

      await page.screenshot({
        path: outFile,
        omitBackground: true,
        clip,
      });

      // Let engine cleanup complete before the next effect.
      await firePromise.catch(() => {});
      // Small breather so consecutive clones don't collide.
      await page.waitForTimeout(150);

      console.log(`OK (${clip.width}×${clip.height})`);
      ok++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      failed++;
    }
  }

  await browser.close();

  console.log('');
  console.log(`[capture] Done. ok=${ok} skipped=${skipped} failed=${failed}`);
  console.log(`[capture] Output: ${OUT_DIR}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
