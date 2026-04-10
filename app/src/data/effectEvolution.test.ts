import { describe, it, expect, beforeAll } from 'vitest';

// ── resolveAnimationKey ────────────────────────────────────────────────────
// Given an effect registry key and the user's equippedLevel,
// return the animation key that animations.js should play.

describe('resolveAnimationKey', () => {
  let resolveAnimationKey: (effectKey: string, equippedLevel: number) => string;

  beforeAll(async () => {
    const mod = await import('./effectEvolution');
    resolveAnimationKey = mod.resolveAnimationKey;
  });

  it('returns the same key for non-evolving effects', () => {
    expect(resolveAnimationKey('explode', 1)).toBe('explode');
    expect(resolveAnimationKey('shatter', 1)).toBe('shatter');
  });

  it('returns base key for fighter at Lv1', () => {
    expect(resolveAnimationKey('fighter', 1)).toBe('fighter');
  });

  it('returns Lv2 key for fighter at equippedLevel 2', () => {
    expect(resolveAnimationKey('fighter', 2)).toBe('fighterLv2');
  });

  it('returns LvN key for higher levels', () => {
    expect(resolveAnimationKey('fighter', 3)).toBe('fighterLv3');
    expect(resolveAnimationKey('fighter', 5)).toBe('fighterLv5');
  });

  it('returns base key when equippedLevel is 0 or undefined-like', () => {
    expect(resolveAnimationKey('fighter', 0)).toBe('fighter');
  });
});

// ── canEvolve ──────────────────────────────────────────────────────────────
// Determines if a user's effect is eligible for evolution.

describe('canEvolve', () => {
  let canEvolve: (params: {
    effectKey: string;
    equippedLevel: number;
    evolutionProgress: number;
    isPremium: boolean;
  }) => boolean;

  beforeAll(async () => {
    const mod = await import('./effectEvolution');
    canEvolve = mod.canEvolve;
  });

  it('returns false for non-evolving effects', () => {
    expect(canEvolve({
      effectKey: 'explode',
      equippedLevel: 1,
      evolutionProgress: 100,
      isPremium: true,
    })).toBe(false);
  });

  it('returns false when already at max level', () => {
    expect(canEvolve({
      effectKey: 'fighter',
      equippedLevel: 2,
      evolutionProgress: 100,
      isPremium: true,
    })).toBe(false);
  });

  it('returns false when progress < threshold', () => {
    expect(canEvolve({
      effectKey: 'fighter',
      equippedLevel: 1,
      evolutionProgress: 49,
      isPremium: true,
    })).toBe(false);
  });

  it('returns false when not premium (even with enough progress)', () => {
    expect(canEvolve({
      effectKey: 'fighter',
      equippedLevel: 1,
      evolutionProgress: 50,
      isPremium: false,
    })).toBe(false);
  });

  it('returns true when progress >= threshold AND premium', () => {
    expect(canEvolve({
      effectKey: 'fighter',
      equippedLevel: 1,
      evolutionProgress: 50,
      isPremium: true,
    })).toBe(true);
  });

  it('returns true when progress exceeds threshold', () => {
    expect(canEvolve({
      effectKey: 'fighter',
      equippedLevel: 1,
      evolutionProgress: 75,
      isPremium: true,
    })).toBe(true);
  });
});

// ── getEvolutionStatus ─────────────────────────────────────────────────────
// Returns structured info for UI display in the collection screen.

describe('getEvolutionStatus', () => {
  let getEvolutionStatus: (params: {
    effectKey: string;
    equippedLevel: number;
    evolutionProgress: number;
    isPremium: boolean;
  }) => {
    hasEvolution: boolean;
    currentLevel: number;
    maxLevel: number;
    progress: number;
    threshold: number;
    isMaxLevel: boolean;
    canEvolveNow: boolean;
    /** 'none' | 'need_progress' | 'need_premium' | 'ready' | 'maxed' */
    blockedReason: string;
  } | null;

  beforeAll(async () => {
    const mod = await import('./effectEvolution');
    getEvolutionStatus = mod.getEvolutionStatus;
  });

  it('returns null for non-evolving effects', () => {
    expect(getEvolutionStatus({
      effectKey: 'explode',
      equippedLevel: 1,
      evolutionProgress: 0,
      isPremium: false,
    })).toBeNull();
  });

  it('returns maxed status for Lv2 effects', () => {
    const status = getEvolutionStatus({
      effectKey: 'fighter',
      equippedLevel: 2,
      evolutionProgress: 50,
      isPremium: true,
    });
    expect(status).not.toBeNull();
    expect(status!.isMaxLevel).toBe(true);
    expect(status!.currentLevel).toBe(2);
    expect(status!.blockedReason).toBe('maxed');
  });

  it('shows need_premium when progress met but not premium', () => {
    const status = getEvolutionStatus({
      effectKey: 'fighter',
      equippedLevel: 1,
      evolutionProgress: 50,
      isPremium: false,
    });
    expect(status!.blockedReason).toBe('need_premium');
    expect(status!.canEvolveNow).toBe(false);
  });

  it('shows need_progress when premium but progress not met', () => {
    const status = getEvolutionStatus({
      effectKey: 'fighter',
      equippedLevel: 1,
      evolutionProgress: 30,
      isPremium: true,
    });
    expect(status!.blockedReason).toBe('need_progress');
    expect(status!.progress).toBe(30);
    expect(status!.threshold).toBe(50);
  });

  it('shows ready when all conditions met', () => {
    const status = getEvolutionStatus({
      effectKey: 'fighter',
      equippedLevel: 1,
      evolutionProgress: 50,
      isPremium: true,
    });
    expect(status!.blockedReason).toBe('ready');
    expect(status!.canEvolveNow).toBe(true);
  });

  it('shows need_progress + need_premium when neither condition met', () => {
    const status = getEvolutionStatus({
      effectKey: 'fighter',
      equippedLevel: 1,
      evolutionProgress: 10,
      isPremium: false,
    });
    // Primary blocker: progress (since both are needed)
    expect(status!.blockedReason).toBe('need_progress');
  });
});
