import type { VisualTheme } from './themeRegistry';
import { light, dark } from './_generated/arcade.css-vars';

/**
 * Arcade theme – the default retro pixel-art look.
 * Uses the base token system defaults; no CSS variable overrides needed.
 *
 * Token values live in design-tokens/themes/arcade/*.json (source of truth)
 * and are compiled into _generated/arcade.css-vars.ts by `npm run tokens:build`.
 */
export const arcadeTheme: VisualTheme = {
  key: 'arcade',
  name: 'Arcade',
  description: {
    en: 'Classic pixel arcade. Simple, punchy, and loud.',
    ja: '王道アーケード。シンプルで、気持ちよく、派手。',
  },
  icon: '🕹️',
  isPremium: false,
  cssVariables: { light, dark },
  effectsStyle: 'pixel',
  soundPackKey: 'retro',
};
