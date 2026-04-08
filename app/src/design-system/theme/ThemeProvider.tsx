import { createContext, useCallback, useLayoutEffect, useRef, useState, useEffect, type ReactNode } from 'react';
import { getThemeCSSVariables, type ThemeMode, type ColorModePreference } from '../tokens';
import { themes, type ThemeKey } from '../themes/themeRegistry';

type ThemeContextValue = {
  /** Resolved mode actually applied to the UI ('light' | 'dark') */
  theme: ThemeMode;
  /** Raw user preference including 'system' */
  colorModePreference: ColorModePreference;
  setColorModePreference: (p: ColorModePreference) => void;
  /** @deprecated Use setColorModePreference instead */
  setTheme: (t: ThemeMode) => void;
  visualTheme: ThemeKey;
  setVisualTheme: (key: ThemeKey) => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colorModePreference: 'system',
  setColorModePreference: () => {},
  setTheme: () => {},
  visualTheme: 'arcade',
  setVisualTheme: () => {},
});

const COLOR_MODE_KEY = 'pd-color-mode';

function getSystemMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getInitialPreference(): ColorModePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(COLOR_MODE_KEY) as ColorModePreference | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch (_) {}
  return 'system';
}

function resolveMode(pref: ColorModePreference): ThemeMode {
  return pref === 'system' ? getSystemMode() : pref;
}

function getInitialVisualTheme(): ThemeKey {
  if (typeof window === 'undefined') return 'arcade';
  try {
    const stored = localStorage.getItem('pd-visual-theme') as ThemeKey | null;
    if (stored && stored in themes) return stored;
  } catch (_) {}
  return 'arcade';
}

function injectFontLink(url: string): void {
  const id = `pd-font-${btoa(url).slice(0, 16)}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

export function ThemeProvider({
  children,
  defaultTheme,
  defaultVisualTheme,
}: {
  children: ReactNode;
  /** Override the initial color mode. Useful in Storybook and tests. */
  defaultTheme?: ThemeMode;
  /** Override the initial visual theme. Useful in Storybook and tests. */
  defaultVisualTheme?: ThemeKey;
}) {
  const [preference, setPreferenceState] = useState<ColorModePreference>(
    defaultTheme ?? getInitialPreference,
  );
  const [resolvedTheme, setResolvedTheme] = useState<ThemeMode>(
    () => resolveMode(defaultTheme ?? getInitialPreference()),
  );
  const [visualTheme, setVisualThemeState] = useState<ThemeKey>(defaultVisualTheme ?? getInitialVisualTheme);

  // Listen for OS color scheme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolvedTheme(getSystemMode());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  // Update resolved theme when preference changes
  useEffect(() => {
    setResolvedTheme(resolveMode(preference));
  }, [preference]);

  // Track which CSS variables were injected by the previous visual theme so we
  // can remove them before applying a new theme (prevents bleed-through).
  const prevThemeVarKeysRef = useRef<string[]>([]);

  useLayoutEffect(() => {
    const baseVars = getThemeCSSVariables(resolvedTheme);
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-visual-theme', visualTheme);

    // Remove overrides left by the previous visual theme before applying new ones
    for (const key of prevThemeVarKeysRef.current) {
      root.style.removeProperty(key);
    }

    // Apply base token variables
    for (const [key, value] of Object.entries(baseVars)) {
      root.style.setProperty(key, value);
    }

    // Apply visual theme overrides for the current color mode
    const vt = themes[visualTheme];
    const modeVars = vt.cssVariables[resolvedTheme] ?? {};
    const appliedKeys: string[] = [];
    for (const [key, value] of Object.entries(modeVars)) {
      root.style.setProperty(key, value);
      appliedKeys.push(key);
    }
    prevThemeVarKeysRef.current = appliedKeys;

    // Inject font if needed
    if (vt.fontImportUrl) {
      injectFontLink(vt.fontImportUrl);
    }

    // Notify sound system of theme change
    if (typeof window !== 'undefined') {
      const w = window as unknown as {
        __pixdoneSetSoundPack?: (pack: string) => void;
        __pixdoneDesiredSoundPack?: string;
      };
      w.__pixdoneDesiredSoundPack = vt.soundPackKey;
      w.__pixdoneSetSoundPack?.(vt.soundPackKey);
    }
  }, [resolvedTheme, visualTheme]);

  const setColorModePreference = useCallback((p: ColorModePreference) => {
    setPreferenceState(p);
    try { localStorage.setItem(COLOR_MODE_KEY, p); } catch (_) {}
  }, []);

  // Legacy setTheme — maps to preference directly
  const setTheme = useCallback((t: ThemeMode) => {
    setColorModePreference(t);
  }, [setColorModePreference]);

  const setVisualTheme = useCallback((key: ThemeKey) => {
    setVisualThemeState(key);
    try {
      localStorage.setItem('pd-visual-theme', key);
    } catch (_) {}
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme: resolvedTheme,
      colorModePreference: preference,
      setColorModePreference,
      setTheme,
      visualTheme,
      setVisualTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
