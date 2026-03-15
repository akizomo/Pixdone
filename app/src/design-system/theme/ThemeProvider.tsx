import { createContext, useCallback, useLayoutEffect, useState, type ReactNode } from 'react';
import { getThemeCSSVariables, type ThemeMode } from '../tokens';
import { themes, type ThemeKey } from '../themes/themeRegistry';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  visualTheme: ThemeKey;
  setVisualTheme: (key: ThemeKey) => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  visualTheme: 'arcade',
  setVisualTheme: () => {},
});

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  return mq.matches ? 'light' : 'dark';
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
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme ?? getInitialTheme);
  const [visualTheme, setVisualThemeState] = useState<ThemeKey>(defaultVisualTheme ?? getInitialVisualTheme);

  useLayoutEffect(() => {
    const baseVars = getThemeCSSVariables(theme);
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-visual-theme', visualTheme);

    // Apply base token variables
    for (const [key, value] of Object.entries(baseVars)) {
      root.style.setProperty(key, value);
    }

    // Apply visual theme overrides for the current color mode
    const vt = themes[visualTheme];
    const modeVars = vt.cssVariables[theme] ?? {};
    for (const [key, value] of Object.entries(modeVars)) {
      root.style.setProperty(key, value);
    }

    // Inject font if needed
    if (vt.fontImportUrl) {
      injectFontLink(vt.fontImportUrl);
    }

    // Notify sound system of theme change
    if (typeof window !== 'undefined') {
      const w = window as unknown as { __pixdoneSetSoundPack?: (pack: string) => void };
      w.__pixdoneSetSoundPack?.(vt.soundPackKey);
    }
  }, [theme, visualTheme]);

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);

  const setVisualTheme = useCallback((key: ThemeKey) => {
    setVisualThemeState(key);
    try {
      localStorage.setItem('pd-visual-theme', key);
    } catch (_) {}
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, visualTheme, setVisualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
