import type { VisualTheme } from './themeRegistry';

/**
 * Forest Bit theme – pixel-art nature aesthetic.
 * Concept: "タスクをこなすたびに、自分の森が育つ。速くなくていい、静かに、着実に。"
 *
 * Token architecture (3 layers in each mode):
 *
 *   1. Theme primitives   --pxd-fb-*       raw color palette for this theme
 *          ↓ var() reference
 *   2. Semantic overrides --pxd-color-*    override base token semantics
 *          ↓ var() reference
 *   3. Component tokens   --pd-color-*     override legacy component-level vars
 *
 * Palette reference:
 *   昼 (Light): bg=#d4f0f8  primary=#4aaa4a  secondary=#2d6b2d  accent=#f9e04b
 *   夜 (Dark):  bg=#0a1a1f  primary=#2a5a2a  secondary=#1a3a1a  accent=#c8e6a0
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

  cssVariables: {
    // =========================================================================
    // DARK MODE (夜 – Night forest)
    // =========================================================================
    dark: {
      // ── Theme Primitives (Dark) ─────────────────────────────────────────────

      // Deep forest night backgrounds
      '--pxd-fb-night-950': '#0a1a1f',   // deepest – page bg
      '--pxd-fb-night-900': '#0d2028',   // page-alt
      '--pxd-fb-night-800': '#102830',   // surface-primary
      '--pxd-fb-night-700': '#2a5a2a',   // surface-raised  (= "primary" in spec)
      '--pxd-fb-night-600': '#1a3a1a',   // action-disabled (= "secondary" in spec)
      '--pxd-fb-night-500': '#1e4020',   // action-secondary pressed

      // Firefly glow / leaf shine accent
      '--pxd-fb-glow-300': '#c8e6a0',    // default accent (~8:1 on night-950)
      '--pxd-fb-glow-500': '#a0c878',    // hover
      '--pxd-fb-glow-700': '#78a050',    // pressed

      // Text
      '--pxd-fb-text-50':    '#d0f0d8',  // text-primary (~9:1 on night-950)
      '--pxd-fb-text-200':   '#a8d4b0',  // text-secondary (~5.5:1)
      '--pxd-fb-text-muted': '#6a9870',  // text-tertiary / muted (decorative)

      // Feedback / semantic
      '--pxd-fb-danger-dark':      '#ff7a5a',  // danger text  (4.8:1 on night-950)
      '--pxd-fb-danger-bg-dark':   '#b03a1a',  // danger button bg (white text 5:1)
      '--pxd-fb-amber-dark':       '#ffd080',  // warning text (11:1 on night-950)

      // Smash list
      '--pxd-fb-smash-text':       '#c8e6a0',
      '--pxd-fb-smash-hint':       '#a0c878',
      '--pxd-fb-smash-grad-start': '#0a2a12',
      '--pxd-fb-smash-grad-end':   '#051a0a',

      // ── Semantic Overrides ──────────────────────────────────────────────────

      // Surface
      '--pxd-color-surface-page':      'var(--pxd-fb-night-950)',
      '--pxd-color-surface-page-alt':  'var(--pxd-fb-night-900)',
      '--pxd-color-surface-primary':   'var(--pxd-fb-night-800)',
      '--pxd-color-surface-secondary': 'var(--pxd-fb-night-950)',
      '--pxd-color-surface-raised':    'var(--pxd-fb-night-700)',
      '--pxd-color-surface-overlay':   'color-mix(in srgb, var(--pxd-fb-night-950) 88%, transparent)',
      '--pxd-color-surface-inverse':   'var(--pxd-fb-text-50)',
      '--pxd-color-surface-disabled':  'var(--pxd-fb-night-600)',

      // Text
      '--pxd-color-text-primary':   'var(--pxd-fb-text-50)',
      '--pxd-color-text-secondary': 'var(--pxd-fb-text-200)',
      '--pxd-color-text-tertiary':  'var(--pxd-fb-text-muted)',
      '--pxd-color-text-inverse':   'var(--pxd-fb-night-950)',
      '--pxd-color-text-disabled':  'var(--pxd-fb-text-muted)',
      '--pxd-color-text-accent':    'var(--pxd-fb-glow-300)',
      '--pxd-color-text-success':   'var(--pxd-fb-glow-300)',
      '--pxd-color-text-warning':   'var(--pxd-fb-amber-dark)',
      '--pxd-color-text-danger':    'var(--pxd-fb-danger-dark)',

      // Border
      '--pxd-color-border-outline-variant':    'color-mix(in srgb, var(--pxd-fb-glow-300) 15%, transparent)',
      '--pxd-color-border-outline':            'color-mix(in srgb, var(--pxd-fb-glow-300) 28%, transparent)',
      '--pxd-color-border-interactive':        'color-mix(in srgb, var(--pxd-fb-glow-300) 50%, transparent)',
      '--pxd-color-border-interactive-active': 'var(--pxd-fb-glow-300)',
      '--pxd-color-border-inverse':            'var(--pxd-fb-night-950)',
      '--pxd-color-border-focus':              'var(--pxd-fb-glow-300)',
      '--pxd-color-border-danger':             'var(--pxd-fb-danger-dark)',

      // Feedback
      '--pxd-color-feedback-info':    'var(--pxd-fb-glow-300)',
      '--pxd-color-feedback-success': 'var(--pxd-fb-glow-300)',
      '--pxd-color-feedback-warning': 'var(--pxd-fb-amber-dark)',
      '--pxd-color-feedback-danger':  'var(--pxd-fb-danger-dark)',

      // Action
      '--pxd-color-action-primary':           'var(--pxd-fb-glow-300)',
      '--pxd-color-action-primary-hover':     'var(--pxd-fb-glow-500)',
      '--pxd-color-action-primary-pressed':   'var(--pxd-fb-glow-700)',
      '--pxd-color-action-secondary':         'var(--pxd-fb-night-800)',
      '--pxd-color-action-secondary-hover':   'var(--pxd-fb-night-700)',
      '--pxd-color-action-secondary-pressed': 'var(--pxd-fb-night-500)',
      '--pxd-color-action-ghost-hover':       'color-mix(in srgb, var(--pxd-fb-glow-300) 10%, transparent)',
      '--pxd-color-action-ghost-pressed':     'color-mix(in srgb, var(--pxd-fb-glow-300) 18%, transparent)',
      '--pxd-color-action-disabled':          'var(--pxd-fb-night-600)',

      // Focus
      '--pxd-color-focus-ring':        'color-mix(in srgb, var(--pxd-fb-glow-300) 80%, transparent)',
      '--pxd-color-focus-ring-offset': 'var(--pxd-fb-night-950)',

      // ── Component Tokens (--pd-*) ───────────────────────────────────────────

      '--pd-color-background-default':  'var(--pxd-fb-night-950)',
      '--pd-color-background-elevated': 'var(--pxd-fb-night-800)',
      '--pd-color-background-hover':    'var(--pxd-fb-night-700)',

      '--pd-color-text-primary':   'var(--pxd-fb-text-50)',
      '--pd-color-text-secondary': 'var(--pxd-fb-text-200)',
      '--pd-color-text-muted':     'var(--pxd-fb-text-muted)',

      '--pd-color-accent-default': 'var(--pxd-fb-glow-300)',
      '--pd-color-accent-hover':   'var(--pxd-fb-glow-500)',
      '--pd-color-accent-subtle':  'color-mix(in srgb, var(--pxd-fb-glow-300) 12%, transparent)',
      '--pd-color-accent-filled':  'var(--pxd-fb-glow-300)', // bright glow fill, paired with night text
      '--pd-color-accent-text':    'var(--pxd-fb-night-950)',   // dark text on bright glow

      '--pd-color-shadow-default': 'color-mix(in srgb, var(--pxd-fb-glow-300) 15%, transparent)',

      '--pd-color-semantic-success':      'var(--pxd-fb-glow-300)',
      '--pd-color-semantic-successHover': 'var(--pxd-fb-glow-500)',
      '--pd-color-semantic-successText':  'var(--pxd-fb-night-950)',
      '--pd-color-semantic-danger':       'var(--pxd-fb-danger-bg-dark)',
      '--pd-color-semantic-dangerText':   '#ffffff',
      '--pd-color-semantic-warning':      'var(--pxd-fb-amber-dark)',

      '--pd-color-smash-border':        'var(--pxd-fb-glow-300)',
      '--pd-color-smash-text':          'var(--pxd-fb-smash-text)',
      '--pd-color-smash-hint':          'var(--pxd-fb-smash-hint)',
      '--pd-color-smash-gradientStart': 'var(--pxd-fb-smash-grad-start)',
      '--pd-color-smash-gradientEnd':   'var(--pxd-fb-smash-grad-end)',

      '--pd-color-focus-ring':       'color-mix(in srgb, var(--pxd-fb-glow-300) 80%, transparent)',
      '--pd-color-overlay-backdrop': 'color-mix(in srgb, var(--pxd-fb-night-950) 85%, transparent)',

      '--pd-effect-particle-1': '#c8e6a0',   // firefly glow
      '--pd-effect-particle-2': '#4aaa4a',   // leaf green
      '--pd-effect-particle-3': '#f0ff80',   // bright firefly
      '--pd-effect-particle-4': '#78a050',   // deep leaf
    },

    // =========================================================================
    // LIGHT MODE (昼 – Daytime forest)
    // =========================================================================
    light: {
      // ── Theme Primitives (Light) ────────────────────────────────────────────

      // Sky backgrounds
      '--pxd-fb-sky-50':  '#d4f0f8',   // page bg
      '--pxd-fb-sky-100': '#c0e8f4',   // page-alt
      '--pxd-fb-sky-200': '#a8ddf0',   // surface-primary

      // Forest greens for actions / accent
      '--pxd-fb-leaf-300': '#7acc7a',  // light green (surface hover overlay)
      '--pxd-fb-leaf-500': '#4aaa4a',  // primary display green
      '--pxd-fb-leaf-700': '#2d6b2d',  // action primary (5:1 on sky bg; white text 5.9:1 ✓)
      '--pxd-fb-leaf-900': '#1a4219',  // deep forest / pressed

      // Sunny yellow (accent / particle – decorative in light mode)
      '--pxd-fb-sun-400': '#f9e04b',   // bright yellow

      // Ground / bark (text hierarchy)
      '--pxd-fb-bark-900': '#1a2a18',  // text-primary (~11:1 on sky bg)
      '--pxd-fb-bark-700': '#2d4a28',  // text-secondary (~7.5:1)
      '--pxd-fb-bark-500': '#4a6a40',  // text-tertiary / muted (~4.5:1)

      // Mossy raised surfaces
      '--pxd-fb-moss-100': '#e8f8e8',  // surface raised
      '--pxd-fb-moss-200': '#d0ecd0',  // elevated / hover

      // Feedback / semantic
      '--pxd-fb-danger-light':       '#b03020',  // danger text/border (5.5:1 on sky)
      '--pxd-fb-danger-light-hover': '#7a1a10',  // danger hover bg
      '--pxd-fb-amber-light':        '#886000',  // warning text (4.8:1 on sky)
      '--pxd-fb-success-light':      '#1a6a1a',  // success text (5.2:1 on sky)
      '--pxd-fb-success-light-hover': '#0f4a0f',

      // Smash list
      '--pxd-fb-smash-text-light':       '#1a5a1a',
      '--pxd-fb-smash-hint-light':       '#3a7a3a',
      '--pxd-fb-smash-grad-start-light': '#ddf8dd',
      '--pxd-fb-smash-grad-end-light':   '#c8f0c8',

      // ── Semantic Overrides ──────────────────────────────────────────────────

      // Surface
      '--pxd-color-surface-page':      'var(--pxd-fb-sky-50)',
      '--pxd-color-surface-page-alt':  'var(--pxd-fb-sky-100)',
      '--pxd-color-surface-primary':   'var(--pxd-fb-sky-200)',
      '--pxd-color-surface-secondary': 'var(--pxd-fb-sky-50)',
      '--pxd-color-surface-raised':    'var(--pxd-fb-moss-100)',
      '--pxd-color-surface-overlay':   'color-mix(in srgb, var(--pxd-fb-bark-900) 65%, transparent)',
      '--pxd-color-surface-inverse':   'var(--pxd-fb-bark-900)',
      '--pxd-color-surface-disabled':  'var(--pxd-fb-sky-200)',

      // Text
      '--pxd-color-text-primary':   'var(--pxd-fb-bark-900)',
      '--pxd-color-text-secondary': 'var(--pxd-fb-bark-700)',
      '--pxd-color-text-tertiary':  'var(--pxd-fb-bark-500)',
      '--pxd-color-text-inverse':   'var(--pxd-fb-sky-50)',
      '--pxd-color-text-disabled':  'var(--pxd-fb-bark-500)',
      '--pxd-color-text-accent':    'var(--pxd-fb-leaf-700)',
      '--pxd-color-text-success':   'var(--pxd-fb-success-light)',
      '--pxd-color-text-warning':   'var(--pxd-fb-amber-light)',
      '--pxd-color-text-danger':    'var(--pxd-fb-danger-light)',

      // Border
      '--pxd-color-border-outline-variant':    'color-mix(in srgb, var(--pxd-fb-leaf-700) 20%, transparent)',
      '--pxd-color-border-outline':            'color-mix(in srgb, var(--pxd-fb-leaf-700) 38%, transparent)',
      '--pxd-color-border-interactive':        'var(--pxd-fb-leaf-700)',
      '--pxd-color-border-interactive-active': 'var(--pxd-fb-leaf-900)',
      '--pxd-color-border-inverse':            'var(--pxd-fb-sky-50)',
      '--pxd-color-border-focus':              'var(--pxd-fb-leaf-700)',
      '--pxd-color-border-danger':             'var(--pxd-fb-danger-light)',

      // Feedback
      '--pxd-color-feedback-info':    'var(--pxd-fb-leaf-700)',
      '--pxd-color-feedback-success': 'var(--pxd-fb-success-light)',
      '--pxd-color-feedback-warning': 'var(--pxd-fb-amber-light)',
      '--pxd-color-feedback-danger':  'var(--pxd-fb-danger-light)',

      // Action
      '--pxd-color-action-primary':           'var(--pxd-fb-leaf-700)',
      '--pxd-color-action-primary-hover':     'var(--pxd-fb-leaf-900)',
      '--pxd-color-action-primary-pressed':   '#0f2e0f',
      '--pxd-color-action-secondary':         'var(--pxd-fb-sky-200)',
      '--pxd-color-action-secondary-hover':   'var(--pxd-fb-moss-200)',
      '--pxd-color-action-secondary-pressed': 'var(--pxd-fb-leaf-300)',
      '--pxd-color-action-ghost-hover':       'color-mix(in srgb, var(--pxd-fb-leaf-700) 10%, transparent)',
      '--pxd-color-action-ghost-pressed':     'color-mix(in srgb, var(--pxd-fb-leaf-700) 20%, transparent)',
      '--pxd-color-action-disabled':          'var(--pxd-fb-sky-200)',

      // Focus
      '--pxd-color-focus-ring':        'color-mix(in srgb, var(--pxd-fb-leaf-700) 80%, transparent)',
      '--pxd-color-focus-ring-offset': 'var(--pxd-fb-sky-50)',

      // ── Component Tokens (--pd-*) ───────────────────────────────────────────

      '--pd-color-background-default':  'var(--pxd-fb-sky-50)',
      '--pd-color-background-elevated': 'var(--pxd-fb-moss-100)',
      '--pd-color-background-hover':    'var(--pxd-fb-moss-200)',

      '--pd-color-text-primary':   'var(--pxd-fb-bark-900)',
      '--pd-color-text-secondary': 'var(--pxd-fb-bark-700)',
      '--pd-color-text-muted':     'var(--pxd-fb-bark-500)',

      '--pd-color-accent-default': 'var(--pxd-fb-leaf-700)',
      '--pd-color-accent-hover':   'var(--pxd-fb-leaf-900)',
      '--pd-color-accent-subtle':  'color-mix(in srgb, var(--pxd-fb-leaf-700) 12%, transparent)',
      '--pd-color-accent-filled':  'var(--pxd-fb-leaf-700)', // dark green fill, paired with white text (5.9:1 ✓)
      '--pd-color-accent-text':    '#ffffff',   // white on dark green (5.9:1 ✓)

      '--pd-color-shadow-default': 'color-mix(in srgb, var(--pxd-fb-leaf-700) 22%, transparent)',

      '--pd-color-semantic-success':      'var(--pxd-fb-success-light)',
      '--pd-color-semantic-successHover': 'var(--pxd-fb-success-light-hover)',
      '--pd-color-semantic-successText':  '#ffffff',
      '--pd-color-semantic-danger':       'var(--pxd-fb-danger-light)',
      '--pd-color-semantic-dangerText':   '#ffffff',
      '--pd-color-semantic-warning':      'var(--pxd-fb-amber-light)',

      '--pd-color-smash-border':        'var(--pxd-fb-leaf-700)',
      '--pd-color-smash-text':          'var(--pxd-fb-smash-text-light)',
      '--pd-color-smash-hint':          'var(--pxd-fb-smash-hint-light)',
      '--pd-color-smash-gradientStart': 'var(--pxd-fb-smash-grad-start-light)',
      '--pd-color-smash-gradientEnd':   'var(--pxd-fb-smash-grad-end-light)',

      '--pd-color-focus-ring':       'color-mix(in srgb, var(--pxd-fb-leaf-700) 80%, transparent)',
      '--pd-color-overlay-backdrop': 'color-mix(in srgb, var(--pxd-fb-bark-900) 60%, transparent)',

      '--pd-effect-particle-1': '#4aaa4a',   // leaf green
      '--pd-effect-particle-2': '#2d6b2d',   // forest green
      '--pd-effect-particle-3': '#f9e04b',   // sun yellow
      '--pd-effect-particle-4': '#7acc7a',   // light green
    },
  },
  effectsStyle: 'pixel',
  soundPackKey: 'forest',
};
