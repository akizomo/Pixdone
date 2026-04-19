#!/usr/bin/env node
/**
 * One-shot extractor: reads the existing hand-authored token sources
 *   - src/design-system/foundations/tokens.css
 *   - src/design-system/themes/{arcade,synthwave,forestbit}.theme.ts
 * and emits Tokens Studio multi-file JSON under design-tokens/.
 *
 * This script runs ONCE to bootstrap the JSON source of truth. After the
 * swap in step 6, tokens.css becomes a generated artifact and this script
 * is no longer on the critical path — keep it around for future reference
 * or as a fallback if the JSON ever needs to be regenerated from CSS.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(APP_ROOT, '..');
const OUT_DIR = resolve(REPO_ROOT, 'design-tokens');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** kebab → camel */
const toCamel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/** Set nested path into an object: setPath(obj, ['a','b','c'], x) → obj.a.b.c = x */
const setPath = (obj, path, value) => {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[path[path.length - 1]] = value;
};

const writeJson = (file, data) => {
  const full = resolve(OUT_DIR, file);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(data, null, 2) + '\n');
  console.log('  wrote', file);
};

/**
 * Convert a CSS value that may contain `var(--pd-*)` references into a
 * Tokens Studio value, using the provided resolver to turn a CSS var name
 * into a `{token.path}` reference string.
 *
 * Also handles `color-mix(in srgb, <color> <pct>%, transparent)` → encodes
 * the underlying color token with $extensions.studio.tokens.modify.alpha.
 *
 * Returns either a plain string value or an object `{ value, modify }`.
 */
const convertValue = (raw, resolveVar) => {
  let v = raw.trim();

  // Case: color-mix(in srgb, <color-expr> NN%, transparent)
  const mix = v.match(/^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+(\d+(?:\.\d+)?)%\s*,\s*transparent\s*\)$/i);
  if (mix) {
    const inner = mix[1].trim();
    const pct = parseFloat(mix[2]);
    const innerToken = convertValue(inner, resolveVar);
    // innerToken may be a string like "{color.purple.500}" or a raw hex
    const baseValue = typeof innerToken === 'string' ? innerToken : innerToken.value;
    return {
      value: baseValue,
      modify: { type: 'alpha', value: (pct / 100).toFixed(4), space: 'srgb' },
    };
  }

  // Replace all var(--name) occurrences with {token.path} references.
  v = v.replace(/var\((--[a-z0-9-]+)\)/gi, (_m, varName) => {
    const ref = resolveVar(varName);
    return ref ? `{${ref}}` : `var(${varName})`;
  });

  return v;
};

// ─────────────────────────────────────────────────────────────────────────────
// Token-name → JSON-path mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a CSS custom-property name (without the leading `--`), return the
 * nested JSON path array (e.g. ['color', 'gray', '0']) and its $type.
 * Returns null if the name doesn't belong to a known category (the caller
 * can decide how to handle unknowns).
 */
const namePathMap = (name) => {
  // ── core primitive palette: --pd-{hue}-{step} ──────────────────────────
  // Hue names we recognize as global primitive palettes.
  const PRIM_HUES = new Set([
    'gray', 'ink', 'blue', 'orange', 'green', 'yellow', 'red', 'purple',
    'pink', 'cyan', 'magenta', 'teal', 'lavender', 'violet',
  ]);

  // --pd-white / --pd-black
  if (name === 'pxd-white') return { path: ['color', 'base', 'white'], type: 'color', set: 'core' };
  if (name === 'pxd-black') return { path: ['color', 'base', 'black'], type: 'color', set: 'core' };

  // --pd-{hue}-{step}
  {
    const m = name.match(/^pxd-([a-z]+)-(\d+)$/);
    if (m && PRIM_HUES.has(m[1])) {
      return { path: ['color', m[1], m[2]], type: 'color', set: 'core' };
    }
  }

  // ── tap-target-min (accessibility) ──────────────────────────────────────
  if (name === 'pxd-tap-target-min') {
    return { path: ['sizing', 'tapTargetMin'], type: 'sizing', set: 'core' };
  }

  // ── semantic color: --pd-color-{role}-{variant...} ─────────────────────
  {
    const m = name.match(/^pxd-color-([a-z]+)-(.+)$/);
    if (m) {
      const role = m[1];
      const variant = toCamel(m[2]);
      return { path: ['color', role, variant], type: 'color', set: 'semantic' };
    }
  }

  // ── shadow ──────────────────────────────────────────────────────────────
  if (name === 'pxd-shadow-none') {
    return { path: ['shadow', 'none'], type: 'boxShadow', set: 'semantic' };
  }
  {
    const m = name.match(/^pxd-shadow-([a-z]+)-(.+)$/);
    if (m) {
      const group = m[1];
      const variant = toCamel(m[2]);
      // reward-glow-<color> is 3-segment; keep under shadow.rewardGlow.<color>
      if (group === 'reward' && m[2].startsWith('glow-')) {
        const color = m[2].slice('glow-'.length);
        return { path: ['shadow', 'rewardGlow', color], type: 'boxShadow', set: 'semantic' };
      }
      return { path: ['shadow', group, variant], type: 'boxShadow', set: 'semantic' };
    }
  }

  // ── spacing / layout / radius / borderWidth ─────────────────────────────
  {
    const m = name.match(/^pxd-space-(\d+)$/);
    if (m) return { path: ['spacing', m[1]], type: 'spacing', set: 'core' };
  }
  {
    const m = name.match(/^pxd-layout-(.+)$/);
    if (m) return { path: ['layout', toCamel(m[1])], type: 'spacing', set: 'core' };
  }
  {
    const m = name.match(/^pxd-radius-(.+)$/);
    if (m) return { path: ['radius', toCamel(m[1])], type: 'borderRadius', set: 'core' };
  }
  {
    const m = name.match(/^pxd-border-(.+)$/);
    if (m) return { path: ['borderWidth', toCamel(m[1])], type: 'borderWidth', set: 'core' };
  }

  // ── typography ──────────────────────────────────────────────────────────
  {
    const m = name.match(/^pxd-font-size-(.+)$/);
    if (m) return { path: ['fontSize', toCamel(m[1])], type: 'fontSizes', set: 'core' };
  }
  {
    const m = name.match(/^pxd-font-weight-(.+)$/);
    if (m) return { path: ['fontWeight', toCamel(m[1])], type: 'fontWeights', set: 'core' };
  }
  {
    const m = name.match(/^pxd-line-height-(.+)$/);
    if (m) return { path: ['lineHeight', toCamel(m[1])], type: 'lineHeights', set: 'core' };
  }
  {
    const m = name.match(/^pxd-font-(body|display|mono|brand)$/);
    if (m) return { path: ['fontFamily', m[1]], type: 'fontFamilies', set: 'core' };
  }

  // ── motion ──────────────────────────────────────────────────────────────
  {
    const m = name.match(/^pxd-motion-(.+)$/);
    if (m) return { path: ['motion', 'duration', toCamel(m[1])], type: 'duration', set: 'core' };
  }
  {
    const m = name.match(/^pxd-easing-(.+)$/);
    if (m) return { path: ['motion', 'easing', toCamel(m[1])], type: 'cubicBezier', set: 'core' };
  }
  {
    const m = name.match(/^pxd-scale-(.+)$/);
    if (m) return { path: ['motion', 'scale', toCamel(m[1])], type: 'number', set: 'core' };
  }
  {
    const m = name.match(/^pxd-opacity-(.+)$/);
    if (m) return { path: ['opacity', toCamel(m[1])], type: 'number', set: 'core' };
  }

  // ── theme primitives: --pd-{prefix}-{group}-{step} ─────────────────────
  // e.g. --pd-sw-navy-950, --pd-fb-night-950, --pd-sw-neon-cyan-300
  {
    const m = name.match(/^pxd-(sw|fb)-(.+?)-(\d+|50)$/);
    if (m) {
      const themePrefix = m[1];
      const group = toCamel(m[2]);
      return { path: [themePrefix, group, m[3]], type: 'color', set: 'themePrimitive' };
    }
  }
  // Theme primitives without numeric step (e.g. --pd-sw-chrome, --pd-sw-smash-text)
  {
    const m = name.match(/^pxd-(sw|fb)-(.+)$/);
    if (m) {
      return { path: [m[1], toCamel(m[2])], type: 'color', set: 'themePrimitive' };
    }
  }

  // ── legacy --pd-* component tokens ─────────────────────────────────────
  {
    const m = name.match(/^pd-color-(.+)$/);
    if (m) {
      const parts = m[1].split('-');
      if (parts.length === 1) return { path: ['pd', 'color', parts[0]], type: 'color', set: 'semantic' };
      const head = parts[0];
      const tail = toCamel(parts.slice(1).join('-'));
      return { path: ['pd', 'color', head, tail], type: 'color', set: 'semantic' };
    }
  }
  {
    const m = name.match(/^pd-font-(.+)$/);
    if (m) return { path: ['pd', 'fontFamily', toCamel(m[1])], type: 'fontFamilies', set: 'semantic' };
  }
  {
    const m = name.match(/^pd-effect-(.+)$/);
    if (m) return { path: ['pd', 'effect', toCamel(m[1])], type: 'color', set: 'semantic' };
  }

  return null;
};

/** Reverse: given a CSS var name without --, return its "{token.path}" string or null. */
const nameToRef = (cssVar) => {
  const name = cssVar.replace(/^--/, '');
  const hit = namePathMap(name);
  if (!hit) return null;
  return hit.path.join('.');
};

// ─────────────────────────────────────────────────────────────────────────────
// Parse tokens.css
// ─────────────────────────────────────────────────────────────────────────────

const parseCssBlock = (blockText) => {
  // Strip /* ... */ comments
  const stripped = blockText.replace(/\/\*[\s\S]*?\*\//g, '');
  const decls = [];
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    decls.push([m[1], m[2].trim()]);
  }
  return decls;
};

const extractCssBlocks = (cssText) => {
  // Find `:root { ... }` and `[data-theme="dark"] { ... }` at top level.
  // Also strip @media blocks (reduced-motion) – we don't export those.
  const noMedia = cssText.replace(/@media[^{]*\{[\s\S]*?\n\}/g, '');

  const rootMatches = [];
  const rootRe = /:root\s*\{([\s\S]*?)\n\}/g;
  let rm;
  while ((rm = rootRe.exec(noMedia)) !== null) rootMatches.push(rm[1]);

  const darkMatch = noMedia.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);

  return {
    rootBlocks: rootMatches,
    darkBlock: darkMatch ? darkMatch[1] : '',
  };
};

const extractFromTokensCss = () => {
  const cssPath = resolve(APP_ROOT, 'src/design-system/foundations/tokens.css');
  const css = readFileSync(cssPath, 'utf8');
  const { rootBlocks, darkBlock } = extractCssBlocks(css);

  const core = {};
  const semanticLight = {};
  const semanticDark = {};
  const unknown = [];

  const resolveVar = nameToRef;

  const assign = (target, cssVar, rawValue, setName) => {
    const hit = namePathMap(cssVar.replace(/^--/, ''));
    if (!hit) {
      unknown.push([cssVar, rawValue]);
      return;
    }
    const converted = convertValue(rawValue, resolveVar);
    const pixdone = { cssVar, set: setName };
    const tokenObj =
      typeof converted === 'string'
        ? {
            $value: converted,
            $type: hit.type,
            $extensions: { pixdone },
          }
        : {
            $value: converted.value,
            $type: hit.type,
            $extensions: {
              pixdone,
              'studio.tokens.modify': converted.modify,
            },
          };
    setPath(target, hit.path, tokenObj);
  };

  for (const block of rootBlocks) {
    for (const [cssVar, rawValue] of parseCssBlock(block)) {
      const hit = namePathMap(cssVar.replace(/^--/, ''));
      if (!hit) { unknown.push([cssVar, rawValue]); continue; }
      // Route: core primitives / dimensional → core.json
      //        semantic (light defaults) → semantic/light.json
      if (hit.set === 'semantic') {
        assign(semanticLight, cssVar, rawValue, 'semanticLight');
      } else {
        assign(core, cssVar, rawValue, 'core');
      }
    }
  }

  for (const [cssVar, rawValue] of parseCssBlock(darkBlock)) {
    assign(semanticDark, cssVar, rawValue, 'semanticDark');
  }

  return { core, semanticLight, semanticDark, unknown };
};

// ─────────────────────────────────────────────────────────────────────────────
// Parse theme .ts files (cssVariables object)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the cssVariables: { dark: {...}, light: {...} } block from a
 * theme TS file. Returns { dark: [[var, value]], light: [[var, value]] }.
 * Parser is intentionally loose – it just scans for single-quoted entries
 * of the form `'--foo': 'value'`.
 */
const extractThemeCssVars = (tsText) => {
  // Find the `cssVariables: {` block and the matching closing `}` by brace
  // counting, so we don't confuse it with later object literals in the file.
  const idx = tsText.indexOf('cssVariables:');
  if (idx === -1) return { light: [], dark: [] };
  // Advance to the opening brace.
  let i = tsText.indexOf('{', idx);
  let depth = 0;
  let start = i;
  for (; i < tsText.length; i++) {
    const c = tsText[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  const block = tsText.slice(start, i);

  // Within block, find `light: {` and `dark: {` sub-blocks.
  const extractMode = (mode) => {
    const mIdx = block.indexOf(`${mode}:`);
    if (mIdx === -1) return [];
    let j = block.indexOf('{', mIdx);
    const sStart = j;
    let d = 0;
    for (; j < block.length; j++) {
      const c = block[j];
      if (c === '{') d++;
      else if (c === '}') { d--; if (d === 0) { j++; break; } }
    }
    const body = block.slice(sStart + 1, j - 1);
    // Strip // line comments (no inline // inside values expected here).
    const clean = body.replace(/\/\/[^\n]*/g, '');
    const out = [];
    const re = /'(--[a-z0-9-]+)'\s*:\s*('([^']*)'|"([^"]*)")/g;
    let m;
    while ((m = re.exec(clean)) !== null) {
      out.push([m[1], m[3] ?? m[4]]);
    }
    return out;
  };

  return { light: extractMode('light'), dark: extractMode('dark') };
};

const extractFromThemeFile = (themeKey, filename) => {
  const tsPath = resolve(APP_ROOT, 'src/design-system/themes', filename);
  const ts = readFileSync(tsPath, 'utf8');
  const { light, dark } = extractThemeCssVars(ts);

  const build = (entries, setName) => {
    const obj = {};
    const unknown = [];
    for (const [cssVar, rawValue] of entries) {
      const hit = namePathMap(cssVar.replace(/^--/, ''));
      if (!hit) { unknown.push([cssVar, rawValue]); continue; }
      const converted = convertValue(rawValue, nameToRef);
      const pixdone = { cssVar, set: setName };
      const tokenObj =
        typeof converted === 'string'
          ? { $value: converted, $type: hit.type, $extensions: { pixdone } }
          : {
              $value: converted.value,
              $type: hit.type,
              $extensions: {
                pixdone,
                'studio.tokens.modify': converted.modify,
              },
            };
      setPath(obj, hit.path, tokenObj);
    }
    return { obj, unknown };
  };

  return {
    themeKey,
    light: build(light, `theme${themeKey[0].toUpperCase()}${themeKey.slice(1)}Light`),
    dark: build(dark, `theme${themeKey[0].toUpperCase()}${themeKey.slice(1)}Dark`),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Write Tokens Studio multi-file JSON
// ─────────────────────────────────────────────────────────────────────────────

const writeAll = (extracted, themes) => {
  mkdirSync(OUT_DIR, { recursive: true });

  writeJson('core.json', extracted.core);
  writeJson('semantic/light.json', extracted.semanticLight);
  writeJson('semantic/dark.json', extracted.semanticDark);

  for (const t of themes) {
    writeJson(`themes/${t.themeKey}/light.json`, t.light.obj);
    writeJson(`themes/${t.themeKey}/dark.json`, t.dark.obj);
  }

  // $metadata.json: token set ordering for Tokens Studio
  const tokenSetOrder = [
    'core',
    'semantic/light',
    'semantic/dark',
    ...themes.flatMap((t) => [`themes/${t.themeKey}/light`, `themes/${t.themeKey}/dark`]),
  ];
  writeJson('$metadata.json', { tokenSetOrder });

  // $themes.json: Figma-visible theme/mode matrix.
  // Each entry = a selectable "theme" in the Tokens Studio Themes dropdown.
  // All entries share group "Theme" so Tokens Studio exports them as a single
  // Figma Variables Collection with one Mode per entry (vs. trying to build a
  // 2D matrix — our theme tokens aren't orthogonal across light/dark, so the
  // flat single-dimension layout is what actually works for Variables export.)
  const $themes = [];
  const pushTheme = (name, enabled) => {
    $themes.push({
      id: name.replace(/\s+/g, '-').toLowerCase(),
      name,
      group: 'Theme',
      selectedTokenSets: Object.fromEntries(enabled.map((s) => [s, 'enabled'])),
    });
  };
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  pushTheme('Base Light', ['core', 'semantic/light']);
  pushTheme('Base Dark', ['core', 'semantic/dark']);
  for (const t of themes) {
    pushTheme(`${cap(t.themeKey)} Light`, [
      'core',
      'semantic/light',
      `themes/${t.themeKey}/light`,
    ]);
    pushTheme(`${cap(t.themeKey)} Dark`, [
      'core',
      'semantic/dark',
      `themes/${t.themeKey}/dark`,
    ]);
  }
  writeJson('$themes.json', $themes);
};

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

console.log('Extracting tokens.css…');
const extracted = extractFromTokensCss();
if (extracted.unknown.length) {
  console.log('  ⚠ unmapped tokens.css vars:');
  for (const [k, v] of extracted.unknown) console.log('    ', k, '=', v);
}

console.log('Extracting theme files…');
const themes = [
  extractFromThemeFile('arcade', 'arcade.theme.ts'),
  extractFromThemeFile('synthwave', 'synthwave.theme.ts'),
  extractFromThemeFile('forestbit', 'forestbit.theme.ts'),
];
for (const t of themes) {
  const u = [...t.light.unknown, ...t.dark.unknown];
  if (u.length) {
    console.log(`  ⚠ unmapped ${t.themeKey} vars:`);
    for (const [k, v] of u) console.log('    ', k, '=', v);
  }
}

console.log('Writing JSON to design-tokens/…');
writeAll(extracted, themes);
console.log('Done.');
