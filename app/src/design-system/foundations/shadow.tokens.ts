/**
 * Pixdone shadow tokens.
 * Use pixel shadows selectively for primary CTAs and retro moments.
 */

export const shadow = {
  none: "none",

  softXs: "0 1px 2px rgba(17, 17, 17, 0.08)",
  softSm: "0 2px 6px rgba(17, 17, 17, 0.10)",
  softMd: "0 4px 12px rgba(17, 17, 17, 0.12)",

  pixelSm: "2px 2px 0px rgba(25, 29, 36, 0.92)",
  pixelMd: "3px 3px 0px rgba(25, 29, 36, 0.92)",
  pixelLg: "4px 4px 0px rgba(25, 29, 36, 0.95)",

  pixelInset: "inset 2px 2px 0px rgba(255, 255, 255, 0.12)",
  rewardGlowGreen: "0 0 0 4px rgba(53, 194, 107, 0.18)",
  rewardGlowPurple: "0 0 0 4px rgba(123, 97, 255, 0.18)",
  rewardGlowPink: "0 0 0 4px rgba(244, 92, 203, 0.18)",
} as const;
