import { useContext, useCallback } from 'react';
import { ThemeContext } from '../design-system/theme/ThemeProvider';
import { themes } from '../design-system/themes/themeRegistry';
import type { ThemeKey } from '../design-system/themes/themeRegistry';
import type { ColorModePreference } from '../design-system/tokens';

/**
 * Hook for reading and updating the active visual theme.
 * - Reads the current theme from ThemeContext (persisted in localStorage).
 * - When a user is authenticated, syncs the choice to the server via PATCH /api/user/theme.
 */
export function useUserTheme() {
  const {
    visualTheme,
    setVisualTheme,
    theme: colorMode,
    colorModePreference,
    setColorModePreference,
  } = useContext(ThemeContext);

  const setColorMode = useCallback((pref: ColorModePreference) => {
    setColorModePreference(pref);
  }, [setColorModePreference]);

  const changeTheme = useCallback(
    async (key: ThemeKey) => {
      setVisualTheme(key);
      // Best-effort server sync – ignore errors (unauthenticated or network failure)
      try {
        await fetch('/api/user/theme', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themeKey: key }),
        });
      } catch (_) {}
    },
    [setVisualTheme],
  );

  return {
    visualTheme,
    currentTheme: themes[visualTheme],
    changeTheme,
    themes,
    /** Resolved color mode ('light' | 'dark') — use for CSS variable lookups */
    colorMode,
    /** Raw user preference ('light' | 'dark' | 'system') */
    colorModePreference,
    /** Set color mode preference */
    setColorMode,
  };
}
