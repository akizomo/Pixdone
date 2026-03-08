/**
 * Pixdone color tokens.
 * Layers: core (primitives) → semantic (UI meaning) → brand (Pixdone identity).
 */

export const color = {
  core: {
    white: "#FFFFFF",
    black: "#111111",

    gray0: "#FCFCFC",
    gray50: "#F7F7F8",
    gray100: "#EFEFF1",
    gray200: "#DDDEE3",
    gray300: "#C7C9D1",
    gray400: "#A6AAB6",
    gray500: "#858B99",
    gray600: "#666C7A",
    gray700: "#4C5160",
    gray800: "#2E3440",
    gray900: "#191D24",

    blue300: "#7BB4FF",
    blue500: "#4C8DFF",
    blue700: "#2D5BDB",

    green300: "#7EE3A7",
    green500: "#35C26B",
    green700: "#1D8F4A",

    yellow300: "#FFD86B",
    yellow500: "#F5B82E",
    yellow700: "#B78112",

    red300: "#FF9C96",
    red500: "#E85D5D",
    red700: "#B93D3D",

    purple300: "#B79CFF",
    purple500: "#7B61FF",
    purple700: "#5B43D6",

    pink300: "#FF9DE1",
    pink500: "#F45CCB",
    pink700: "#C73CA1",

    cyan300: "#8FE7FF",
    cyan500: "#43CBEA",
    cyan700: "#2396B2",
  },

  semantic: {
    surface: {
      page: "#F7F7F8",
      pageAlt: "#EFEFF1",
      primary: "#FFFFFF",
      secondary: "#F7F7F8",
      raised: "#FFFFFF",
      overlay: "rgba(17, 17, 17, 0.64)",
      inverse: "#191D24",
      disabled: "#DDDEE3",
    },
    text: {
      primary: "#191D24",
      secondary: "#4C5160",
      tertiary: "#666C7A",
      inverse: "#FFFFFF",
      disabled: "#858B99",
      accent: "#5B43D6",
      success: "#1D8F4A",
      warning: "#B78112",
      danger: "#B93D3D",
    },
    border: {
      subtle: "#DDDEE3",
      default: "#A6AAB6",
      strong: "#2E3440",
      inverse: "#FFFFFF",
      focus: "#4C8DFF",
      danger: "#E85D5D",
    },
    feedback: {
      info: "#4C8DFF",
      success: "#35C26B",
      warning: "#F5B82E",
      danger: "#E85D5D",
    },
    action: {
      primary: "#7B61FF",
      primaryHover: "#6B52F0",
      primaryPressed: "#5B43D6",
      secondary: "#FFFFFF",
      secondaryHover: "#F3F1FF",
      secondaryPressed: "#E6E1FF",
      ghostHover: "#EFEFF1",
      ghostPressed: "#DDDEE3",
      disabled: "#C7C9D1",
    },
    focus: {
      ring: "#4C8DFF",
      ringOffset: "#FFFFFF",
    },
  },

  brand: {
    pixdone: {
      primary: "#7B61FF",
      secondary: "#F5B82E",
      reward: "#35C26B",
      epic: "#F45CCB",
      freeze: "#43CBEA",
      smash: "#FF9C96",
      pixelInk: "#191D24",
      pixelPaper: "#FFFFFF",
    },
    rarity: {
      common: "#A6AAB6",
      rare: "#4C8DFF",
      epic: "#F45CCB",
      legendary: "#F5B82E",
    },
    rewardGlow: {
      green: "rgba(53, 194, 107, 0.28)",
      purple: "rgba(123, 97, 255, 0.28)",
      pink: "rgba(244, 92, 203, 0.28)",
      cyan: "rgba(67, 203, 234, 0.28)",
    },
  },
} as const;
