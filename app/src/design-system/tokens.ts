/**
 * PixDone design tokens. Mirrors design-tokens/pixdone.tokens.json.
 * Used by ThemeProvider to set CSS variables and by components for type-safe access.
 */
export const tokens = {
  color: {
    // Dark mode semantics — each value maps to a --pd-* primitive.
    // Uses the `ink-*` navy palette so the default (pixel) theme matches the
    // onboarding / LP / pixel sci-fi brand palette. Previously this was
    // Material graphite (#202124 / #28292d / #3c4043) which produced a
    // jarring color shift when entering the onboarding overlay.
    background: { default: '#12151c', elevated: '#1a1f2c', hover: '#252d40' }, // ink-950, ink-900, ink-700
    text: { primary: '#e8ebf4', secondary: '#9da3b4', muted: '#70757a' },     // ink-50, ink-100, gray-400 (AA ≥ 4.5 on ink-950)
    border: { default: '#2e3a52', danger: 'rgba(255, 107, 107, 0.35)', warning: 'rgba(250, 204, 21, 0.35)', success: 'rgba(74, 222, 128, 0.35)' }, // ink-600
    accent: {
      default: '#A78BFA', // purple-250 — AA 5.92 on dark bg
      hover: '#B794F6',   // purple-200
      subtle: 'rgba(167, 139, 250, 0.15)',
      filled: '#6D52F0',  // purple-550 — AA 5.10 for white text
      text: '#ffffff',
    },
    shadow: { default: 'rgba(0, 0, 0, 0.3)' },
    semantic: {
      success: '#4ADE80',      // green-200 — AA 9.24 on dark bg
      successHover: '#22C55E', // green-250
      successText: '#ffffff',
      danger: '#FF6B6B',       // red-200 — AA 5.80 on dark bg
      dangerText: '#ffffff',
      warning: '#FACC15',      // yellow-200 — AA 10.51 on dark bg
    },
    // Task priority swatches (dark mode). White icon on top.
    priority: {
      high:   '#FF6B6B', // red-200
      medium: '#FF8C1A', // orange-500
      low:    '#43CBEA', // cyan-500
    },
    overlay: { backdrop: 'rgba(0, 0, 0, 0.5)' },
    focus: { ring: 'rgba(123, 97, 255, 0.2)', insetShadow: 'rgba(0, 0, 0, 0.1)' },
    smash: {
      border: '#43CBEA',
      text: '#8FE7FF',
      hint: '#43CBEA',
      gradientStart: 'rgba(67, 203, 234, 0.14)',
      gradientEnd: 'rgba(67, 203, 234, 0.06)',
    },
  },
  colorLight: {
    // Light mode semantics — each value maps to a --pd-* primitive
    background: { default: '#ffffff', elevated: '#f8f9fa', hover: '#f1f3f4' }, // white, gray-50, gray-100
    text: { primary: '#202124', secondary: '#5f6368', muted: '#70757a' },     // gray-900, gray-600, gray-500
    border: { default: '#dadce0', danger: 'rgba(197, 48, 48, 0.3)', warning: 'rgba(146, 96, 10, 0.3)', success: 'rgba(21, 128, 61, 0.3)' },
    accent: {
      default: '#5B43D6', // purple-700 — AA 6.52 on white
      hover: '#4C37C0',   // purple-750
      subtle: 'rgba(91, 67, 214, 0.10)',
      filled: '#5B43D6',  // purple-700 — AA 6.52 for white text
      text: '#ffffff',
    },
    shadow: { default: 'rgba(0, 0, 0, 0.1)' },
    semantic: {
      success: '#15803D',      // green-850 — AA 5.02 on white
      successHover: '#166534', // green-800
      successText: '#ffffff',
      danger: '#C53030',       // red-800 — AA 5.47 on white
      dangerText: '#ffffff',
      warning: '#854D0E',      // yellow-900 — AA 6.85 on white
    },
    // Task priority swatches (light mode). White icon on top.
    priority: {
      high:   '#C53030', // red-800
      medium: '#CC6600', // orange-700
      low:    '#2396B2', // cyan-700
    },
    focus: { ring: 'rgba(123, 97, 255, 0.2)', insetShadow: 'rgba(0, 0, 0, 0.1)' },
    smash: {
      border: '#2396B2',
      text: '#2396B2',
      hint: '#43CBEA',
      gradientStart: 'rgba(67, 203, 234, 0.10)',
      gradientEnd: 'rgba(67, 203, 234, 0.04)',
    },
  },
  space: { 0: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40, '5xl': 48, '6xl': 64 },
  radius: { none: 0, sm: 4 },
  border: { width1: 1, width2: 2 },
  motion: {
    duration: { fast: '0.15s', medium: '0.3s', slow: '0.5s' },
    easing: { linear: 'linear', ease: 'ease', easeOut: 'ease-out', snappy: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  },
  typography: {
    fontFamily: {
      brand: "'Handjet', 'VT323', 'Courier New', monospace",
      brandJa: "'PixelMplus10', 'Handjet', 'VT323', 'Courier New', monospace",
      body: "'Inter', system-ui, sans-serif",
    },
    scale: {
      displayXl: '3.5625rem',
      headlineSm: '1.5rem',
      titleLg: '1.375rem',
      titleMd: '1rem',
      bodyLg: '1rem',
      bodyMd: '0.875rem',
      labelSm: '0.6875rem',
      appTitle: '32px',
    },
  },
  zIndex: { base: 0, dropdown: 1000, modal: 1000, overlay: 10000 },
  layout: {
    container: { maxWidth: 600, padding: 20 },
    header: { gap: 16, marginBottom: 24, paddingVertical: 16 },
    listHeader: { paddingVertical: 16, paddingHorizontal: 20, marginBottom: 8 },
  },
} as const;

export type ThemeMode = 'light' | 'dark';
export type ColorModePreference = 'light' | 'dark' | 'system';

function flattenObj(
  obj: Record<string, unknown>,
  prefix: string,
  target: Record<string, string | number>
): void {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}-${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && typeof (v as Record<string, unknown>).value === 'undefined') {
      flattenObj(v as Record<string, unknown>, key, target);
    } else {
      const val = (v as { value?: string | number })?.value ?? v;
      target[key] = typeof val === 'number' ? val : String(val);
    }
  }
}

export function getThemeCSSVariables(mode: ThemeMode): Record<string, string> {
  const vars: Record<string, string | number> = {};
  const colors = mode === 'dark' ? tokens.color : tokens.colorLight;
  flattenObj(colors as unknown as Record<string, unknown>, 'color', vars);
  flattenObj(tokens.space as unknown as Record<string, unknown>, 'space', vars);
  flattenObj(tokens.radius as unknown as Record<string, unknown>, 'radius', vars);
  flattenObj(tokens.motion as unknown as Record<string, unknown>, 'motion', vars);
  flattenObj(tokens.typography as unknown as Record<string, unknown>, 'font', vars);
  flattenObj(tokens.layout as unknown as Record<string, unknown>, 'layout', vars);
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    const num = typeof v === 'number';
    const suffix = num && (k.startsWith('space') || k.startsWith('layout')) ? 'px' : '';
    result[`--pd-${k}`] = num ? String(v) + suffix : String(v);
  }
  result['--pd-font-body'] = tokens.typography.fontFamily.body;
  result['--pd-font-brand'] = tokens.typography.fontFamily.brand;
  result['--pd-font-brand-ja'] = tokens.typography.fontFamily.brandJa;
  return result;
}
