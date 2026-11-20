#!/usr/bin/env node
/**
 * Render the hero image for the iOS launch announcement modal
 * (components/IosLaunchAnnouncement.tsx) from the App Store raw captures.
 *
 * Usage: node scripts/announcement-hero/render.mjs
 * Output: public/announcements/ios-launch-hero-{ja,en}.jpg (1200x720)
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..', '..');
const RAW = (lang, f) => pathToFileURL(path.join(APP_ROOT, 'store-assets', 'raw', lang, f)).href;
const OUT_DIR = path.join(APP_ROOT, 'public', 'announcements');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
await mkdir(OUT_DIR, { recursive: true });
for (const lang of ['ja', 'en']) {
  // Effect crops are language-neutral; only the phone screen differs.
  const q = new URLSearchParams({ l: RAW('ja', 'fx-bomb.png'), p: RAW(lang, 'smash.png'), r: RAW('ja', 'fx-rainbow.png') });
  await page.goto(`${pathToFileURL(path.join(__dirname, 'template.html')).href}?${q}`);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth));
  const out = path.join(OUT_DIR, `ios-launch-hero-${lang}.jpg`);
  await page.screenshot({ path: out, type: 'jpeg', quality: 85 });
  console.log(`[hero] ${out}`);
}
await browser.close();
