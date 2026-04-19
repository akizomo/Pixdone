#!/usr/bin/env node
/**
 * Build design tokens from design-tokens/*.json (source of truth)
 * into:
 *   - app/src/design-system/foundations/tokens.css
 *       :root block (core + semantic/light)
 *       [data-theme="dark"] block (semantic/dark overrides)
 *   - app/src/design-system/themes/_generated/{theme}.css-vars.ts
 *       export const light = { '--pd-...': '...', ... }
 *       export const dark  = { '--pd-...': '...', ... }
 *
 * Pipeline: Tokens Studio JSON → @tokens-studio/sd-transforms → Style Dictionary
 * → custom "pixdone/css-decls" + "pixdone/theme-ts" formats.
 *
 * Designers edit JSON via Tokens Studio plugin in Figma → push to GitHub →
 * this script regenerates the CSS + theme TS artifacts on build.
 */

import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(APP_ROOT, '..');
const TOKENS_DIR = resolve(REPO_ROOT, 'design-tokens');
const GENERATED_HEADER = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Source of truth: design-tokens/*.json (Tokens Studio format).
 * Regenerate with \`npm run tokens:build\`.
 */`;

// ─────────────────────────────────────────────────────────────────────────────
// Register @tokens-studio/sd-transforms: adds alpha modifier, dimension,
// HEX8 conversion, and the `tokens-studio` transform group / preprocessor.
// ─────────────────────────────────────────────────────────────────────────────
register(StyleDictionary, {
  // keep kebab case; we use our own name transform via $extensions
  withSDBuiltins: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getCssVar = (token) =>
  token.$extensions?.pixdone?.cssVar ?? token.original?.$extensions?.pixdone?.cssVar ?? null;

const getSet = (token) =>
  token.$extensions?.pixdone?.set ?? token.original?.$extensions?.pixdone?.set ?? null;

/** Render a resolved value, preferring var(...) refs when the original value
 *  was a {token.path} reference to another token that has a cssVar.
 *  If the token also carries a Tokens Studio alpha modifier (originally a
 *  color-mix() expression in CSS), emit color-mix(...) around the var ref. */
const renderValue = (token, dictionary) => {
  const originalValue = token.original?.$value ?? token.$value;
  const modify =
    token.$extensions?.['studio.tokens.modify'] ??
    token.original?.$extensions?.['studio.tokens.modify'] ??
    null;

  if (typeof originalValue === 'string') {
    const refMatch = originalValue.match(/^\{([^}]+)\}$/);
    if (refMatch) {
      const path = refMatch[1].split('.');
      const refToken = path.reduce(
        (acc, p) => (acc && typeof acc === 'object' ? acc[p] : undefined),
        dictionary.tokens,
      );
      const refCssVar = getCssVar(refToken);
      if (refCssVar) {
        if (modify?.type === 'alpha') {
          const pct = Math.round(parseFloat(modify.value) * 100);
          return `color-mix(in srgb, var(${refCssVar}) ${pct}%, transparent)`;
        }
        return `var(${refCssVar})`;
      }
    }
  }
  // Otherwise use the resolved $value (sd-transforms will have already
  // applied the alpha modifier to produce rgba(...) for non-ref values).
  return String(token.$value);
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom formats
// ─────────────────────────────────────────────────────────────────────────────

StyleDictionary.registerFormat({
  name: 'pixdone/css-block',
  format: async ({ dictionary, options, file }) => {
    const { selector = ':root', indent = '  ' } = options ?? {};
    const filterSets = new Set(options?.sets ?? []);
    const lines = [];
    for (const token of dictionary.allTokens) {
      const set = getSet(token);
      if (filterSets.size && !filterSets.has(set)) continue;
      const cssVar = getCssVar(token);
      if (!cssVar) continue;
      const value = renderValue(token, dictionary);
      lines.push(`${indent}${cssVar}: ${value};`);
    }
    const header = file?.fileHeader ? await file.fileHeader() : '';
    const headerBlock = header ? `/*\n${header.map((l) => ` * ${l}`).join('\n')}\n */\n` : '';
    return `${headerBlock}${selector} {\n${lines.join('\n')}\n}\n`;
  },
});

StyleDictionary.registerFormat({
  name: 'pixdone/theme-ts',
  format: async ({ dictionary, options }) => {
    const { modes = [] } = options ?? {};
    // modes = [{ key: 'light', sets: [...] }, { key: 'dark', sets: [...] }]
    const renderMode = ({ key, sets }) => {
      const filter = new Set(sets);
      const entries = [];
      for (const token of dictionary.allTokens) {
        const set = getSet(token);
        if (!filter.has(set)) continue;
        const cssVar = getCssVar(token);
        if (!cssVar) continue;
        const value = renderValue(token, dictionary);
        // Escape single quotes in value (shouldn't happen but defensive)
        const safe = value.replace(/'/g, "\\'");
        entries.push(`  '${cssVar}': '${safe}',`);
      }
      return `export const ${key}: Record<string, string> = {\n${entries.join('\n')}\n};\n`;
    };
    return `${GENERATED_HEADER}\n\n${modes.map(renderMode).join('\n')}`;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Build helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Run one SD build with the given sources and a single file output. */
const runBuild = async ({ sources, file }) => {
  const sd = new StyleDictionary({
    source: sources.map((s) => resolve(TOKENS_DIR, s)),
    preprocessors: ['tokens-studio'],
    platforms: {
      pixdone: {
        transformGroup: 'tokens-studio',
        buildPath: resolve(TOKENS_DIR, '_generated') + '/',
        files: [file],
      },
    },
    log: { warnings: 'disabled', verbosity: 'silent' },
  });
  await sd.hasInitialized;
  await sd.buildAllPlatforms();
};

// ─────────────────────────────────────────────────────────────────────────────
// Build 1: tokens.css  (root + dark overrides)
// ─────────────────────────────────────────────────────────────────────────────

const buildBaseCss = async () => {
  mkdirSync(resolve(TOKENS_DIR, '_generated'), { recursive: true });

  // Light block: core + semanticLight  → :root
  await runBuild({
    sources: ['core.json', 'semantic/light.json'],
    file: {
      destination: 'base-root.css',
      format: 'pixdone/css-block',
      options: { selector: ':root', sets: ['core', 'semanticLight'] },
    },
  });

  // Dark block: core + semanticDark (no light — same paths would collide).
  // All dark refs point at core primitives, so refs resolve.
  await runBuild({
    sources: ['core.json', 'semantic/dark.json'],
    file: {
      destination: 'base-dark.css',
      format: 'pixdone/css-block',
      options: { selector: '[data-theme="dark"]', sets: ['semanticDark'] },
    },
  });

  // Concat into final tokens.css, preserving the reduced-motion @media block
  // from the original file (we keep that hand-authored for now).
  const root = readFileSync(resolve(TOKENS_DIR, '_generated/base-root.css'), 'utf8');
  const dark = readFileSync(resolve(TOKENS_DIR, '_generated/base-dark.css'), 'utf8');

  const header = `/**
 * Pixdone design tokens — CSS custom properties.
 *
 * AUTO-GENERATED from design-tokens/*.json — do not edit by hand.
 * Source of truth lives in the Tokens Studio JSON. Regenerate with
 * \`npm run tokens:build\` from the app/ directory.
 */
`;

  const reducedMotion = `
/* =============================================================================
   REDUCED MOTION  (hand-authored — not derived from tokens)
   ============================================================================= */

@media (prefers-reduced-motion: reduce) {
  :root {
    --pd-motion-instant: 0ms;
    --pd-motion-fast:    0ms;
    --pd-motion-base:    0ms;
    --pd-motion-slow:    0ms;
    --pd-motion-slower:  0ms;
    --pd-motion-reward:  0ms;
  }
}
`;

  const finalCss = `${header}\n${root}\n${dark}${reducedMotion}`;
  const outPath = resolve(APP_ROOT, 'src/design-system/foundations/tokens.css');
  writeFileSync(outPath, finalCss);
  console.log('  wrote', outPath.replace(REPO_ROOT + '/', ''));
};

// ─────────────────────────────────────────────────────────────────────────────
// Build 2: themes/_generated/{theme}.css-vars.ts
// ─────────────────────────────────────────────────────────────────────────────

const THEME_KEYS = ['arcade', 'synthwave', 'forestbit'];

const themeSetName = (key, mode) =>
  `theme${key[0].toUpperCase()}${key.slice(1)}${mode[0].toUpperCase()}${mode.slice(1)}`;

const buildThemeTs = async (themeKey) => {
  // Run separate builds per mode so light/dark tokens sharing the same
  // path (e.g. color.surface.page) don't overwrite each other in SD's
  // dictionary. Each mode gets only the sources it needs for ref resolution.
  const buildMode = async (mode, setName) => {
    await runBuild({
      sources: [
        'core.json',
        `semantic/${mode}.json`,
        `themes/${themeKey}/${mode}.json`,
      ],
      file: {
        destination: `${themeKey}-${mode}.tmp.ts`,
        format: 'pixdone/theme-ts',
        options: {
          modes: [{ key: mode, sets: [setName] }],
        },
      },
    });
    return readFileSync(resolve(TOKENS_DIR, `_generated/${themeKey}-${mode}.tmp.ts`), 'utf8');
  };

  const lightOut = await buildMode('light', themeSetName(themeKey, 'light'));
  const darkOut = await buildMode('dark', themeSetName(themeKey, 'dark'));

  // Both outputs start with GENERATED_HEADER. Strip the header from the
  // second one and extract just the `export const dark = ...` block.
  const stripHeader = (src) => src.replace(/^\/\*\*[\s\S]*?\*\/\n\n?/, '');

  const combined = `${GENERATED_HEADER}\n\n${stripHeader(lightOut)}\n${stripHeader(darkOut)}`;
  const destDir = resolve(APP_ROOT, 'src/design-system/themes/_generated');
  mkdirSync(destDir, { recursive: true });
  const destFile = resolve(destDir, `${themeKey}.css-vars.ts`);
  writeFileSync(destFile, combined);
  console.log('  wrote', destFile.replace(REPO_ROOT + '/', ''));
};

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

console.log('Building tokens.css…');
await buildBaseCss();

console.log('Building theme TS files…');
for (const key of THEME_KEYS) {
  await buildThemeTs(key);
}

console.log('Done.');
