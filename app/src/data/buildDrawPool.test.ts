import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDrawPool } from './effectsRegistry';

const WITHIN = new Date('2026-04-12T00:00:00+09:00');
const EXPIRED = new Date('2026-06-01T00:00:00+09:00');

describe('buildDrawPool — challenge deadline behavior (fighter)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const hasFighter = (pool: { key: string }[]) => pool.some(e => e.key === 'fighter');

  it('within deadline + owned → included', () => {
    vi.setSystemTime(WITHIN);
    const pool = buildDrawPool(false, 'arcade', ['fighter'], ['fighter']);
    expect(hasFighter(pool)).toBe(true);
  });

  it('within deadline + not owned + free → excluded', () => {
    vi.setSystemTime(WITHIN);
    const pool = buildDrawPool(false, 'arcade', ['fighter'], []);
    expect(hasFighter(pool)).toBe(false);
  });

  it('within deadline + not owned + premium → excluded (still active challenge)', () => {
    vi.setSystemTime(WITHIN);
    const pool = buildDrawPool(true, 'arcade', ['fighter'], []);
    expect(hasFighter(pool)).toBe(false);
  });

  it('expired + owned + free → included (grandfathered)', () => {
    vi.setSystemTime(EXPIRED);
    const pool = buildDrawPool(false, 'arcade', ['fighter'], ['fighter']);
    expect(hasFighter(pool)).toBe(true);
  });

  it('expired + not owned + free → excluded (must upgrade)', () => {
    vi.setSystemTime(EXPIRED);
    const pool = buildDrawPool(false, 'arcade', ['fighter'], []);
    expect(hasFighter(pool)).toBe(false);
  });

  it('expired + not owned + premium → included (treated as premium effect)', () => {
    vi.setSystemTime(EXPIRED);
    const pool = buildDrawPool(true, 'arcade', ['fighter'], []);
    expect(hasFighter(pool)).toBe(true);
  });
});
