import type { VisualTheme } from './themeRegistry';
import { light, dark } from './_generated/synthwave.css-vars';

/**
 * Synthwave theme – 80s sci-fi aesthetic.
 * Deep navy backgrounds, magenta borders, neon cyan accents, Orbitron/Share Tech Mono fonts.
 *
 * Token values live in design-tokens/themes/synthwave/*.json (source of truth)
 * and are compiled into _generated/synthwave.css-vars.ts by `npm run tokens:build`.
 */
export const synthwaveTheme: VisualTheme = {
  key: 'synthwave',
  name: 'Synthwave',
  description: {
    en: 'Neon nights. Glitchy, futuristic, and electric.',
    ja: 'ネオンの夜。グリッチで未来的、エレクトリック。',
  },
  icon: '🌆',
  isPremium: true,
  fontImportUrl:
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap',
  cssVariables: { light, dark },
  effectsStyle: 'glow',
  soundPackKey: 'synthwave',
};
