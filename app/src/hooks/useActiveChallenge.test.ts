import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EffectDef } from '../data/effectsRegistry';

// We'll test the pure helper functions first, then the hook

// ── Helpers under test ──────────────────────────────────────────────────────

// We define the expected interface here so the tests drive the implementation
interface ActiveChallenge {
  effect: EffectDef;
  progress: number;
  threshold: number;
  deadline: Date;
  daysLeft: number;
  isUrgent: boolean;      // <= 3 days left
  isCompleted: boolean;   // progress >= threshold
}

// ── getActiveChallenge tests ────────────────────────────────────────────────

describe('getActiveChallenge', () => {
  let getActiveChallenge: (
    registry: EffectDef[],
    challengeProgressMap: Record<string, number>,
    ownedChallengeEffects: string[],
    now?: Date,
  ) => ActiveChallenge | null;

  beforeEach(async () => {
    const mod = await import('./useActiveChallenge');
    getActiveChallenge = mod.getActiveChallenge;
  });

  const makeChallengeEffect = (overrides: Partial<EffectDef> = {}): EffectDef => ({
    key: 'punch',
    name: 'Punch',
    rarity: 'RARE',
    themes: ['arcade'],
    access: 'challenge',
    description: { en: 'A punch.', ja: 'パンチ。' },
    evolutionStages: 1,
    evolutionCondition: null,
    evolutionThreshold: null,
    challengeDeadline: new Date('2026-05-31T23:59:59+09:00'),
    challengeUnlockThreshold: 50,
    ...overrides,
  });

  it('returns null when no challenge effects exist in registry', () => {
    const registry: EffectDef[] = [{
      key: 'explode', name: 'Explode', rarity: 'COMMON', themes: 'all',
      access: 'free_unlocked',
      description: { en: '', ja: '' },
      evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null,
      challengeDeadline: null, challengeUnlockThreshold: null,
    }];
    const result = getActiveChallenge(registry, {}, []);
    expect(result).toBeNull();
  });

  it('returns null when challenge deadline has passed', () => {
    const effect = makeChallengeEffect({
      challengeDeadline: new Date('2026-01-01T00:00:00Z'),
    });
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenge([effect], {}, [], now);
    expect(result).toBeNull();
  });

  it('returns active challenge with correct progress', () => {
    const effect = makeChallengeEffect();
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenge([effect], { punch: 32 }, [], now);

    expect(result).not.toBeNull();
    expect(result!.effect.key).toBe('punch');
    expect(result!.progress).toBe(32);
    expect(result!.threshold).toBe(50);
    expect(result!.isCompleted).toBe(false);
  });

  it('defaults progress to 0 when not in progressMap', () => {
    const effect = makeChallengeEffect();
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenge([effect], {}, [], now);
    expect(result!.progress).toBe(0);
  });

  it('calculates daysLeft correctly', () => {
    const effect = makeChallengeEffect({
      challengeDeadline: new Date('2026-04-11T12:00:00+09:00'),
    });
    // Exactly 3 days before deadline
    const now = new Date('2026-04-08T12:00:00+09:00');
    const result = getActiveChallenge([effect], {}, [], now);
    expect(result!.daysLeft).toBe(3);
  });

  it('sets isUrgent=true when 3 or fewer days left', () => {
    const effect = makeChallengeEffect({
      challengeDeadline: new Date('2026-04-11T12:00:00+09:00'),
    });
    // Exactly 3 days
    const now = new Date('2026-04-08T12:00:00+09:00');
    const result = getActiveChallenge([effect], {}, [], now);
    expect(result!.isUrgent).toBe(true);
  });

  it('sets isUrgent=false when more than 3 days left', () => {
    const effect = makeChallengeEffect({
      challengeDeadline: new Date('2026-04-20T23:59:59+09:00'),
    });
    const now = new Date('2026-04-08T12:00:00+09:00');
    const result = getActiveChallenge([effect], {}, [], now);
    expect(result!.isUrgent).toBe(false);
  });

  it('marks isCompleted=true when progress >= threshold', () => {
    const effect = makeChallengeEffect({ challengeUnlockThreshold: 50 });
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenge([effect], { punch: 50 }, [], now);
    expect(result!.isCompleted).toBe(true);
  });

  it('marks isCompleted=true when progress exceeds threshold', () => {
    const effect = makeChallengeEffect({ challengeUnlockThreshold: 50 });
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenge([effect], { punch: 75 }, [], now);
    expect(result!.isCompleted).toBe(true);
  });

  it('returns the first active (non-expired) challenge when multiple exist', () => {
    const expired = makeChallengeEffect({
      key: 'old',
      challengeDeadline: new Date('2026-01-01T00:00:00Z'),
    });
    const active = makeChallengeEffect({
      key: 'punch',
      challengeDeadline: new Date('2026-05-31T23:59:59+09:00'),
    });
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenge([expired, active], {}, [], now);
    expect(result!.effect.key).toBe('punch');
  });
});
