import { useContext, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../../design-system';

/**
 * Reads custom properties from `document.documentElement` after ThemeProvider
 * has applied the current color mode and visual theme.
 */
export function useResolvedCssCustomProperties(varNames: readonly string[]): Record<string, string> {
  const { theme, visualTheme } = useContext(ThemeContext);
  const namesKey = useMemo(() => varNames.join('\0'), [varNames]);

  const [map, setMap] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const out: Record<string, string> = {};
    for (const name of varNames) {
      const key = name.startsWith('--') ? name : `--${name}`;
      out[key] = cs.getPropertyValue(key).trim();
    }
    setMap(out);
  }, [theme, visualTheme, namesKey]);

  return map;
}

/**
 * Fully resolves semantic color tokens (including `var()` / `color-mix()` chains)
 * by applying each token as `background-color` on a probe element.
 */
export function useResolvedSemanticColorValues(cssVarNames: readonly string[]): Record<string, string> {
  const { theme, visualTheme } = useContext(ThemeContext);
  const namesKey = useMemo(() => cssVarNames.join('\0'), [cssVarNames]);

  const [map, setMap] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;left:-9999px;top:0;width:1px;height:1px;visibility:hidden;pointer-events:none;contain:strict;';
    document.body.appendChild(probe);
    const out: Record<string, string> = {};
    try {
      for (const name of cssVarNames) {
        const v = name.startsWith('--') ? name : `--${name}`;
        probe.style.backgroundColor = '';
        probe.style.backgroundColor = `var(${v})`;
        out[v] = getComputedStyle(probe).backgroundColor;
      }
    } finally {
      document.body.removeChild(probe);
    }
    setMap(out);
  }, [theme, visualTheme, namesKey]);

  return map;
}
