/**
 * Effect Evolution System
 *
 * New structure (Phase 3+): Each "level" is a SEPARATE effect card.
 *   - `fighter_punch` (Lv1) — unlocked via challenge
 *   - `fighter_punch_lv2` — unlocked after owning Punch + 50 completions
 *
 * Legacy structure (pre-Phase 3): A single `fighter` effect with `equippedLevel`
 * toggling between base and Lv2 animation. The legacy `resolveAnimationKey`
 * path below remains for any effect that still uses `evolutionStages >= 2`.
 */

import { EFFECTS_REGISTRY } from './effectsRegistry';

// ── Animation key resolution ─────────────────────────────────────────────────

/**
 * Registry keys whose GIF/animation assets in `animations.js` are registered
 * under a different legacy name. Used so we can rename registry entries
 * without renaming baked animation assets.
 */
const LEGACY_ANIMATION_KEY: Record<string, string> = {
  fighter_punch: 'fighter',
  fighter_punch_lv2: 'fighterLv2',
};

/**
 * Given an effect registry key and the user's equippedLevel,
 * return the animation key that animations.js should play.
 *
 * Priority:
 *   1. If the registry key has a LEGACY_ANIMATION_KEY mapping, use it.
 *      (New-structure effects where Lv1/Lv2 are separate cards.)
 *   2. Legacy evolution path: for effects with `evolutionStages >= 2`, append
 *      `Lv{n}` suffix when `equippedLevel >= 2`.
 *   3. Otherwise return the effect key as-is.
 */
export function resolveAnimationKey(effectKey: string, equippedLevel: number): string {
  const legacy = LEGACY_ANIMATION_KEY[effectKey];
  if (legacy) return legacy;

  if (equippedLevel < 2) return effectKey;

  const def = EFFECTS_REGISTRY.find(e => e.key === effectKey);
  if (!def || def.evolutionStages < 2) return effectKey;

  return `${effectKey}Lv${equippedLevel}`;
}

// ── Evolution eligibility ────────────────────────────────────────────────────

/**
 * Check if a user's effect can evolve right now.
 * Requires: evolving effect + not at max level + progress >= threshold + premium.
 */
export function canEvolve(params: {
  effectKey: string;
  equippedLevel: number;
  evolutionProgress: number;
  isPremium: boolean;
}): boolean {
  const { effectKey, equippedLevel, evolutionProgress, isPremium } = params;

  const def = EFFECTS_REGISTRY.find(e => e.key === effectKey);
  if (!def || def.evolutionStages < 2) return false;
  if (equippedLevel >= def.evolutionStages) return false;
  if (!def.evolutionThreshold || evolutionProgress < def.evolutionThreshold) return false;
  if (!isPremium) return false;

  return true;
}

// ── Evolution status for UI ──────────────────────────────────────────────────

export type EvolutionBlockedReason = 'none' | 'need_progress' | 'need_premium' | 'ready' | 'maxed';

export interface EvolutionStatus {
  hasEvolution: boolean;
  currentLevel: number;
  maxLevel: number;
  progress: number;
  threshold: number;
  isMaxLevel: boolean;
  canEvolveNow: boolean;
  blockedReason: EvolutionBlockedReason;
}

/**
 * Returns structured evolution info for the collection screen UI.
 * Returns null for effects that don't have evolution.
 */
export function getEvolutionStatus(params: {
  effectKey: string;
  equippedLevel: number;
  evolutionProgress: number;
  isPremium: boolean;
}): EvolutionStatus | null {
  const { effectKey, equippedLevel, evolutionProgress, isPremium } = params;

  const def = EFFECTS_REGISTRY.find(e => e.key === effectKey);
  if (!def || def.evolutionStages < 2) return null;

  const threshold = def.evolutionThreshold ?? 0;
  const isMaxLevel = equippedLevel >= def.evolutionStages;
  const progressMet = evolutionProgress >= threshold;
  const premiumMet = isPremium;

  let blockedReason: EvolutionBlockedReason;
  if (isMaxLevel) {
    blockedReason = 'maxed';
  } else if (progressMet && premiumMet) {
    blockedReason = 'ready';
  } else if (progressMet && !premiumMet) {
    blockedReason = 'need_premium';
  } else {
    blockedReason = 'need_progress';
  }

  return {
    hasEvolution: true,
    currentLevel: equippedLevel,
    maxLevel: def.evolutionStages,
    progress: evolutionProgress,
    threshold,
    isMaxLevel,
    canEvolveNow: progressMet && premiumMet && !isMaxLevel,
    blockedReason,
  };
}
