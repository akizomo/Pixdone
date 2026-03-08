/**
 * Pixdone motion tokens.
 * Standard interactions 120–240ms; reward effects may be longer but snappy.
 * Support reduced motion in documentation/implementation.
 */

export const motion = {
  duration: {
    instant: 80,
    fast: 120,
    base: 180,
    slow: 240,
    slower: 320,
    reward: 700,
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    decelerate: "cubic-bezier(0, 0, 0, 1)",
    accelerate: "cubic-bezier(0.3, 0, 1, 1)",
    playful: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    press: "cubic-bezier(0.2, 0, 0, 1)",
  },
  scale: {
    press: 0.96,
    hover: 1.01,
    rewardPop: 1.06,
    modalEnter: 0.98,
  },
  opacity: {
    disabled: 0.48,
    muted: 0.72,
  },
  animation: {
    smashFeedback: {
      duration: 120,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      scale: 0.96,
    },
    rewardPop: {
      duration: 320,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      scale: 1.06,
    },
    freezeEffect: {
      duration: 220,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    },
    rainbowEffect: {
      duration: 700,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
    bottomSheetEnter: {
      duration: 240,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    },
  },
} as const;
