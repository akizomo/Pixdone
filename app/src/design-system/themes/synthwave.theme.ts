import type { VisualTheme } from './themeRegistry';

/**
 * Synthwave theme – 80s sci-fi aesthetic.
 * Deep navy backgrounds, magenta borders, cyan accents, Orbitron/Share Tech Mono fonts.
 */
export const synthwaveTheme: VisualTheme = {
  key: 'synthwave',
  name: 'Synthwave',
  icon: '🌆',
  isPremium: true,
  fontImportUrl:
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap',
  cssVariables: {
    dark: {
      // Backgrounds
      '--pd-color-background-default': '#07071a',
      '--pd-color-background-elevated': '#10103a',
      '--pd-color-background-hover': '#1a1a55',
      // Text
      '--pd-color-text-primary': '#eeddff',
      '--pd-color-text-secondary': '#b89fff',
      '--pd-color-text-muted': '#9070C0',
      // Border
      '--pd-color-border-default': '#ff2dff',
      // Accent (cyan)
      '--pd-color-accent-default': '#00fff0',
      '--pd-color-accent-hover': '#00ccc8',
      '--pd-color-accent-subtle': 'rgba(0, 255, 240, 0.12)',
      // Shadows (magenta glow)
      '--pd-color-shadow-default': 'rgba(255, 45, 255, 0.55)',
      // Semantic
      '--pd-color-semantic-success': '#00ff88',
      '--pd-color-semantic-danger': '#ff2d55',
      '--pd-color-semantic-warning': '#ffb800',
      // Smash list
      '--pd-color-smash-border': '#ff00ff',
      '--pd-color-smash-text': '#dd00dd',
      '--pd-color-smash-hint': '#cc44cc',
      '--pd-color-smash-gradientStart': '#1a004a',
      '--pd-color-smash-gradientEnd': '#000a3a',
      // Focus
      '--pd-color-focus-ring': 'rgba(0, 255, 240, 0.3)',
      '--pd-color-overlay-backdrop': 'rgba(7, 7, 26, 0.85)',
      // Semantic (missing token)
      '--pd-color-semantic-successHover': '#00CC66',
      // Fonts
      '--pd-font-brand': "'Orbitron', 'Courier New', monospace",
      '--pd-font-brand-ja': "'Orbitron', 'Courier New', monospace",
      '--pd-font-body': "'Share Tech Mono', 'Courier New', monospace",
      // pxd tokens
      '--pxd-color-surface-primary': '#10103A',
      '--pxd-color-surface-disabled': '#1A1A55',
      '--pxd-color-text-primary': '#EEDDFF',
      '--pxd-color-text-secondary': '#B89FFF',
      '--pxd-color-text-tertiary': '#9070C0',
      '--pxd-color-text-disabled': 'rgba(106, 79, 154, 0.5)',
      '--pxd-color-text-inverse': '#07071A',
      '--pxd-color-text-danger': '#FF2D55',
      '--pxd-color-border-subtle': 'rgba(255, 45, 255, 0.2)',
      '--pxd-color-border-default': '#FF2DFF',
      '--pxd-color-border-strong': '#FF77FF',
      '--pxd-color-border-danger': '#FF2D55',
      '--pxd-color-border-focus': '#00FFF0',
      '--pxd-color-focus-ring': 'rgba(0, 255, 240, 0.3)',
      '--pxd-color-feedback-danger': '#FF2D55',
      '--pxd-color-action-primary': '#00FFF0',
      '--pxd-color-action-primary-hover': '#00CCC8',
      '--pxd-color-action-primary-pressed': '#009E9B',
      '--pxd-color-action-secondary': '#10103A',
      '--pxd-color-action-secondary-hover': '#1A1A55',
      '--pxd-color-action-secondary-pressed': '#24247A',
      '--pxd-color-action-ghost-hover': 'rgba(255, 45, 255, 0.12)',
      '--pxd-color-action-ghost-pressed': 'rgba(255, 45, 255, 0.20)',
    },
    light: {
      // Synthwave light: soft neon on pale lavender
      '--pd-color-background-default': '#f0eeff',
      '--pd-color-background-elevated': '#e6e0ff',
      '--pd-color-background-hover': '#d9d0ff',
      '--pd-color-text-primary': '#1a0055',
      '--pd-color-text-secondary': '#5a3a9a',
      '--pd-color-text-muted': '#6848AA',
      '--pd-color-border-default': '#c020c0',
      '--pd-color-accent-default': '#007a78',
      '--pd-color-accent-hover': '#005550',
      '--pd-color-accent-subtle': 'rgba(0, 122, 120, 0.12)',
      '--pd-color-shadow-default': 'rgba(192, 32, 192, 0.25)',
      '--pd-color-semantic-success': '#006644',
      '--pd-color-semantic-danger': '#cc0033',
      '--pd-color-semantic-warning': '#996600',
      '--pd-color-smash-border': '#c000c0',
      '--pd-color-smash-text': '#8800aa',
      '--pd-color-smash-hint': '#aa44aa',
      '--pd-color-smash-gradientStart': '#f0e6ff',
      '--pd-color-smash-gradientEnd': '#e0d0ff',
      '--pd-color-focus-ring': 'rgba(0, 122, 120, 0.3)',
      '--pd-color-overlay-backdrop': 'rgba(20, 10, 50, 0.6)',
      // Semantic (missing token)
      '--pd-color-semantic-successHover': '#004422',
      '--pd-font-brand': "'Orbitron', 'Courier New', monospace",
      '--pd-font-brand-ja': "'Orbitron', 'Courier New', monospace",
      '--pd-font-body': "'Share Tech Mono', 'Courier New', monospace",
      // pxd tokens
      '--pxd-color-surface-primary': '#E6E0FF',
      '--pxd-color-surface-disabled': '#D9D0FF',
      '--pxd-color-text-primary': '#1A0055',
      '--pxd-color-text-secondary': '#5A3A9A',
      '--pxd-color-text-tertiary': '#6848AA',
      '--pxd-color-text-disabled': 'rgba(26, 0, 85, 0.4)',
      '--pxd-color-text-inverse': '#F0EEFF',
      '--pxd-color-text-danger': '#CC0033',
      '--pxd-color-border-subtle': 'rgba(192, 32, 192, 0.2)',
      '--pxd-color-border-default': '#C020C0',
      '--pxd-color-border-strong': '#800080',
      '--pxd-color-border-danger': '#CC0033',
      '--pxd-color-border-focus': '#007A78',
      '--pxd-color-focus-ring': 'rgba(0, 122, 120, 0.3)',
      '--pxd-color-feedback-danger': '#CC0033',
      '--pxd-color-action-primary': '#007A78',
      '--pxd-color-action-primary-hover': '#005550',
      '--pxd-color-action-primary-pressed': '#003D3B',
      '--pxd-color-action-secondary': '#E6E0FF',
      '--pxd-color-action-secondary-hover': '#D9D0FF',
      '--pxd-color-action-secondary-pressed': '#CCC0FF',
      '--pxd-color-action-ghost-hover': 'rgba(192, 32, 192, 0.10)',
      '--pxd-color-action-ghost-pressed': 'rgba(192, 32, 192, 0.20)',
    },
  },
  effectsStyle: 'glow',
  soundPackKey: 'synth',
};
