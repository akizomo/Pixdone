// Generate every app icon (PWA, iOS, Android) from the current PixDone symbol:
// white pixel mark on the brand purple, matching favicon.png.
//
// Source mark: app/public/pixdone-symbol-white.svg (170x40). Rendered to PNG
// via Playwright (already a dev dependency — no native image binaries needed).
//
// Usage (from app/): node scripts/generate-app-icons.mjs

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = resolve(ROOT, 'public');
const IOS_ICON = resolve(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
const ANDROID_RES = resolve(ROOT, 'android/app/src/main/res');

const BRAND = '#7B61FF'; // pixdone-symbol-bland fill / favicon background

// Symbol path (viewBox 0 0 170 40), white.
const symbolSvg = readFileSync(resolve(PUBLIC, 'pixdone-symbol-white.svg'), 'utf8');
const SYMBOL_PATH = symbolSvg.match(/<path[^>]*\/>/)[0];

/**
 * @param size canvas px
 * @param ratio symbol width as a fraction of the canvas (keeps it inside mask safe zones)
 * @param bg background color, or null for transparent (Android adaptive foreground)
 */
function iconSvg(size, ratio, bg) {
  const scale = (size * ratio) / 170;
  const tx = (size - 170 * scale) / 2;
  const ty = (size - 40 * scale) / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`
    + (bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '')
    + `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(4)})">${SYMBOL_PATH}</g></svg>`;
}

const browser = await chromium.launch();
async function render(svg, size, out, { round = false, transparent = false } = {}) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const radius = round ? 'border-radius:50%;overflow:hidden;' : '';
  await page.setContent(`<!doctype html><html><head><style>*{margin:0;padding:0}html,body{background:transparent}div{width:${size}px;height:${size}px;${radius}}svg{display:block}</style></head><body><div>${svg}</div></body></html>`);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size }, omitBackground: round || transparent });
  writeFileSync(out, buf);
  await page.close();
  console.log(`wrote ${out}`);
}

try {
  // PWA / web — symbol at 62% keeps it inside the maskable safe zone (inner 80% circle).
  writeFileSync(resolve(PUBLIC, 'app-icon.svg'), iconSvg(512, 0.62, BRAND));
  for (const s of [192, 512]) await render(iconSvg(s, 0.62, BRAND), s, resolve(PUBLIC, `icon-${s}.png`));

  // iOS — single 1024 universal icon, opaque, iOS applies the squircle mask itself.
  await render(iconSvg(1024, 0.64, BRAND), 1024, IOS_ICON);

  // Android — legacy square + round launcher icons, and the adaptive-icon foreground
  // (108dp canvas, visible area is the inner 66dp; background color is set in XML).
  const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, m] of Object.entries(densities)) {
    const dir = resolve(ANDROID_RES, `mipmap-${d}`);
    const legacy = Math.round(48 * m);
    const fg = Math.round(108 * m);
    await render(iconSvg(legacy, 0.62, BRAND), legacy, resolve(dir, 'ic_launcher.png'));
    await render(iconSvg(legacy, 0.6, BRAND), legacy, resolve(dir, 'ic_launcher_round.png'), { round: true });
    await render(iconSvg(fg, 0.56, null), fg, resolve(dir, 'ic_launcher_foreground.png'), { transparent: true });
  }
  // Splash screens — symbol centered on brand purple, replacing Capacitor's default.
  // iOS: one 2732 square, aspect-filled (phones see the middle ~45% of its width).
  const splashSvg = (w, h, symbolW) => {
    const scale = symbolW / 170;
    const tx = (w - 170 * scale) / 2;
    const ty = (h - 40 * scale) / 2;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`
      + `<rect width="${w}" height="${h}" fill="${BRAND}"/>`
      + `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(4)})">${SYMBOL_PATH}</g></svg>`;
  };
  async function renderRect(svg, w, h, out) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html><head><style>*{margin:0;padding:0}svg{display:block}</style></head><body>${svg}</body></html>`);
    writeFileSync(out, await page.screenshot({ clip: { x: 0, y: 0, width: w, height: h } }));
    await page.close();
    console.log(`wrote ${out}`);
  }
  const IOS_SPLASH = resolve(ROOT, 'ios/App/App/Assets.xcassets/Splash.imageset');
  for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    await renderRect(splashSvg(2732, 2732, 500), 2732, 2732, resolve(IOS_SPLASH, name));
  }
  // Android (pre-12 / window background): keep each existing drawable's size.
  const androidSplash = {
    'drawable': [480, 320],
    'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720],
    'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280],
    'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280],
    'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
  };
  for (const [dir, [w, h]] of Object.entries(androidSplash)) {
    await renderRect(splashSvg(w, h, Math.round(Math.min(w, h) * 0.4)), w, h, resolve(ANDROID_RES, dir, 'splash.png'));
  }

  writeFileSync(
    resolve(ANDROID_RES, 'values/ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BRAND}</color>\n</resources>\n`,
  );
} finally {
  await browser.close();
}
