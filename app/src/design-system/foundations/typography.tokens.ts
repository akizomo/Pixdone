/**
 * Pixdone typography tokens.
 * Body copy: readable sans-serif. Pixel/brand font: selective emphasis only.
 *
 * Scale is tuned for mobile (iOS Dynamic Type default sizes / Material 3 type scale):
 * body = 16px, nothing below 11px, pixel font never below 14px,
 * line heights on a 4px grid. Mirrors --pd-font-size-* / --pd-font-leading-* in tokens.css
 * (source of truth: design-tokens/core.json).
 */

const BODY = '"Inter", "Noto Sans JP", system-ui, sans-serif';
// Handjet / VT323 via size-adjust'd @font-face (foundations/fonts.css) so glyphs match Inter's size.
const PIXEL = "'PD Handjet', 'PD VT323', 'Courier New', monospace";

export const typography = {
  fontFamily: {
    body: BODY,
    brand: PIXEL,
    display: '"Press Start 2P", "DotGothic16", monospace',
    mono: '"JetBrains Mono", monospace',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    "3xs": 11,
    "2xs": 12,
    xs: 13,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    "2xl": 24,
    "3xl": 28,
    "4xl": 34,
  },
  /** Per-size leading in px (4px grid). Pair with fontSize of the same key. */
  leading: {
    "3xs": 16,
    "2xs": 16,
    xs: 18,
    sm: 20,
    md: 24,
    lg: 24,
    xl: 28,
    "2xl": 32,
    "3xl": 36,
    "4xl": 40,
  },
  /** Minimum sizes. Handjet's strokes are thin, so the pixel font stays at 14px or above. */
  minFontSize: {
    body: 11,
    pixel: 14,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
  },
  letterSpacing: {
    tight: "-0.02em",
    normal: "0em",
    wide: "0.02em",
    pixel: "0.04em",
  },
  textStyle: {
    // ---- Body font (Inter) ----
    display: {
      fontFamily: BODY,
      fontWeight: 700 as const,
      fontSize: 34 as const,
      lineHeight: "40px" as const,
      letterSpacing: "-0.02em" as const,
    },
    titleLg: {
      fontFamily: BODY,
      fontWeight: 700 as const,
      fontSize: 22 as const,
      lineHeight: "28px" as const,
      letterSpacing: "-0.02em" as const,
    },
    titleMd: {
      fontFamily: BODY,
      fontWeight: 600 as const,
      fontSize: 18 as const,
      lineHeight: "24px" as const,
      letterSpacing: "-0.01em" as const,
    },
    body: {
      fontFamily: BODY,
      fontWeight: 400 as const,
      fontSize: 16 as const,
      lineHeight: "24px" as const,
      letterSpacing: "0em" as const,
    },
    bodySm: {
      fontFamily: BODY,
      fontWeight: 400 as const,
      fontSize: 14 as const,
      lineHeight: "20px" as const,
      letterSpacing: "0em" as const,
    },
    caption: {
      fontFamily: BODY,
      fontWeight: 400 as const,
      fontSize: 13 as const,
      lineHeight: "18px" as const,
      letterSpacing: "0em" as const,
    },
    label: {
      fontFamily: BODY,
      fontWeight: 600 as const,
      fontSize: 14 as const,
      lineHeight: "20px" as const,
      letterSpacing: "0.02em" as const,
    },
    labelSm: {
      fontFamily: BODY,
      fontWeight: 500 as const,
      fontSize: 12 as const,
      lineHeight: "16px" as const,
      letterSpacing: "0.02em" as const,
    },
    micro: {
      fontFamily: BODY,
      fontWeight: 500 as const,
      fontSize: 11 as const,
      lineHeight: "16px" as const,
      letterSpacing: "0.02em" as const,
    },
    // ---- Pixel font (Handjet, size-adjust'd). Min 14px. ----
    pixelDisplay: {
      fontFamily: PIXEL,
      fontWeight: 400 as const,
      fontSize: 34 as const,
      lineHeight: "40px" as const,
      letterSpacing: "0.04em" as const,
    },
    pixelTitle: {
      fontFamily: PIXEL,
      fontWeight: 400 as const,
      fontSize: 24 as const,
      lineHeight: "32px" as const,
      letterSpacing: "0.04em" as const,
    },
    pixelLabel: {
      fontFamily: PIXEL,
      fontWeight: 400 as const,
      fontSize: 16 as const,
      lineHeight: "24px" as const,
      letterSpacing: "0.04em" as const,
    },
    pixelLabelSm: {
      fontFamily: PIXEL,
      fontWeight: 400 as const,
      fontSize: 14 as const,
      lineHeight: "20px" as const,
      letterSpacing: "0.04em" as const,
    },
  },
} as const;
