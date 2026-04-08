import { useMemo } from 'react';
import { EFFECTS_REGISTRY, type EffectDef } from '../data/effectsRegistry';

export interface ActiveChallenge {
  effect: EffectDef;
  progress: number;
  threshold: number;
  deadline: Date;
  daysLeft: number;
  isUrgent: boolean;
  isCompleted: boolean;
}

/**
 * Pure function: find the first active (non-expired) challenge effect
 * and return its status, or null if none.
 */
export function getActiveChallenge(
  registry: EffectDef[],
  challengeProgressMap: Record<string, number>,
  ownedChallengeEffects: string[],
  now: Date = new Date(),
): ActiveChallenge | null {
  const nowMs = now.getTime();

  for (const effect of registry) {
    if (effect.access !== 'challenge') continue;
    if (!effect.challengeDeadline || !effect.challengeUnlockThreshold) continue;
    if (nowMs > effect.challengeDeadline.getTime()) continue;

    const progress = challengeProgressMap[effect.key] ?? 0;
    const threshold = effect.challengeUnlockThreshold;
    const deadline = effect.challengeDeadline;

    const msLeft = deadline.getTime() - nowMs;
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    return {
      effect,
      progress,
      threshold,
      deadline,
      daysLeft,
      isUrgent: daysLeft <= 3,
      isCompleted: progress >= threshold,
    };
  }

  return null;
}

/**
 * React hook: returns the active challenge for the current user.
 */
export function useActiveChallenge(
  challengeProgressMap: Record<string, number>,
  ownedChallengeEffects: string[],
): ActiveChallenge | null {
  return useMemo(
    () => getActiveChallenge(EFFECTS_REGISTRY, challengeProgressMap, ownedChallengeEffects),
    [challengeProgressMap, ownedChallengeEffects],
  );
}
