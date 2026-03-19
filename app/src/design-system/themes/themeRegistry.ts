/**
 * Visual theme registry for PixDone.
 * ThemeKey controls the visual style (colors, fonts, effects, sounds)
 * independently of the light/dark ThemeMode.
 */

export type ThemeKey = 'arcade' | 'synthwave';

/**
 * Per-mode CSS variable overrides for a visual theme.
 * Define `light` and/or `dark` keys to apply mode-specific values.
 * Omitted modes inherit the base token defaults.
 *
 * Future custom themes should populate both keys so the theme looks
 * intentional in either color mode.
 */
export interface ThemeModeVariables {
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

export interface VisualTheme {
  key: ThemeKey;
  /** Display name shown in ThemeSelector UI */
  name: string;
  /** Emoji icon for the theme card */
  icon: string;
  /** Premium themes require payment to unlock */
  isPremium: boolean;
  /** Google Fonts URL to inject when this theme is active */
  fontImportUrl?: string;
  /**
   * CSS variable overrides split by color mode.
   * ThemeProvider applies only the matching mode's variables at runtime,
   * so each theme can look correct in both light and dark.
   */
  cssVariables: ThemeModeVariables;
  /** Effect style: pixel art bursts or glow/beam effects */
  effectsStyle: 'pixel' | 'glow';
  /** Sound pack to use */
  soundPackKey: 'retro' | 'synth' | 'synthwave';
}

import { arcadeTheme } from './arcade.theme';
import { synthwaveTheme } from './synthwave.theme';

export const themes: Record<ThemeKey, VisualTheme> = {
  arcade: arcadeTheme,
  synthwave: synthwaveTheme,
};

export const themeList: VisualTheme[] = Object.values(themes);
