/**
 * Pixdone color tokens.
 *
 * Architecture: Primitive → Semantic → (Component)
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ core      Raw palette. Every named color swatch lives here.     │
 * │           Referenced by semantic and brand layers.              │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ semantic  UI-role mapping (surface / text / border / …).        │
 * │           Contains both light and dark mode values.             │
 * │           Component styles should only reference semantic tokens.│
 * ├──────────────────────────────────────────────────────────────────┤
 * │ brand     Identity colors (rarity, glows, pixel-art accents).   │
 * │           Mode-invariant; same value in light and dark.         │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * The CSS layer (tokens.css) turns these into:
 *   --pxd-{color}-{step}        ← primitives
 *   --pxd-color-{role}-{variant} ← semantics (overridden per mode)
 */

export const color = {
  // ─────────────────────────────────────────────────────────────────
  // PRIMITIVE – core palette
  // ─────────────────────────────────────────────────────────────────
  core: {
    white: "#FFFFFF",
    black: "#111111",

    // Neutral light scale  (light mode surfaces & text)
    gray0:   "#FCFCFC",
    gray50:  "#F7F7F8",
    gray100: "#EFEFF1",
    gray200: "#DDDEE3",
    gray300: "#C7C9D1",
    gray400: "#A6AAB6",
    gray500: "#858B99",
    gray600: "#666C7A",
    gray700: "#4C5160",
    gray800: "#2E3440",
    gray900: "#191D24",

    // Ink scale – cool blue-gray tones used in dark mode
    // ink50–300  = dark-mode text / border values  (lighter end)
    // ink400–950 = dark-mode surface values        (darker end)
    ink50:  "#E8EBF4",
    ink100: "#9DA3B4",
    ink200: "#5E6478",
    ink300: "#404758",
    ink400: "#363E55",
    ink500: "#354262",
    ink600: "#2E3A52",
    ink700: "#252D40",
    ink800: "#1E2435",
    ink900: "#1A1F2C",
    ink950: "#12151C",

    // Blue
    blue300: "#7BB4FF",
    blue500: "#4C8DFF",
    blue700: "#2D5BDB",

    // Green
    green300: "#7EE3A7",
    green350: "#5CE896",  // dark mode text-success
    green400: "#4CD98A",  // dark mode feedback-success
    green500: "#35C26B",
    green700: "#1D8F4A",

    // Yellow
    yellow300: "#FFD86B",
    yellow500: "#F5B82E",
    yellow700: "#B78112",

    // Red
    red300: "#FF9C96",    // brand smash
    red400: "#FF7070",    // dark mode danger (text / feedback / border)
    red500: "#E85D5D",
    red700: "#B93D3D",

    // Purple
    purple50:  "#F3F1FF",  // light mode action-secondary-hover
    purple100: "#E6E1FF",  // light mode action-secondary-pressed
    purple300: "#B79CFF",
    purple400: "#A590FF",  // dark mode text-accent & action-primary-hover
    purple500: "#7B61FF",
    purple600: "#6B52F0",
    purple700: "#5B43D6",

    // Pink
    pink300: "#FF9DE1",
    pink500: "#F45CCB",
    pink700: "#C73CA1",

    // Cyan
    cyan300: "#8FE7FF",
    cyan500: "#43CBEA",
    cyan700: "#2396B2",
  },

  // ─────────────────────────────────────────────────────────────────
  // SEMANTIC – light mode
  // ─────────────────────────────────────────────────────────────────
  semantic: {
    light: {
      surface: {
        page:     "#F7F7F8",  // gray50
        pageAlt:  "#EFEFF1",  // gray100
        primary:  "#FFFFFF",  // white
        secondary:"#F7F7F8",  // gray50
        raised:   "#FFFFFF",  // white
        overlay:  "rgba(17, 17, 17, 0.64)",
        inverse:  "#191D24",  // gray900
        disabled: "#DDDEE3",  // gray200
      },
      text: {
        primary:  "#191D24",  // gray900
        secondary:"#4C5160",  // gray700
        tertiary: "#666C7A",  // gray600
        inverse:  "#FFFFFF",  // white
        disabled: "#858B99",  // gray500
        accent:   "#5B43D6",  // purple700
        success:  "#1D8F4A",  // green700
        warning:  "#B78112",  // yellow700
        danger:   "#B93D3D",  // red700
      },
      border: {
        outlineVariant:    "#DDDEE3",  // gray200 – subtle dividers
        outline:           "#C5C8D2",  // gray300 – structural containers
        interactive:       "#A6AAB6",  // gray400 – input rest state
        interactiveActive: "#2E3440",  // gray800 – input hover/active
        inverse: "#FFFFFF",  // white
        focus:   "#7B61FF",  // purple500
        danger:  "#E85D5D",  // red500
      },
      feedback: {
        info:    "#43CBEA",  // cyan500
        success: "#35C26B",  // green500
        warning: "#F5B82E",  // yellow500
        danger:  "#E85D5D",  // red500
      },
      action: {
        primary:           "#7B61FF",  // purple500
        primaryHover:      "#6B52F0",  // purple600
        primaryPressed:    "#5B43D6",  // purple700
        secondary:         "#FFFFFF",  // white
        secondaryHover:    "#F3F1FF",  // purple50
        secondaryPressed:  "#E6E1FF",  // purple100
        ghostHover:        "#EFEFF1",  // gray100
        ghostPressed:      "#DDDEE3",  // gray200
        disabled:          "#C7C9D1",  // gray300
      },
      focus: {
        ring:       "#7B61FF",  // purple500
        ringOffset: "#FFFFFF",  // white
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // SEMANTIC – dark mode
    // ─────────────────────────────────────────────────────────────────
    dark: {
      surface: {
        page:     "#12151C",  // ink950
        pageAlt:  "#1A1F2C",  // ink900
        primary:  "#1E2435",  // ink800
        secondary:"#12151C",  // ink950
        raised:   "#252D40",  // ink700
        overlay:  "rgba(0, 0, 0, 0.75)",
        inverse:  "#F7F7F8",  // gray50
        disabled: "#1E2435",  // ink800
      },
      text: {
        primary:  "#E8EBF4",  // ink50
        secondary:"#9DA3B4",  // ink100
        tertiary: "#5E6478",  // ink200
        inverse:  "#191D24",  // gray900
        disabled: "#404758",  // ink300
        accent:   "#A590FF",  // purple400
        success:  "#5CE896",  // green350
        warning:  "#FFD86B",  // yellow300
        danger:   "#FF7070",  // red400
      },
      border: {
        outlineVariant:    "#252D40",  // ink700 – subtle dividers
        outline:           "#363E55",  // ink500 – structural containers
        interactive:       "#5C657A",  // ink300 – input rest state
        interactiveActive: "#9DA3B4",  // ink100 – input hover/active
        inverse: "#191D24",  // gray900
        focus:   "#A590FF",  // purple400
        danger:  "#FF7070",  // red400
      },
      feedback: {
        info:    "#8FE7FF",  // cyan300
        success: "#4CD98A",  // green400
        warning: "#FFD86B",  // yellow300
        danger:  "#FF7070",  // red400
      },
      action: {
        primary:           "#7B61FF",  // purple500
        primaryHover:      "#A590FF",  // purple400
        primaryPressed:    "#6B52F0",  // purple600
        secondary:         "#252D40",  // ink700
        secondaryHover:    "#2E3A52",  // ink600
        secondaryPressed:  "#354262",  // ink500
        ghostHover:        "#1E2435",  // ink800
        ghostPressed:      "#252D40",  // ink700
        disabled:          "#252D40",  // ink700
      },
      focus: {
        ring:       "#A590FF",  // purple400
        ringOffset: "#12151C",  // ink950
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // BRAND – mode-invariant identity colors
  // ─────────────────────────────────────────────────────────────────
  brand: {
    pixdone: {
      primary:    "#7B61FF",  // purple500
      secondary:  "#F5B82E",  // yellow500
      reward:     "#35C26B",  // green500
      epic:       "#F45CCB",  // pink500
      freeze:     "#43CBEA",  // cyan500
      smash:      "#FF9C96",  // red300
      pixelInk:   "#191D24",  // gray900
      pixelPaper: "#FFFFFF",  // white
    },
    rarity: {
      common:    "#A6AAB6",  // gray400
      rare:      "#4C8DFF",  // blue500
      epic:      "#F45CCB",  // pink500
      legendary: "#F5B82E",  // yellow500
    },
    rewardGlow: {
      green:  "rgba(53, 194, 107, 0.28)",
      purple: "rgba(123, 97, 255, 0.28)",
      pink:   "rgba(244, 92, 203, 0.28)",
      cyan:   "rgba(67, 203, 234, 0.28)",
    },
  },
} as const;

/**
 * Converts a core palette key (camelCase) to its CSS variable name.
 * e.g. "gray50" → "--pxd-gray-50", "pixelInk" → "--pxd-pixel-ink"
 */
function _toCssVar(key: string): string {
  return `--pxd-${key
    .replace(/([a-z])(\d)/g, '$1-$2')
    .replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)}`;
}

/**
 * Reverse lookup: hex value → CSS primitive variable name.
 * e.g. "#F7F7F8" → "--pxd-gray-50"
 * rgba values (overlays, glows) return undefined.
 */
export const primitiveLookup: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(color.core as Record<string, string>).map(([key, val]) => [val, _toCssVar(key)])
);
