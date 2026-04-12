import { describe, it, expect } from 'vitest';
import { mergeEffectProgress, type EffectProgressEntry } from './useEffectProgress';

function makeEntry(
  effectId: string,
  challengeProgress: number,
  overrides: Partial<EffectProgressEntry> = {},
): EffectProgressEntry {
  return {
    id: 1,
    userId: 'u1',
    effectId,
    owned: false,
    equippedLevel: 1,
    evolutionProgress: 0,
    challengeProgress,
    earnedAt: null,
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mergeEffectProgress', () => {
  it('uses server row as-is when local has no entry', () => {
    const result = mergeEffectProgress({}, [makeEntry('fighter', 3)]);
    expect(result.fighter.challengeProgress).toBe(3);
  });

  it('preserves local entry when server returns no row (regression: day-2 reset)', () => {
    // Scenario: user completed 5 tasks on Day 1, POST failed silently,
    // cache has progress=5, GET on Day 2 returns empty. Must keep 5.
    const local = { fighter: makeEntry('fighter', 5) };
    const result = mergeEffectProgress(local, []);
    expect(result.fighter).toBeDefined();
    expect(result.fighter.challengeProgress).toBe(5);
  });

  it('keeps local progress when local > server (optimistic ahead of server)', () => {
    const local = { fighter: makeEntry('fighter', 7) };
    const server = [makeEntry('fighter', 4, { owned: false, equippedLevel: 2 })];
    const result = mergeEffectProgress(local, server);
    expect(result.fighter.challengeProgress).toBe(7);
    // Server authoritative for non-progress fields
    expect(result.fighter.equippedLevel).toBe(2);
  });

  it('uses server progress when server >= local', () => {
    const local = { fighter: makeEntry('fighter', 3) };
    const server = [makeEntry('fighter', 5)];
    const result = mergeEffectProgress(local, server);
    expect(result.fighter.challengeProgress).toBe(5);
  });

  it('keeps owned=true when local has it but server does not (sticky owned)', () => {
    // Scenario: user hit threshold locally (optimistic owned=true), POST failed,
    // server has row but owned=false. Merge must preserve owned=true.
    const local = {
      fighter: makeEntry('fighter', 20, { owned: true, earnedAt: '2026-04-12T00:00:00Z' }),
    };
    const server = [makeEntry('fighter', 15, { owned: false, earnedAt: null })];
    const result = mergeEffectProgress(local, server);
    expect(result.fighter.owned).toBe(true);
    expect(result.fighter.challengeProgress).toBe(20);
    expect(result.fighter.earnedAt).toBe('2026-04-12T00:00:00Z');
  });

  it('uses server owned when local has owned=false', () => {
    const local = { fighter: makeEntry('fighter', 20, { owned: false }) };
    const server = [makeEntry('fighter', 20, { owned: true, earnedAt: '2026-04-10T00:00:00Z' })];
    const result = mergeEffectProgress(local, server);
    expect(result.fighter.owned).toBe(true);
    expect(result.fighter.earnedAt).toBe('2026-04-10T00:00:00Z');
  });

  it('handles mixed case: one effect server-only, one local-only, one overlapping', () => {
    const local = {
      fighter: makeEntry('fighter', 10), // overlapping, local ahead
      laserCutter: makeEntry('laserCutter', 2), // local-only (server missing)
    };
    const server = [
      makeEntry('fighter', 4),
      makeEntry('shatter', 1, { owned: true }), // server-only
    ];
    const result = mergeEffectProgress(local, server);

    expect(result.fighter.challengeProgress).toBe(10);
    expect(result.laserCutter).toBeDefined();
    expect(result.laserCutter.challengeProgress).toBe(2);
    expect(result.shatter.owned).toBe(true);
  });
});
