/**
 * Effect Evolution System
 *
 * Handles Lv1 → Lv2 evolution for effects that support it.
 * Currently: fighter (Fighter) — Lv1 = Punch, Lv2 = Kick. Lv2 requires 50 cumulative completions + PixDone+.
 *
 * The effectId in the DB stays the same (e.g. 'fighter'); `equippedLevel` determines
 * which animation variant to play.
 */

import { EFFECTS_REGISTRY } from './effectsRegistry';

// ── Animation key resolution ─────────────────────────────────────────────────

/**
 * Given an effect registry key and the user's equippedLevel,
 * return the animation key that animations.js should play.
 *
 * For evolving effects at Lv2, appends 'Lv2' suffix (e.g. 'fighter' → 'fighterLv2').
 * Non-evolving effects or Lv1 always return the base key.
 */
export function resolveAnimationKey(effectKey: string, equippedLevel: number): string {
  if (equippedLevel < 2) return effectKey;

  const def = EFFECTS_REGISTRY.find(e => e.key === effectKey);
  if (!def || def.evolutionStages < 2) return effectKey;

  // Lv2 → 'fighterLv2', Lv3 → 'fighterLv3', etc.
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
