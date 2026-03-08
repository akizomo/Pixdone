/**
 * Pixdone typography tokens.
 * Body copy: readable sans-serif. Pixel/display font: selective emphasis only.
 */

export const typography = {
  fontFamily: {
    body: '"Inter", "Noto Sans JP", system-ui, sans-serif',
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
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
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
    displayLg: {
      fontFamily: '"Press Start 2P", "DotGothic16", monospace' as const,
      fontWeight: 400 as const,
      fontSize: 24 as const,
      lineHeight: 1.4 as const,
      letterSpacing: "0.04em" as const,
    },
    displayMd: {
      fontFamily: '"Press Start 2P", "DotGothic16", monospace' as const,
      fontWeight: 400 as const,
      fontSize: 20 as const,
      lineHeight: 1.4 as const,
      letterSpacing: "0.04em" as const,
    },
    headingLg: {
      fontFamily: '"Inter", "Noto Sans JP", system-ui, sans-serif' as const,
      fontWeight: 700 as const,
      fontSize: 24 as const,
      lineHeight: 1.35 as const,
      letterSpacing: "-0.02em" as const,
    },
    headingMd: {
      fontFamily: '"Inter", "Noto Sans JP", system-ui, sans-serif' as const,
      fontWeight: 700 as const,
      fontSize: 20 as const,
      lineHeight: 1.35 as const,
      letterSpacing: "-0.02em" as const,
    },
    headingSm: {
      fontFamily: '"Inter", "Noto Sans JP", system-ui, sans-serif' as const,
      fontWeight: 600 as const,
      fontSize: 18 as const,
      lineHeight: 1.4 as const,
      letterSpacing: "-0.01em" as const,
    },
    bodyMd: {
      fontFamily: '"Inter", "Noto Sans JP", system-ui, sans-serif' as const,
      fontWeight: 400 as const,
      fontSize: 16 as const,
      lineHeight: 1.5 as const,
      letterSpacing: "0em" as const,
    },
    bodySm: {
      fontFamily: '"Inter", "Noto Sans JP", system-ui, sans-serif' as const,
      fontWeight: 400 as const,
      fontSize: 14 as const,
      lineHeight: 1.5 as const,
      letterSpacing: "0em" as const,
    },
    labelMd: {
      fontFamily: '"Inter", "Noto Sans JP", system-ui, sans-serif' as const,
      fontWeight: 600 as const,
      fontSize: 14 as const,
      lineHeight: 1.35 as const,
      letterSpacing: "0.02em" as const,
    },
    labelSm: {
      fontFamily: '"Inter", "Noto Sans JP", system-ui, sans-serif' as const,
      fontWeight: 600 as const,
      fontSize: 12 as const,
      lineHeight: 1.35 as const,
      letterSpacing: "0.02em" as const,
    },
    pixelLabel: {
      fontFamily: '"Press Start 2P", "DotGothic16", monospace' as const,
      fontWeight: 400 as const,
      fontSize: 12 as const,
      lineHeight: 1.5 as const,
      letterSpacing: "0.04em" as const,
    },
  },
} as const;
