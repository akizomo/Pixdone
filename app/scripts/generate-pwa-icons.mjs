// Generate PWA / TWA app icons (icon-192.png, icon-512.png) from the PixDone
// pixel-mark, recolored for the dark brand background and laid out within the
// maskable safe zone.
//
// Source mark: app/public/PixDone.svg (286x285 pixel-art: rounded square frame
// + checkmark, black-on-white). We recolor it white-on-dark with an accent
// checkmark and render to PNG via Playwright (already a dev dependency — no
// native image binaries required).
//
// Usage: node app/scripts/generate-pwa-icons.mjs

import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '../public');

// Brand tokens (from manifest / tokens)
const BG = '#0A0A22';        // background_color / theme_color
const FRAME = '#FFFFFF';     // main pixel frame
const FRAME_SHADOW = '#8A86B8'; // dim 3D edge of the frame
const CHECK = '#7B61FF';     // accent — checkmark up/down stroke
const CHECK_HI = '#A593FF';  // accent highlight on the checkmark

// Pixel grid: each cell is 15px in the 286x285 source viewBox.
// The mark content occupies roughly x:31..256, y:30..255 (center ~143.5,142.5).

// Checkmark stroke cells (originally black) — recolor to accent.
const CHECK_CELLS = new Set([
  '61,165', '76,180', '91,195',
  '106,180', '121,165', '136,150', '151,135', '166,120', '181,105',
]);
// Checkmark highlight cells (originally #D0D0D0) — recolor to lighter accent.
const CHECK_HI_CELLS = new Set([
  '106,195', '121,180', '136,165', '151,150', '166,135', '181,120',
]);

// All rects from PixDone.svg (x, y, originalFill). Parsed from source.
const RECTS = [
  [31,165,'k'],[31,180,'k'],[31,195,'k'],[31,210,'k'],[46,225,'k'],[61,225,'k'],[76,225,'k'],
  [91,225,'k'],[106,225,'k'],[121,225,'k'],[136,225,'k'],[151,225,'k'],[166,225,'k'],[181,225,'k'],
  [196,225,'k'],[211,225,'k'],[226,210,'k'],[226,195,'k'],[226,180,'k'],[226,165,'k'],[226,150,'k'],
  [226,135,'k'],[226,120,'k'],[226,105,'k'],[226,90,'k'],[226,75,'k'],[226,60,'k'],[226,45,'k'],
  [211,30,'k'],[196,30,'k'],[181,30,'k'],[166,30,'k'],[151,30,'k'],[136,30,'k'],[121,30,'k'],
  [106,30,'k'],[91,30,'k'],[76,30,'k'],[61,30,'k'],[46,30,'k'],[31,45,'k'],[31,60,'k'],[31,75,'k'],
  [31,90,'k'],[31,105,'k'],[31,120,'k'],[31,135,'k'],[31,150,'k'],[61,165,'k'],[76,180,'k'],
  [106,195,'g'],[121,180,'g'],[136,165,'g'],[151,150,'g'],[166,135,'g'],[181,120,'g'],
  [46,240,'g'],[61,240,'g'],[76,240,'g'],[91,240,'g'],[106,240,'g'],[121,240,'g'],[136,240,'g'],
  [151,240,'g'],[166,240,'g'],[181,240,'g'],[196,240,'g'],[211,240,'g'],[226,225,'g'],[241,210,'g'],
  [241,195,'g'],[241,180,'g'],[241,165,'g'],[241,150,'g'],[241,135,'g'],[241,120,'g'],[241,105,'g'],
  [241,90,'g'],[241,75,'g'],[241,60,'g'],[241,45,'g'],[91,195,'k'],[106,180,'k'],[121,165,'k'],
  [136,150,'k'],[151,135,'k'],[166,120,'k'],[181,105,'k'],
];

function colorFor(x, y, orig) {
  const key = `${x},${y}`;
  if (CHECK_CELLS.has(key)) return CHECK;
  if (CHECK_HI_CELLS.has(key)) return CHECK_HI;
  return orig === 'k' ? FRAME : FRAME_SHADOW;
}

// Lay out the 286-unit mark inside a 512 canvas at ~62% (maskable safe zone).
const SIZE = 512;
const markCx = 143.5, markCy = 142.5;
const scale = 320 / 225; // mark target ~320px
const tx = SIZE / 2 - scale * markCx;
const ty = SIZE / 2 - scale * markCy;

const rectsSvg = RECTS.map(([x, y, o]) =>
  `<rect x="${x}" y="${y}" width="15" height="15" fill="${colorFor(x, y, o)}"/>`
).join('');

const svg =
`<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
  <g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(4)})">${rectsSvg}</g>
</svg>`;

// Also save the master SVG for future regeneration / reference.
await writeFile(resolve(PUBLIC, 'app-icon.svg'), svg);

const browser = await chromium.launch();
try {
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    const html = `<!doctype html><html><head><style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px}svg{display:block;width:${size}px;height:${size}px;image-rendering:pixelated}</style></head><body>${svg}</body></html>`;
    await page.setContent(html, { waitUntil: 'networkidle' });
    const buf = await page.screenshot({ omitBackground: false, clip: { x: 0, y: 0, width: size, height: size } });
    const out = resolve(PUBLIC, `icon-${size}.png`);
    await writeFile(out, buf);
    console.log(`wrote ${out} (${buf.length} bytes)`);
    await page.close();
  }
} finally {
  await browser.close();
}
