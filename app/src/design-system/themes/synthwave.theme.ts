import type { VisualTheme } from './themeRegistry';

/**
 * Synthwave theme – 80s sci-fi aesthetic.
 * Deep navy backgrounds, magenta borders, neon cyan accents, Orbitron/Share Tech Mono fonts.
 *
 * Token architecture (3 layers in each mode):
 *
 *   1. Theme primitives   --pxd-sw-*       raw color palette for this theme
 *          ↓ var() reference
 *   2. Semantic overrides --pxd-color-*    override base token semantics
 *          ↓ var() reference
 *   3. Component tokens   --pd-color-*     override legacy component-level vars
 *
 * Global primitives referenced directly (no --pxd-sw- prefix needed):
 *   --pxd-magenta-300/500/700/900   (tokens.css)
 *   --pxd-teal-500/700/900          (tokens.css)
 *   --pxd-lavender-50…500           (tokens.css)
 *   --pxd-violet-600/700/900        (tokens.css)
 *   --pxd-purple-300                (tokens.css – reused for dark text-secondary)
 *   --pxd-white                     (tokens.css)
 */
export const synthwaveTheme: VisualTheme = {
  key: 'synthwave',
  name: 'Synthwave',
  icon: '🌆',
  isPremium: false,
  fontImportUrl:
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap',
  cssVariables: {
    // =========================================================================
    // DARK MODE
    // =========================================================================
    dark: {
      // ── Theme Primitives (Dark) ─────────────────────────────────────────────

      // Navy / Space backgrounds
      '--pxd-sw-navy-950': '#07071A',   // deepest – page
      '--pxd-sw-navy-900': '#0A0A22',   // page alt
      '--pxd-sw-navy-800': '#10103A',   // surface primary
      '--pxd-sw-navy-700': '#1A1A50',   // surface raised / action-secondary
      '--pxd-sw-navy-600': '#1E1E5A',   // action-disabled surface
      '--pxd-sw-navy-500': '#24247A',   // action-secondary pressed

      // Neon cyan accent
      '--pxd-sw-neon-cyan-300': '#00FFF0',   // default accent  (bg→dark-text 16:1)
      '--pxd-sw-neon-cyan-500': '#00CCC8',   // hover
      '--pxd-sw-neon-cyan-700': '#009E9B',   // pressed

      // Neon green success
      '--pxd-sw-neon-green-300': '#00FF88',  // default  (bg→dark-text 15:1)
      '--pxd-sw-neon-green-500': '#00CC66',  // hover

      // Hot red danger
      // 300 = text/border use on dark bg   (contrast 5.7:1 on navy-950)
      // 500 = button bg with white text    (contrast 5.3:1 – WCAG AA ✓)
      '--pxd-sw-hot-red-300': '#FF2D55',
      '--pxd-sw-hot-red-500': '#D01843',

      // Amber warning (11.7:1 as text on navy-950)
      '--pxd-sw-amber-500': '#FFB800',

      // Purple-tinted text
      '--pxd-sw-purple-text-50': '#EEDDFF',  // text-primary  (~12:1 on navy-950)
      '--pxd-sw-purple-muted':   '#9070C0',  // text-muted / disabled  (5.1:1 on navy-950)
      // Neutral "chrome" color (borders/shadows/hover tints) for usability
      '--pxd-sw-chrome':         'var(--pxd-sw-purple-muted)',

      // Smash list
      '--pxd-sw-smash-text':       '#DD00DD',
      '--pxd-sw-smash-hint':       '#CC44CC',
      '--pxd-sw-smash-grad-start': '#1A004A',
      '--pxd-sw-smash-grad-end':   '#000A3A',

      // ── Semantic Overrides ──────────────────────────────────────────────────

      // Surface
      '--pxd-color-surface-page':      'var(--pxd-sw-navy-950)',
      '--pxd-color-surface-page-alt':  'var(--pxd-sw-navy-900)',
      '--pxd-color-surface-primary':   'var(--pxd-sw-navy-800)',
      '--pxd-color-surface-secondary': 'var(--pxd-sw-navy-950)',
      '--pxd-color-surface-raised':    'var(--pxd-sw-navy-700)',
      '--pxd-color-surface-overlay':   'color-mix(in srgb, var(--pxd-sw-navy-950) 88%, transparent)',
      '--pxd-color-surface-inverse':   'var(--pxd-sw-purple-text-50)',
      '--pxd-color-surface-disabled':  'var(--pxd-sw-navy-600)',

      // Text
      '--pxd-color-text-primary':   'var(--pxd-sw-purple-text-50)',
      '--pxd-color-text-secondary': 'var(--pxd-purple-300)',        // #B79CFF – reuses global primitive
      '--pxd-color-text-tertiary':  'var(--pxd-sw-purple-muted)',
      '--pxd-color-text-inverse':   'var(--pxd-sw-navy-950)',
      '--pxd-color-text-disabled':  'var(--pxd-sw-purple-muted)',
      '--pxd-color-text-accent':    'var(--pxd-sw-neon-cyan-300)',
      '--pxd-color-text-success':   'var(--pxd-sw-neon-green-300)',
      '--pxd-color-text-warning':   'var(--pxd-sw-amber-500)',
      '--pxd-color-text-danger':    'var(--pxd-sw-hot-red-300)',

      // Border
      // Neutralized borders for usability (reduce "hot pink" hue entirely)
      '--pxd-color-border-outline-variant':    'color-mix(in srgb, var(--pxd-sw-chrome) 22%, transparent)',
      '--pxd-color-border-outline':            'color-mix(in srgb, var(--pxd-sw-chrome) 34%, transparent)',
      '--pxd-color-border-interactive':        'color-mix(in srgb, var(--pxd-sw-chrome) 55%, transparent)',
      '--pxd-color-border-interactive-active': 'var(--pxd-sw-chrome)',
      '--pxd-color-border-inverse':            'var(--pxd-sw-navy-950)',
      '--pxd-color-border-focus':              'var(--pxd-sw-neon-cyan-300)',
      '--pxd-color-border-danger':             'var(--pxd-sw-hot-red-300)',

      // Feedback
      '--pxd-color-feedback-info':    'var(--pxd-sw-neon-cyan-300)',
      '--pxd-color-feedback-success': 'var(--pxd-sw-neon-green-300)',
      '--pxd-color-feedback-warning': 'var(--pxd-sw-amber-500)',
      '--pxd-color-feedback-danger':  'var(--pxd-sw-hot-red-300)',

      // Action
      '--pxd-color-action-primary':           'var(--pxd-sw-neon-cyan-300)',
      '--pxd-color-action-primary-hover':     'var(--pxd-sw-neon-cyan-500)',
      '--pxd-color-action-primary-pressed':   'var(--pxd-sw-neon-cyan-700)',
      '--pxd-color-action-secondary':         'var(--pxd-sw-navy-800)',
      '--pxd-color-action-secondary-hover':   'var(--pxd-sw-navy-700)',
      '--pxd-color-action-secondary-pressed': 'var(--pxd-sw-navy-500)',
      '--pxd-color-action-ghost-hover':       'color-mix(in srgb, var(--pxd-sw-chrome) 10%, transparent)',
      '--pxd-color-action-ghost-pressed':     'color-mix(in srgb, var(--pxd-sw-chrome) 18%, transparent)',
      '--pxd-color-action-disabled':          'var(--pxd-sw-navy-600)',

      // Focus
      '--pxd-color-focus-ring':        'color-mix(in srgb, var(--pxd-sw-neon-cyan-300) 80%, transparent)',
      '--pxd-color-focus-ring-offset': 'var(--pxd-sw-navy-950)',

      // ── Component Tokens (--pd-*) ───────────────────────────────────────────

      '--pd-color-background-default':  'var(--pxd-sw-navy-950)',
      '--pd-color-background-elevated': 'var(--pxd-sw-navy-800)',
      '--pd-color-background-hover':    'var(--pxd-sw-navy-700)',

      '--pd-color-text-primary':   'var(--pxd-sw-purple-text-50)',
      '--pd-color-text-secondary': 'var(--pxd-purple-300)',
      '--pd-color-text-muted':     'var(--pxd-sw-purple-muted)',



      '--pd-color-accent-default': 'var(--pxd-sw-neon-cyan-300)',
      '--pd-color-accent-hover':   'var(--pxd-sw-neon-cyan-500)',
      '--pd-color-accent-subtle':  'color-mix(in srgb, var(--pxd-sw-neon-cyan-300) 12%, transparent)',
      '--pd-color-accent-text':    'var(--pxd-sw-navy-950)',   // dark text on bright cyan

      // Shadows were too magenta-heavy; use neutral purple-muted instead
      '--pd-color-shadow-default': 'color-mix(in srgb, var(--pxd-sw-chrome) 18%, transparent)',

      '--pd-color-semantic-success':      'var(--pxd-sw-neon-green-300)',
      '--pd-color-semantic-successHover': 'var(--pxd-sw-neon-green-500)',
      '--pd-color-semantic-successText':  'var(--pxd-sw-navy-950)',   // dark text on bright green
      '--pd-color-semantic-danger':       'var(--pxd-sw-hot-red-500)',
      '--pd-color-semantic-dangerText':   'var(--pxd-white)',
      '--pd-color-semantic-warning':      'var(--pxd-sw-amber-500)',

      // Keep Smash identity separate from global "chrome" borders; use neutral border color
      '--pd-color-smash-border':        'var(--pxd-sw-chrome)',
      '--pd-color-smash-text':          'var(--pxd-sw-smash-text)',
      '--pd-color-smash-hint':          'var(--pxd-sw-smash-hint)',
      '--pd-color-smash-gradientStart': 'var(--pxd-sw-smash-grad-start)',
      '--pd-color-smash-gradientEnd':   'var(--pxd-sw-smash-grad-end)',

      '--pd-color-focus-ring':       'color-mix(in srgb, var(--pxd-sw-neon-cyan-300) 80%, transparent)',
      '--pd-color-overlay-backdrop': 'color-mix(in srgb, var(--pxd-sw-navy-950) 85%, transparent)',

      '--pd-font-brand':    "'Orbitron', 'Courier New', monospace",
      '--pd-font-brand-ja': "'Orbitron', 'Courier New', monospace",
      '--pd-font-body':     "'Share Tech Mono', 'Courier New', monospace",
    },

    // =========================================================================
    // LIGHT MODE
    // =========================================================================
    light: {
      // ── Theme Primitives (Light) ────────────────────────────────────────────

      '--pxd-sw-danger-light':           '#CC0033',  // danger  (5.1:1 on lavender-50, white text 5.7:1)
      '--pxd-sw-success-light':          '#006644',  // success text/feedback  (4.7:1 on lavender-50)
      '--pxd-sw-success-light-hover':    '#004422',  // success hover bg
      '--pxd-sw-amber-light':            '#996600',  // warning text  (4.5:1 on lavender-50)

      '--pxd-sw-smash-text-light':       '#8800AA',  // smash text  (7.0:1 on lavender-50)
      '--pxd-sw-smash-hint-light':       '#AA44AA',  // smash hint
      '--pxd-sw-smash-grad-start-light': '#F0E6FF',
      '--pxd-sw-smash-grad-end-light':   '#E0D0FF',

      // ── Semantic Overrides ──────────────────────────────────────────────────

      // Surface  (global lavender scale)
      '--pxd-color-surface-page':      'var(--pxd-lavender-50)',
      '--pxd-color-surface-page-alt':  'var(--pxd-lavender-100)',
      '--pxd-color-surface-primary':   'var(--pxd-lavender-200)',
      '--pxd-color-surface-secondary': 'var(--pxd-lavender-50)',
      '--pxd-color-surface-raised':    'var(--pxd-white)',
      '--pxd-color-surface-overlay':   'color-mix(in srgb, var(--pxd-violet-900) 65%, transparent)',
      '--pxd-color-surface-inverse':   'var(--pxd-violet-900)',
      '--pxd-color-surface-disabled':  'var(--pxd-lavender-300)',

      // Text  (global violet scale)
      '--pxd-color-text-primary':   'var(--pxd-violet-900)',
      '--pxd-color-text-secondary': 'var(--pxd-violet-700)',
      '--pxd-color-text-tertiary':  'var(--pxd-violet-600)',
      '--pxd-color-text-inverse':   'var(--pxd-lavender-50)',
      '--pxd-color-text-disabled':  'var(--pxd-violet-600)',   // ~3.5:1 on lavender bg
      '--pxd-color-text-accent':    'var(--pxd-teal-500)',
      '--pxd-color-text-success':   'var(--pxd-sw-success-light)',
      '--pxd-color-text-warning':   'var(--pxd-sw-amber-light)',
      '--pxd-color-text-danger':    'var(--pxd-sw-danger-light)',

      // Border  (global magenta + teal scales)
      '--pxd-color-border-outline-variant':    'color-mix(in srgb, var(--pxd-magenta-700) 20%, transparent)',
      '--pxd-color-border-outline':            'color-mix(in srgb, var(--pxd-magenta-700) 40%, transparent)',
      '--pxd-color-border-interactive':        'var(--pxd-magenta-700)',
      '--pxd-color-border-interactive-active': 'var(--pxd-magenta-500)',
      '--pxd-color-border-inverse':            'var(--pxd-lavender-50)',
      '--pxd-color-border-focus':              'var(--pxd-teal-500)',
      '--pxd-color-border-danger':             'var(--pxd-sw-danger-light)',

      // Feedback
      '--pxd-color-feedback-info':    'var(--pxd-teal-500)',
      '--pxd-color-feedback-success': 'var(--pxd-sw-success-light)',
      '--pxd-color-feedback-warning': 'var(--pxd-sw-amber-light)',
      '--pxd-color-feedback-danger':  'var(--pxd-sw-danger-light)',

      // Action  (global teal + lavender scales)
      '--pxd-color-action-primary':           'var(--pxd-teal-500)',
      '--pxd-color-action-primary-hover':     'var(--pxd-teal-700)',
      '--pxd-color-action-primary-pressed':   'var(--pxd-teal-900)',
      '--pxd-color-action-secondary':         'var(--pxd-lavender-200)',
      '--pxd-color-action-secondary-hover':   'var(--pxd-lavender-300)',
      '--pxd-color-action-secondary-pressed': 'var(--pxd-lavender-400)',
      '--pxd-color-action-ghost-hover':       'color-mix(in srgb, var(--pxd-magenta-700) 10%, transparent)',
      '--pxd-color-action-ghost-pressed':     'color-mix(in srgb, var(--pxd-magenta-700) 20%, transparent)',
      '--pxd-color-action-disabled':          'var(--pxd-lavender-500)',

      // Focus
      '--pxd-color-focus-ring':        'color-mix(in srgb, var(--pxd-teal-500) 80%, transparent)',
      '--pxd-color-focus-ring-offset': 'var(--pxd-lavender-50)',

      // ── Component Tokens (--pd-*) ───────────────────────────────────────────

      '--pd-color-background-default':  'var(--pxd-lavender-50)',
      '--pd-color-background-elevated': 'var(--pxd-lavender-200)',
      '--pd-color-background-hover':    'var(--pxd-lavender-300)',

      '--pd-color-text-primary':   'var(--pxd-violet-900)',
      '--pd-color-text-secondary': 'var(--pxd-violet-700)',
      '--pd-color-text-muted':     'var(--pxd-violet-600)',



      '--pd-color-accent-default': 'var(--pxd-teal-500)',
      '--pd-color-accent-hover':   'var(--pxd-teal-700)',
      '--pd-color-accent-subtle':  'color-mix(in srgb, var(--pxd-teal-500) 12%, transparent)',
      '--pd-color-accent-text':    'var(--pxd-white)',   // white text on dark teal (8:1)

      '--pd-color-shadow-default': 'color-mix(in srgb, var(--pxd-magenta-700) 25%, transparent)',

      '--pd-color-semantic-success':      'var(--pxd-sw-success-light)',
      '--pd-color-semantic-successHover': 'var(--pxd-sw-success-light-hover)',
      '--pd-color-semantic-successText':  'var(--pxd-white)',
      '--pd-color-semantic-danger':       'var(--pxd-sw-danger-light)',
      '--pd-color-semantic-dangerText':   'var(--pxd-white)',
      '--pd-color-semantic-warning':      'var(--pxd-sw-amber-light)',

      '--pd-color-smash-border':        'var(--pxd-magenta-700)',
      '--pd-color-smash-text':          'var(--pxd-sw-smash-text-light)',
      '--pd-color-smash-hint':          'var(--pxd-sw-smash-hint-light)',
      '--pd-color-smash-gradientStart': 'var(--pxd-sw-smash-grad-start-light)',
      '--pd-color-smash-gradientEnd':   'var(--pxd-sw-smash-grad-end-light)',

      '--pd-color-focus-ring':       'color-mix(in srgb, var(--pxd-teal-500) 80%, transparent)',
      '--pd-color-overlay-backdrop': 'color-mix(in srgb, var(--pxd-violet-900) 60%, transparent)',

      '--pd-font-brand':    "'Orbitron', 'Courier New', monospace",
      '--pd-font-brand-ja': "'Orbitron', 'Courier New', monospace",
      '--pd-font-body':     "'Share Tech Mono', 'Courier New', monospace",
    },
  },
  effectsStyle: 'glow',
  soundPackKey: 'synth',
};
