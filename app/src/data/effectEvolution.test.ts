import { describe, it, expect, beforeAll } from 'vitest';

// ── resolveAnimationKey ────────────────────────────────────────────────────
// Given an effect registry key and the user's equippedLevel,
// return the animation key that animations.js should play.
//
// After Phase 3 (separate cards per level), the primary mapping is
// `fighter_punch` → `fighter` and `fighter_punch_lv2` → `fighterLv2` via
// LEGACY_ANIMATION_KEY, so existing baked GIF assets keep working without
// rename. The legacy `evolutionStages`/equippedLevel path remains for any
// future effect that opts into in-place evolution.

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

  it('maps fighter_punch to the legacy `fighter` animation asset', () => {
    expect(resolveAnimationKey('fighter_punch', 1)).toBe('fighter');
  });

  it('maps fighter_punch_lv2 to the legacy `fighterLv2` animation asset', () => {
    expect(resolveAnimationKey('fighter_punch_lv2', 1)).toBe('fighterLv2');
  });

  it('ignores equippedLevel for registry keys that have a LEGACY_ANIMATION_KEY entry', () => {
    expect(resolveAnimationKey('fighter_punch', 2)).toBe('fighter');
    expect(resolveAnimationKey('fighter_punch_lv2', 5)).toBe('fighterLv2');
  });

  it('falls back to base key when registry entry is unknown and equippedLevel < 2', () => {
    expect(resolveAnimationKey('unknownEffect', 0)).toBe('unknownEffect');
    expect(resolveAnimationKey('unknownEffect', 1)).toBe('unknownEffect');
  });
});
