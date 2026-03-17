/**
 * PixDone design tokens. Mirrors design-tokens/pixdone.tokens.json.
 * Used by ThemeProvider to set CSS variables and by components for type-safe access.
 */
export const tokens = {
  color: {
    background: { default: '#202124', elevated: '#28292d', hover: '#3c4043' },
    text: { primary: '#e8eaed', secondary: '#9aa0a6', muted: '#70757a' },
    border: { default: '#3c4043' },
    accent: { default: '#7B61FF', hover: '#A590FF', subtle: 'rgba(123, 97, 255, 0.15)', text: '#ffffff' },
    shadow: { default: 'rgba(0, 0, 0, 0.3)' },
    semantic: { success: '#34a853', successHover: '#2e7d32', successText: '#ffffff', danger: '#ea4335', dangerText: '#ffffff', warning: '#fbbc04' },
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
    background: { default: '#ffffff', elevated: '#f8f9fa', hover: '#f1f3f4' },
    text: { primary: '#202124', secondary: '#5f6368', muted: '#70757a' },
    border: { default: '#dadce0' },
    accent: { default: '#7B61FF', hover: '#6B52F0', subtle: 'rgba(123, 97, 255, 0.12)', text: '#ffffff' },
    shadow: { default: 'rgba(0, 0, 0, 0.1)' },
    semantic: { success: '#34a853', successHover: '#2e7d32', successText: '#ffffff', danger: '#ea4335', dangerText: '#ffffff', warning: '#fbbc04' },
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
      brand: "'VT323', 'Courier New', monospace",
      brandJa: "'PixelMplus10', 'VT323', 'Courier New', monospace",
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
