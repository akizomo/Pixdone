/**
 * Category and unlock-condition helpers for the Phase 1 challenge effect rework.
 *
 * Effects with a `category` (e.g. `fighter`) group related variants that should
 * appear as separate cards in the collection (e.g. `fighter_punch`, `fighter_punch_lv2`).
 * The new `unlockCondition` field describes how each variant becomes owned.
 */

import type { EffectDef, UnlockCondition } from './effectsRegistry';

/** Returns the category of the effect, or null if none is set. */
export function getEffectCategory(effect: EffectDef): string | null {
  return effect.category ?? null;
}

/**
 * Returns all effects in the given list that belong to the specified category,
 * preserving the input order (registry order by convention).
 */
export function getEffectsByCategory(category: string, effects: EffectDef[]): EffectDef[] {
  return effects.filter(e => e.category === category);
}

/** Returns the new-structure unlock condition, or null if none is set. */
export function getUnlockCondition(effect: EffectDef): UnlockCondition | null {
  return effect.unlockCondition ?? null;
}
