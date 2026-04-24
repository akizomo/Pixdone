/**
 * Phase 2: Plural active challenges.
 *
 * Returns an array of in-progress challenges (legacy `access: 'challenge'`
 * + new `unlockCondition`) that should appear in ChallengeMenu with their
 * own progress bars.
 *
 * Exclusion rules (must satisfy all to be returned):
 * - effect has a trackable unlock condition
 * - user does NOT yet own it
 * - deadline (if any) has NOT passed
 * - for evolution-kind: parent effect IS owned
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { EffectDef } from '../data/effectsRegistry';
import type { ActiveChallenge } from './useActiveChallenge';

describe('getActiveChallenges (plural)', () => {
  let getActiveChallenges: (
    registry: EffectDef[],
    challengeProgressMap: Record<string, number>,
    ownedChallengeEffects: string[],
    now?: Date,
  ) => ActiveChallenge[];

  beforeEach(async () => {
    const mod = await import('./useActiveChallenges');
    getActiveChallenges = mod.getActiveChallenges;
  });

  const makeLegacyChallenge = (overrides: Partial<EffectDef> = {}): EffectDef => ({
    key: 'fighter',
    name: 'Fighter',
    rarity: 'RARE',
    themes: ['arcade'],
    access: 'challenge',
    description: { en: '', ja: '' },
    evolutionStages: 1,
    evolutionCondition: null,
    evolutionThreshold: null,
    challengeDeadline: new Date('2026-05-31T23:59:59+09:00'),
    challengeUnlockThreshold: 20,
    ...overrides,
  });

  const makeNewChallenge = (key: string, overrides: Partial<EffectDef> = {}): EffectDef => ({
    key,
    name: key,
    rarity: 'RARE',
    themes: ['arcade'],
    access: 'challenge',
    description: { en: '', ja: '' },
    evolutionStages: 1,
    evolutionCondition: null,
    evolutionThreshold: null,
    challengeDeadline: null,
    challengeUnlockThreshold: null,
    category: 'fighter',
    unlockCondition: {
      kind: 'challenge',
      threshold: 20,
      deadline: new Date('2026-05-31T23:59:59+09:00'),
    },
    ...overrides,
  });

  const makeEvolutionEffect = (key: string, parentKey: string, threshold = 50): EffectDef => ({
    key,
    name: key,
    rarity: 'RARE',
    themes: ['arcade'],
    access: 'challenge',
    description: { en: '', ja: '' },
    evolutionStages: 1,
    evolutionCondition: null,
    evolutionThreshold: null,
    challengeDeadline: null,
    challengeUnlockThreshold: null,
    category: 'fighter',
    unlockCondition: { kind: 'evolution', parentKey, threshold },
  });

  // ── Basic behavior ────────────────────────────────────────────────────────

  it('returns an empty array when no challenge effects exist', () => {
    expect(getActiveChallenges([], {}, [])).toEqual([]);
  });

  it('returns one challenge for a legacy challenge effect in progress', () => {
    const effect = makeLegacyChallenge();
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges([effect], { fighter: 5 }, [], now);

    expect(result).toHaveLength(1);
    expect(result[0].effect.key).toBe('fighter');
    expect(result[0].progress).toBe(5);
    expect(result[0].threshold).toBe(20);
  });

  it('returns an ActiveChallenge for a new-structure challenge effect in progress', () => {
    const effect = makeNewChallenge('fighter_punch');
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges([effect], { fighter_punch: 10 }, [], now);

    expect(result).toHaveLength(1);
    expect(result[0].effect.key).toBe('fighter_punch');
    expect(result[0].progress).toBe(10);
    expect(result[0].threshold).toBe(20);
  });

  // ── Multi-challenge ────────────────────────────────────────────────────────

  it('returns multiple active challenges in registry order', () => {
    const fighter = makeNewChallenge('fighter_punch');
    const kick = makeNewChallenge('fighter_kick', {
      unlockCondition: {
        kind: 'challenge',
        threshold: 30,
        deadline: new Date('2026-06-30T23:59:59+09:00'),
      },
    });
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges([fighter, kick], { fighter_punch: 5, fighter_kick: 2 }, [], now);

    expect(result).toHaveLength(2);
    expect(result.map(r => r.effect.key)).toEqual(['fighter_punch', 'fighter_kick']);
  });

  // ── Exclusion rules ────────────────────────────────────────────────────────

  it('excludes challenges whose deadline has passed', () => {
    const expired = makeLegacyChallenge({
      key: 'expired',
      challengeDeadline: new Date('2026-01-01T00:00:00Z'),
    });
    const active = makeLegacyChallenge({ key: 'fighter' });
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges([expired, active], {}, [], now);

    expect(result).toHaveLength(1);
    expect(result[0].effect.key).toBe('fighter');
  });

  it('excludes owned challenges', () => {
    const owned = makeLegacyChallenge({ key: 'fighter_owned' });
    const active = makeLegacyChallenge({ key: 'fighter_active' });
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges([owned, active], {}, ['fighter_owned'], now);

    expect(result).toHaveLength(1);
    expect(result[0].effect.key).toBe('fighter_active');
  });

  // ── Evolution-kind unlock condition ────────────────────────────────────────

  it('INCLUDES evolution-kind effect when parent is owned and not self-owned', () => {
    const parent = makeNewChallenge('fighter_punch');
    const lv2 = makeEvolutionEffect('fighter_punch_lv2', 'fighter_punch', 50);
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges(
      [parent, lv2],
      { fighter_punch_lv2: 10 },
      ['fighter_punch'],  // parent owned
      now,
    );

    const lv2Result = result.find(r => r.effect.key === 'fighter_punch_lv2');
    expect(lv2Result).toBeDefined();
    expect(lv2Result!.progress).toBe(10);
    expect(lv2Result!.threshold).toBe(50);
  });

  it('EXCLUDES evolution-kind effect when parent is NOT owned', () => {
    const parent = makeNewChallenge('fighter_punch');
    const lv2 = makeEvolutionEffect('fighter_punch_lv2', 'fighter_punch', 50);
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges([parent, lv2], {}, [], now);

    // Only the parent (fighter_punch) shows up — Lv2 gated until parent owned.
    expect(result.map(r => r.effect.key)).toEqual(['fighter_punch']);
  });

  it('EXCLUDES evolution-kind effect that is itself already owned', () => {
    const parent = makeNewChallenge('fighter_punch');
    const lv2 = makeEvolutionEffect('fighter_punch_lv2', 'fighter_punch', 50);
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges(
      [parent, lv2],
      {},
      ['fighter_punch', 'fighter_punch_lv2'],
      now,
    );

    // Both owned → none active.
    expect(result).toEqual([]);
  });

  // ── Progress & flags ───────────────────────────────────────────────────────

  it('defaults progress to 0 when key absent from map', () => {
    const effect = makeNewChallenge('fighter_punch');
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges([effect], {}, [], now);

    expect(result[0].progress).toBe(0);
    expect(result[0].isCompleted).toBe(false);
  });

  it('sets isCompleted when progress >= threshold', () => {
    const effect = makeNewChallenge('fighter_punch');
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges([effect], { fighter_punch: 20 }, [], now);

    expect(result[0].isCompleted).toBe(true);
  });

  it('computes daysLeft/isUrgent from the unlockCondition deadline for new-structure effects', () => {
    const effect = makeNewChallenge('fighter_punch', {
      unlockCondition: {
        kind: 'challenge',
        threshold: 20,
        deadline: new Date('2026-04-11T12:00:00+09:00'),
      },
    });
    const now = new Date('2026-04-08T12:00:00+09:00');
    const result = getActiveChallenges([effect], {}, [], now);

    expect(result[0].daysLeft).toBe(3);
    expect(result[0].isUrgent).toBe(true);
  });

  it('evolution-kind effects without deadline do NOT set isUrgent', () => {
    const parent = makeNewChallenge('fighter_punch');
    const lv2 = makeEvolutionEffect('fighter_punch_lv2', 'fighter_punch', 50);
    const now = new Date('2026-04-08T12:00:00Z');
    const result = getActiveChallenges([parent, lv2], {}, ['fighter_punch'], now);

    const lv2Result = result.find(r => r.effect.key === 'fighter_punch_lv2');
    expect(lv2Result!.isUrgent).toBe(false);
  });
});
