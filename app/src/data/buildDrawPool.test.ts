import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDrawPool, isEffectLocked, EFFECTS_REGISTRY } from './effectsRegistry';

// fighter_punch は「最初のチャレンジ」（2026-11〜）: 期限なし・全員参加。
// 日付に関係なく同じ挙動になることを、過去と未来の2時点で確かめる。
const DATES = [
  new Date('2026-04-12T00:00:00+09:00'),
  new Date('2030-01-01T00:00:00+09:00'),
];

describe('buildDrawPool — first challenge (fighter_punch, no deadline)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const hasPunch = (pool: { key: string }[]) => pool.some(e => e.key === 'fighter_punch');

  for (const now of DATES) {
    describe(`at ${now.toISOString()}`, () => {
      beforeEach(() => vi.setSystemTime(now));

      it('owned + free → included', () => {
        expect(hasPunch(buildDrawPool(false, 'arcade', ['fighter_punch'], ['fighter_punch']))).toBe(true);
      });

      it('not owned + free → excluded (earn it via the challenge)', () => {
        expect(hasPunch(buildDrawPool(false, 'arcade', ['fighter_punch'], []))).toBe(false);
      });

      it('not owned + premium → included (PixDone+ can use every Rare / Epic right away)', () => {
        expect(hasPunch(buildDrawPool(true, 'arcade', ['fighter_punch'], []))).toBe(true);
      });
    });
  }

  it('Lv2 (evolution child) is never usable without owning it, even for premium', () => {
    const pool = buildDrawPool(true, 'arcade', ['fighter_punch_lv2'], ['fighter_punch']);
    expect(pool.some(e => e.key === 'fighter_punch_lv2')).toBe(false);
  });
});

describe('fighter_punch registry definition', () => {
  const punch = EFFECTS_REGISTRY.find(e => e.key === 'fighter_punch')!;

  it('is a 10-task challenge with no deadline', () => {
    expect(punch.challengeDeadline).toBeNull();
    expect(punch.challengeUnlockThreshold).toBe(10);
    expect(punch.unlockCondition).toEqual({ kind: 'challenge', threshold: 10, deadline: null });
  });

  it('isEffectLocked: locked for free users until earned, open for premium', () => {
    expect(isEffectLocked(punch, false, [])).toBe(true);
    expect(isEffectLocked(punch, false, ['fighter_punch'])).toBe(false);
    expect(isEffectLocked(punch, true, [])).toBe(false);
  });
});

describe('time-limited challenges keep the old deadline behaviour', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const limited = {
    ...EFFECTS_REGISTRY.find(e => e.key === 'fighter_punch')!,
    key: 'limited_test',
    challengeDeadline: new Date('2026-05-31T23:59:59+09:00'),
    unlockCondition: { kind: 'challenge' as const, threshold: 20, deadline: new Date('2026-05-31T23:59:59+09:00') },
  };

  it('running: locked even for premium', () => {
    vi.setSystemTime(new Date('2026-05-01T00:00:00+09:00'));
    expect(isEffectLocked(limited, true, [])).toBe(true);
  });

  it('expired: premium only', () => {
    vi.setSystemTime(new Date('2026-06-01T00:00:00+09:00'));
    expect(isEffectLocked(limited, true, [])).toBe(false);
    expect(isEffectLocked(limited, false, [])).toBe(true);
  });
});
