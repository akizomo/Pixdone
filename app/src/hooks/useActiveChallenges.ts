import { useMemo } from 'react';
import { EFFECTS_REGISTRY, type EffectDef } from '../data/effectsRegistry';
import type { ActiveChallenge } from './useActiveChallenge';

/**
 * Plural variant of `getActiveChallenge` used by the ChallengeMenu to display
 * multiple concurrent challenges side-by-side with per-challenge progress bars.
 *
 * An effect qualifies as an "active challenge" when all of the following hold:
 *   1. It has a trackable unlock condition:
 *      - legacy: `access === 'challenge'` + `challengeDeadline` + `challengeUnlockThreshold`, OR
 *      - new:    `unlockCondition.kind === 'challenge'` OR `'evolution'`
 *   2. It is NOT already owned by the user.
 *   3. Its deadline (if any) has NOT passed.
 *   4. For `evolution`-kind effects, the `parentKey` effect IS owned.
 *
 * Expired or owned challenges are EXCLUDED from the returned array (the user
 * asked that the menu hides them — see plan confirmation). Registry order is
 * preserved so UI can render the list deterministically.
 */
export function getActiveChallenges(
  registry: EffectDef[],
  challengeProgressMap: Record<string, number>,
  ownedChallengeEffects: string[],
  now: Date = new Date(),
): ActiveChallenge[] {
  const nowMs = now.getTime();
  const owned = new Set(ownedChallengeEffects);
  const result: ActiveChallenge[] = [];

  for (const effect of registry) {
    if (owned.has(effect.key)) continue;

    // Resolve trackable (threshold, deadline-or-null) from the effect.
    const tracked = resolveTrackedChallenge(effect);
    if (!tracked) continue;

    // Evolution effects are gated behind parent ownership.
    if (tracked.parentKey && !owned.has(tracked.parentKey)) continue;

    // Expired challenges are hidden from the menu per product decision.
    if (tracked.deadline && nowMs > tracked.deadline.getTime()) continue;

    const progress = challengeProgressMap[effect.key] ?? 0;
    const threshold = tracked.threshold;
    const deadline = tracked.deadline;
    const daysLeft = deadline
      ? Math.ceil((deadline.getTime() - nowMs) / (1000 * 60 * 60 * 24))
      : Infinity;
    const isUrgent = deadline ? daysLeft <= 3 : false;

    result.push({
      effect,
      progress,
      threshold,
      // Preserve existing ActiveChallenge.deadline: Date shape by using a
      // sentinel far-future date when none is set (evolution has no deadline).
      // This keeps the type compatible without introducing a nullable deadline
      // in the shared shape.
      deadline: deadline ?? new Date(8640000000000000),
      daysLeft,
      isUrgent,
      isCompleted: progress >= threshold,
    });
  }

  return result;
}

interface TrackedChallenge {
  threshold: number;
  deadline: Date | null;
  parentKey: string | null;
}

/**
 * Returns tracking info if the effect is a challenge/evolution the system
 * should surface in the ChallengeMenu, or null otherwise.
 * New-structure `unlockCondition` takes precedence over legacy fields.
 */
function resolveTrackedChallenge(effect: EffectDef): TrackedChallenge | null {
  if (effect.unlockCondition) {
    const c = effect.unlockCondition;
    if (c.kind === 'challenge') {
      return { threshold: c.threshold, deadline: c.deadline, parentKey: null };
    }
    if (c.kind === 'evolution') {
      return { threshold: c.threshold, deadline: null, parentKey: c.parentKey };
    }
  }

  // Legacy path: `access: 'challenge'` + `challengeUnlockThreshold` + deadline.
  if (
    effect.access === 'challenge' &&
    effect.challengeUnlockThreshold != null &&
    effect.challengeDeadline != null
  ) {
    return {
      threshold: effect.challengeUnlockThreshold,
      deadline: effect.challengeDeadline,
      parentKey: null,
    };
  }

  return null;
}

/**
 * React hook: returns all active challenges for the current user, in
 * registry order, memoized by its inputs.
 */
export function useActiveChallenges(
  challengeProgressMap: Record<string, number>,
  ownedChallengeEffects: string[],
): ActiveChallenge[] {
  return useMemo(
    () => getActiveChallenges(EFFECTS_REGISTRY, challengeProgressMap, ownedChallengeEffects),
    [challengeProgressMap, ownedChallengeEffects],
  );
}
