/** Rarity badge colors — sourced from design-system foundation tokens */
export const RARITY_COLORS: Record<string, string> = {
  COMMON: 'var(--pxd-color-rarity-common)',
  RARE:   'var(--pxd-color-rarity-rare)',
  EPIC:   'var(--pxd-color-rarity-epic)',
};

/** Color for the CHALLENGE badge (reuses legendary token) */
export const CHALLENGE_COLOR = 'var(--pxd-color-rarity-legendary)';

/** Resolve badge color from rarity string, with optional challenge override */
export function badgeColor(rarity: string, isChallenge: boolean): string {
  if (isChallenge) return CHALLENGE_COLOR;
  return RARITY_COLORS[rarity] ?? 'var(--pd-color-text-secondary)';
}
