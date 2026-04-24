/**
 * Phase 1 tests: EffectDef optional `category` and `unlockCondition` fields,
 * plus helpers for grouping effects by category and resolving unlock conditions.
 *
 * These fields are the foundation for the "_Fighter / Punch" naming scheme
 * where Lv1 and Lv2 become separate effect cards under the same category.
 */
import { describe, it, expect } from 'vitest';
import type { EffectDef } from './effectsRegistry';
import {
  getEffectsByCategory,
  getEffectCategory,
  getUnlockCondition,
} from './effectCategory';

describe('EffectDef optional fields (Phase 1 type contract)', () => {
  it('accepts EffectDef with `category` and `unlockCondition: { kind: "challenge" }`', () => {
    const challengeEffect: EffectDef = {
      key: 'fighter_punch',
      name: 'Fighter / Punch',
      rarity: 'RARE',
      themes: ['arcade'],
      access: 'challenge',
      description: { en: 'Punch', ja: 'パンチ' },
      evolutionStages: 1,
      evolutionCondition: null,
      evolutionThreshold: null,
      challengeDeadline: new Date('2026-05-31T23:59:59+09:00'),
      challengeUnlockThreshold: 20,
      category: 'fighter',
      unlockCondition: {
        kind: 'challenge',
        threshold: 20,
        deadline: new Date('2026-05-31T23:59:59+09:00'),
      },
    };
    expect(challengeEffect.category).toBe('fighter');
    expect(challengeEffect.unlockCondition?.kind).toBe('challenge');
  });

  it('accepts EffectDef with `unlockCondition: { kind: "evolution", parentKey, threshold }`', () => {
    const evolvedEffect: EffectDef = {
      key: 'fighter_punch_lv2',
      name: 'Fighter / Punch Lv2',
      rarity: 'RARE',
      themes: ['arcade'],
      access: 'challenge',
      description: { en: 'Kick', ja: 'キック' },
      evolutionStages: 1,
      evolutionCondition: null,
      evolutionThreshold: null,
      challengeDeadline: null,
      challengeUnlockThreshold: null,
      category: 'fighter',
      unlockCondition: {
        kind: 'evolution',
        parentKey: 'fighter_punch',
        threshold: 50,
      },
    };
    expect(evolvedEffect.unlockCondition?.kind).toBe('evolution');
    if (evolvedEffect.unlockCondition?.kind === 'evolution') {
      expect(evolvedEffect.unlockCondition.parentKey).toBe('fighter_punch');
      expect(evolvedEffect.unlockCondition.threshold).toBe(50);
    }
  });

  it('allows EffectDef without category/unlockCondition (backward compatible)', () => {
    const legacyEffect: EffectDef = {
      key: 'explode',
      name: 'Explode',
      rarity: 'COMMON',
      themes: 'all',
      access: 'free_unlocked',
      description: { en: 'Burst', ja: '弾ける' },
      evolutionStages: 1,
      evolutionCondition: null,
      evolutionThreshold: null,
      challengeDeadline: null,
      challengeUnlockThreshold: null,
    };
    expect(legacyEffect.category).toBeUndefined();
    expect(legacyEffect.unlockCondition).toBeUndefined();
  });
});

describe('getEffectCategory', () => {
  it('returns the category for an effect that has one', () => {
    const effect: EffectDef = {
      key: 'fighter_punch',
      name: 'Fighter / Punch',
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
    };
    expect(getEffectCategory(effect)).toBe('fighter');
  });

  it('returns null for effects without category', () => {
    const effect: EffectDef = {
      key: 'explode',
      name: 'Explode',
      rarity: 'COMMON',
      themes: 'all',
      access: 'free_unlocked',
      description: { en: '', ja: '' },
      evolutionStages: 1,
      evolutionCondition: null,
      evolutionThreshold: null,
      challengeDeadline: null,
      challengeUnlockThreshold: null,
    };
    expect(getEffectCategory(effect)).toBeNull();
  });
});

describe('getEffectsByCategory', () => {
  const effects: EffectDef[] = [
    {
      key: 'fighter_punch',
      name: 'Fighter / Punch',
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
    },
    {
      key: 'fighter_punch_lv2',
      name: 'Fighter / Punch Lv2',
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
    },
    {
      key: 'chomp',
      name: 'Chomp',
      rarity: 'RARE',
      themes: ['arcade'],
      access: 'premium',
      description: { en: '', ja: '' },
      evolutionStages: 1,
      evolutionCondition: null,
      evolutionThreshold: null,
      challengeDeadline: null,
      challengeUnlockThreshold: null,
    },
  ];

  it('returns all effects matching the category, in registry order', () => {
    const result = getEffectsByCategory('fighter', effects);
    expect(result.map(e => e.key)).toEqual(['fighter_punch', 'fighter_punch_lv2']);
  });

  it('returns empty array when no effects match', () => {
    expect(getEffectsByCategory('nonexistent', effects)).toEqual([]);
  });

  it('does not include effects without a category', () => {
    const result = getEffectsByCategory('fighter', effects);
    expect(result.some(e => e.key === 'chomp')).toBe(false);
  });
});

describe('getUnlockCondition', () => {
  it('returns the challenge unlock condition when defined', () => {
    const effect: EffectDef = {
      key: 'fighter_punch',
      name: 'Fighter / Punch',
      rarity: 'RARE',
      themes: ['arcade'],
      access: 'challenge',
      description: { en: '', ja: '' },
      evolutionStages: 1,
      evolutionCondition: null,
      evolutionThreshold: null,
      challengeDeadline: null,
      challengeUnlockThreshold: null,
      unlockCondition: {
        kind: 'challenge',
        threshold: 20,
        deadline: new Date('2026-05-31T23:59:59+09:00'),
      },
    };
    const condition = getUnlockCondition(effect);
    expect(condition?.kind).toBe('challenge');
    if (condition?.kind === 'challenge') {
      expect(condition.threshold).toBe(20);
      expect(condition.deadline.toISOString()).toBe(
        new Date('2026-05-31T23:59:59+09:00').toISOString(),
      );
    }
  });

  it('returns the evolution unlock condition when defined', () => {
    const effect: EffectDef = {
      key: 'fighter_punch_lv2',
      name: 'Fighter / Punch Lv2',
      rarity: 'RARE',
      themes: ['arcade'],
      access: 'challenge',
      description: { en: '', ja: '' },
      evolutionStages: 1,
      evolutionCondition: null,
      evolutionThreshold: null,
      challengeDeadline: null,
      challengeUnlockThreshold: null,
      unlockCondition: { kind: 'evolution', parentKey: 'fighter_punch', threshold: 50 },
    };
    const condition = getUnlockCondition(effect);
    expect(condition?.kind).toBe('evolution');
    if (condition?.kind === 'evolution') {
      expect(condition.parentKey).toBe('fighter_punch');
      expect(condition.threshold).toBe(50);
    }
  });

  it('returns null when no unlock condition is set', () => {
    const effect: EffectDef = {
      key: 'explode',
      name: 'Explode',
      rarity: 'COMMON',
      themes: 'all',
      access: 'free_unlocked',
      description: { en: '', ja: '' },
      evolutionStages: 1,
      evolutionCondition: null,
      evolutionThreshold: null,
      challengeDeadline: null,
      challengeUnlockThreshold: null,
    };
    expect(getUnlockCondition(effect)).toBeNull();
  });
});
