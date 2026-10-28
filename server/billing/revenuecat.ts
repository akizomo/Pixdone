import crypto from 'crypto';

/**
 * RevenueCat webhook → subscription state.
 *
 * App Store / Google Play subscriptions are bought through RevenueCat in the
 * native apps. RevenueCat's app_user_id is the Firebase uid, which is also our
 * users.id, so events map straight onto the same columns Stripe updates.
 *
 * https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 */

export type StoreProvider = 'app_store' | 'play_store';

export interface RevenueCatEvent {
  type: string;
  app_user_id?: string;
  product_id?: string;
  period_type?: 'TRIAL' | 'INTRO' | 'NORMAL' | 'PROMOTIONAL' | 'PREPAID' | string;
  expiration_at_ms?: number | null;
  store?: string;
  environment?: 'SANDBOX' | 'PRODUCTION' | string;
}

export interface SubscriptionUpdate {
  plan: 'plus' | 'free';
  billingCycle: 'monthly' | 'yearly' | null;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  provider: StoreProvider;
}

export type RevenueCatAction =
  | { kind: 'update'; userId: string; update: SubscriptionUpdate }
  | { kind: 'ignore'; reason: string };

const STORE_PROVIDERS: Record<string, StoreProvider> = {
  APP_STORE: 'app_store',
  MAC_APP_STORE: 'app_store',
  PLAY_STORE: 'play_store',
};

/** Events after which the user should (still) have access until expiration. */
const ACTIVE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'SUBSCRIPTION_EXTENDED',
  'TEMPORARY_ENTITLEMENT_GRANT',
  'REFUND_REVERSED',
  // Auto-renew turned off: access continues until expiration (or ends now on refund,
  // in which case expiration_at_ms is already in the past).
  'CANCELLATION',
]);

function billingCycleOf(productId: string | undefined): 'monthly' | 'yearly' | null {
  if (!productId) return null;
  if (/year|annual/i.test(productId)) return 'yearly';
  if (/month/i.test(productId)) return 'monthly';
  return null;
}

export function revenueCatEventToAction(event: RevenueCatEvent, now: Date = new Date()): RevenueCatAction {
  const userId = event.app_user_id;
  if (!userId) return { kind: 'ignore', reason: 'missing app_user_id' };
  // Purchases are only offered after sign-in (Purchases.logIn(uid)), so an anonymous
  // id means something bypassed that flow; there is no account to attach it to.
  if (userId.startsWith('$RCAnonymousID')) return { kind: 'ignore', reason: 'anonymous app_user_id' };

  const provider = event.store ? STORE_PROVIDERS[event.store] : undefined;
  if (!provider) return { kind: 'ignore', reason: `unsupported store ${event.store ?? '(none)'}` };

  const expiration = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;

  if (event.type === 'EXPIRATION') {
    return {
      kind: 'update',
      userId,
      update: { plan: 'free', billingCycle: null, currentPeriodEnd: null, trialEnd: null, provider },
    };
  }

  if (ACTIVE_EVENTS.has(event.type)) {
    const active = expiration !== null && expiration > now;
    return {
      kind: 'update',
      userId,
      update: {
        plan: active ? 'plus' : 'free',
        billingCycle: active ? billingCycleOf(event.product_id) : null,
        currentPeriodEnd: active ? expiration : null,
        trialEnd: active && event.period_type === 'TRIAL' ? expiration : null,
        provider,
      },
    };
  }

  // TEST, BILLING_ISSUE (store grace period keeps access), PRODUCT_CHANGE (the
  // following RENEWAL carries the new product), TRANSFER, etc.
  return { kind: 'ignore', reason: `no-op event ${event.type}` };
}

/**
 * A store event may only change a subscription that store owns (or none yet), and
 * a Stripe event only one Stripe owns — so an old Stripe cancellation can't revoke
 * an active App Store subscription, and vice versa. New purchases always win.
 */
export function mayUpdateSubscription(
  currentProvider: string | null | undefined,
  currentPlan: string | null | undefined,
  incomingProvider: string,
  incomingPlan: 'plus' | 'free',
): boolean {
  if (incomingPlan === 'plus') return true;
  if (!currentProvider || currentPlan !== 'plus') return true;
  return currentProvider === incomingProvider;
}

/**
 * Constant-time check of the webhook's Authorization header against the configured
 * secret. Surrounding whitespace is ignored on both sides: a trailing newline pasted
 * into an environment variable is easy to miss and would otherwise reject every event.
 */
export function authorizationMatches(given: string | undefined, expected: string | undefined): boolean {
  const want = (expected ?? '').trim();
  if (!want) return false; // never accept anything when no secret is configured
  const got = Buffer.from((given ?? '').trim());
  const wantBuf = Buffer.from(want);
  return got.length === wantBuf.length && crypto.timingSafeEqual(got, wantBuf);
}
