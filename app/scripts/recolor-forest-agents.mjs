#!/usr/bin/env node
/**
 * Generate Forest Bit agent PNGs by recoloring the Arcade agent sprites.
 *
 * The arcade agent uses exactly two opaque colors:
 *   - body   #00cfff (cyan)
 *   - outline #000000 (black — eyes + silhouette)
 *
 * We map the body to forest leaf (#4aaa4a) and keep the outline untouched.
 *
 * Usage:
 *   node app/scripts/recolor-forest-agents.mjs
 *
 * Output: app/public/world/forestbit/sprites/agent-forest-bit-000{1..4}.png
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');

const SRC_DIR = resolve(APP_ROOT, 'public/world/arcade/sprites');
const DST_DIR = resolve(APP_ROOT, 'public/world/forestbit/sprites');

// Arcade body color → Forest leaf-500 (matches --pd-fb-leaf-500)
const BODY_SRC = { r: 0x00, g: 0xcf, b: 0xff };
const BODY_DST = { r: 0x4a, g: 0xaa, b: 0x4a };

function match(r, g, b, c) {
  return r === c.r && g === c.g && b === c.b;
}

async function recolorOne(srcPath, dstPath) {
  const buf = await readFile(srcPath);
  const png = PNG.sync.read(buf);
  let swapped = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3];
    if (a === 0) continue;
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    if (match(r, g, b, BODY_SRC)) {
      png.data[i] = BODY_DST.r;
      png.data[i + 1] = BODY_DST.g;
      png.data[i + 2] = BODY_DST.b;
      swapped++;
    }
  }
  await writeFile(dstPath, PNG.sync.write(png));
  return swapped;
}

async function main() {
  await mkdir(DST_DIR, { recursive: true });
  for (let i = 1; i <= 4; i++) {
    const src = resolve(SRC_DIR, `agent-arcade-000${i}.png`);
    const dst = resolve(DST_DIR, `agent-forest-bit-000${i}.png`);
    const n = await recolorOne(src, dst);
    console.log(`frame ${i}: recolored ${n} pixels → ${dst}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
