import { describe, expect, it } from 'vitest';
import { mayUpdateSubscription, revenueCatEventToAction } from './revenuecat.js';

const NOW = new Date('2026-11-01T00:00:00Z');
const FUTURE = Date.parse('2026-12-01T00:00:00Z');
const PAST = Date.parse('2026-10-01T00:00:00Z');

describe('revenueCatEventToAction', () => {
  it('activates plus on initial purchase with cycle from product id', () => {
    const a = revenueCatEventToAction({
      type: 'INITIAL_PURCHASE', app_user_id: 'uid1', store: 'APP_STORE',
      product_id: 'pixdone_plus_yearly', period_type: 'NORMAL', expiration_at_ms: FUTURE,
    }, NOW);
    expect(a).toEqual({
      kind: 'update', userId: 'uid1',
      update: { plan: 'plus', billingCycle: 'yearly', currentPeriodEnd: new Date(FUTURE), trialEnd: null, provider: 'app_store' },
    });
  });

  it('records trial end when the purchase starts a trial', () => {
    const a = revenueCatEventToAction({
      type: 'INITIAL_PURCHASE', app_user_id: 'uid1', store: 'PLAY_STORE',
      product_id: 'pixdone_plus_monthly', period_type: 'TRIAL', expiration_at_ms: FUTURE,
    }, NOW);
    expect(a.kind === 'update' && a.update).toMatchObject({ plan: 'plus', billingCycle: 'monthly', trialEnd: new Date(FUTURE), provider: 'play_store' });
  });

  it('keeps access after cancellation until expiration', () => {
    const a = revenueCatEventToAction({ type: 'CANCELLATION', app_user_id: 'uid1', store: 'APP_STORE', expiration_at_ms: FUTURE }, NOW);
    expect(a.kind === 'update' && a.update.plan).toBe('plus');
  });

  it('revokes immediately when a cancellation is already expired (refund)', () => {
    const a = revenueCatEventToAction({ type: 'CANCELLATION', app_user_id: 'uid1', store: 'APP_STORE', expiration_at_ms: PAST }, NOW);
    expect(a.kind === 'update' && a.update.plan).toBe('free');
  });

  it('downgrades on expiration', () => {
    const a = revenueCatEventToAction({ type: 'EXPIRATION', app_user_id: 'uid1', store: 'PLAY_STORE' }, NOW);
    expect(a.kind === 'update' && a.update).toMatchObject({ plan: 'free', provider: 'play_store' });
  });

  it('ignores anonymous users, non-store events and no-op types', () => {
    expect(revenueCatEventToAction({ type: 'RENEWAL', app_user_id: '$RCAnonymousID:abc', store: 'APP_STORE', expiration_at_ms: FUTURE }, NOW).kind).toBe('ignore');
    expect(revenueCatEventToAction({ type: 'RENEWAL', app_user_id: 'uid1', store: 'STRIPE', expiration_at_ms: FUTURE }, NOW).kind).toBe('ignore');
    expect(revenueCatEventToAction({ type: 'BILLING_ISSUE', app_user_id: 'uid1', store: 'APP_STORE' }, NOW).kind).toBe('ignore');
    expect(revenueCatEventToAction({ type: 'TEST', app_user_id: 'uid1', store: 'APP_STORE' }, NOW).kind).toBe('ignore');
  });
});

describe('mayUpdateSubscription', () => {
  it('lets a new purchase from any provider win', () => {
    expect(mayUpdateSubscription('stripe', 'plus', 'app_store', 'plus')).toBe(true);
  });
  it('does not let one provider revoke another provider\'s active plan', () => {
    expect(mayUpdateSubscription('app_store', 'plus', 'stripe', 'free')).toBe(false);
    expect(mayUpdateSubscription('stripe', 'plus', 'play_store', 'free')).toBe(false);
  });
  it('lets the owning provider revoke, and anything update a free or legacy row', () => {
    expect(mayUpdateSubscription('app_store', 'plus', 'app_store', 'free')).toBe(true);
    expect(mayUpdateSubscription(null, 'plus', 'stripe', 'free')).toBe(true);
    expect(mayUpdateSubscription('app_store', 'free', 'stripe', 'free')).toBe(true);
  });
});
