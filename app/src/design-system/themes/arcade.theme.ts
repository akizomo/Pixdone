import type { VisualTheme } from './themeRegistry';

/**
 * Arcade theme – the default retro pixel-art look.
 * Uses the base token system defaults; no CSS variable overrides needed.
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
  cssVariables: {
    light: {
      '--pd-effect-particle-1': '#ff6b6b',
      '--pd-effect-particle-2': '#4ecdc4',
      '--pd-effect-particle-3': '#45b7d1',
      '--pd-effect-particle-4': '#ffeaa7',
    },
    dark: {
      '--pd-effect-particle-1': '#ff6b6b',
      '--pd-effect-particle-2': '#4ecdc4',
      '--pd-effect-particle-3': '#45b7d1',
      '--pd-effect-particle-4': '#ffeaa7',
    },
  },
  effectsStyle: 'pixel',
  soundPackKey: 'retro',
};
