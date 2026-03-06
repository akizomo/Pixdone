import { createContext, useCallback, useLayoutEffect, useState, type ReactNode } from 'react';
import { getThemeCSSVariables, type ThemeMode } from '../tokens';

type ThemeContextValue = { theme: ThemeMode; setTheme: (t: ThemeMode) => void };

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
});

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  return mq.matches ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useLayoutEffect(() => {
    const vars = getThemeCSSVariables(theme);
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }, [theme]);

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
