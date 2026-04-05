/**
 * Which primitive / global palette tokens each visual theme uses — derived from
 * `VisualTheme.cssVariables` so Storybook stays in sync with theme TS files.
 */
import { corePrimitiveCssVarNames } from '../foundations/color.tokens';
import type { ThemeMode } from '../tokens';
import type { ThemeKey } from './themeRegistry';
import { themes } from './themeRegistry';

/** Primitives in `tokens.css` that are not listed in `color.core` (TS). */
const TOKENS_CSS_ONLY_PRIMITIVES: readonly string[] = [
  '--pxd-magenta-300',
  '--pxd-magenta-500',
  '--pxd-magenta-700',
  '--pxd-magenta-900',
  '--pxd-teal-300',
  '--pxd-teal-500',
  '--pxd-teal-700',
  '--pxd-teal-900',
  '--pxd-lavender-50',
  '--pxd-lavender-100',
  '--pxd-lavender-200',
  '--pxd-lavender-300',
  '--pxd-lavender-400',
  '--pxd-lavender-500',
  '--pxd-violet-600',
  '--pxd-violet-700',
  '--pxd-violet-900',
];

const VAR_REF_RE = /var\((--[a-zA-Z0-9-]+)\)/g;

const DEFAULT_GLOBAL_PRIMITIVE_SET = new Set<string>([
  ...corePrimitiveCssVarNames,
  ...TOKENS_CSS_ONLY_PRIMITIVES,
]);

function isSemanticToken(name: string): boolean {
  return name.startsWith('--pxd-color-');
}

function isThemeNamespacePrimitive(name: string): boolean {
  return name.startsWith('--pxd-sw-') || name.startsWith('--pxd-fb-');
}

function isDirectColorValue(v: string): boolean {
  const t = v.trim();
  return /^#[0-9A-Fa-f]{3,8}$/.test(t) || /^rgba?\(/.test(t);
}

function collectVarRefs(value: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(VAR_REF_RE.source, 'g');
  while ((m = re.exec(value)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function isGlobalCatalogPrimitive(name: string): boolean {
  if (isSemanticToken(name)) return false;
  if (isThemeNamespacePrimitive(name)) return false;
  if (name.startsWith('--pd-')) return false;
  return DEFAULT_GLOBAL_PRIMITIVE_SET.has(name);
}

export type ThemePrimitiveInventory = {
  themeKey: ThemeKey;
  mode: ThemeMode;
  /** Hex / rgb defined in this theme's mode map (theme palette + effect particles, etc.) */
  themeDefinedPrimitives: { name: string; rawValue: string }[];
  /**
   * Global primitives from `tokens.css` / `color.core` that this theme references via `var()`
   * (excluding semantic tokens). For Arcade, this is the full default catalog (same as runtime).
   */
  referencedGlobalPrimitives: string[];
  /** Arcade uses the default token stack; only particle colors are overridden in theme TS. */
  usesDefaultPaletteAsBase: boolean;
};

/**
 * Inventory of primitive-level tokens for the given visual theme + color mode.
 */
export function getThemePrimitiveInventory(themeKey: ThemeKey, mode: ThemeMode): ThemePrimitiveInventory {
  const vt = themes[themeKey];
  const modeVars = vt.cssVariables[mode] ?? {};

  const themeDefined: { name: string; rawValue: string }[] = [];
  for (const [k, v] of Object.entries(modeVars)) {
    if (isSemanticToken(k)) continue;
    if (k.startsWith('--pd-color-')) continue;
    if (k.startsWith('--pd-font-')) continue;
    if (!isDirectColorValue(v)) continue;
    themeDefined.push({ name: k, rawValue: v.trim() });
  }
  themeDefined.sort((a, b) => a.name.localeCompare(b.name));

  const globalRefSet = new Set<string>();
  for (const v of Object.values(modeVars)) {
    for (const ref of collectVarRefs(v)) {
      if (isSemanticToken(ref)) continue;
      if (isThemeNamespacePrimitive(ref)) continue;
      if (isGlobalCatalogPrimitive(ref)) {
        globalRefSet.add(ref);
      }
    }
  }

  const usesDefaultPaletteAsBase = themeKey === 'arcade';

  const referencedGlobalPrimitives = usesDefaultPaletteAsBase
    ? [...DEFAULT_GLOBAL_PRIMITIVE_SET].sort()
    : [...globalRefSet].sort();

  return {
    themeKey,
    mode,
    themeDefinedPrimitives: themeDefined,
    referencedGlobalPrimitives,
    usesDefaultPaletteAsBase,
  };
}
