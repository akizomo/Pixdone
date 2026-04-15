import type { VisualTheme } from './themeRegistry';
import { light, dark } from './_generated/forestbit.css-vars';

/**
 * Forest Bit theme – pixel-art nature aesthetic.
 * Concept: "タスクをこなすたびに、自分の森が育つ。速くなくていい、静かに、着実に。"
 *
 * Token values live in design-tokens/themes/forestbit/*.json (source of truth)
 * and are compiled into _generated/forestbit.css-vars.ts by `npm run tokens:build`.
 */
export const forestbitTheme: VisualTheme = {
  key: 'forestbit',
  name: 'Forest Bit',
  description: {
    en: 'A quiet forest that grows with each task you finish.',
    ja: 'タスクをこなすたび、静かな森が育っていく。',
  },
  icon: '🌲',
  isPremium: true,
  cssVariables: { light, dark },
  effectsStyle: 'pixel',
  soundPackKey: 'forest',
};
