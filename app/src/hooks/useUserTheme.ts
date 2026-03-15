import { useContext, useCallback } from 'react';
import { ThemeContext } from '../design-system/theme/ThemeProvider';
import { themes } from '../design-system/themes/themeRegistry';
import type { ThemeKey } from '../design-system/themes/themeRegistry';

/**
 * Hook for reading and updating the active visual theme.
 * - Reads the current theme from ThemeContext (persisted in localStorage).
 * - When a user is authenticated, syncs the choice to the server via PATCH /api/user/theme.
 */
export function useUserTheme() {
  const { visualTheme, setVisualTheme } = useContext(ThemeContext);

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
  };
}
