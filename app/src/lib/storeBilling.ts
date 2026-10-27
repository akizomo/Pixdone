import { Capacitor } from '@capacitor/core';
import { Purchases, PACKAGE_TYPE, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { apiUrl } from './apiUrl';

/**
 * App Store / Google Play subscriptions via RevenueCat (native apps only).
 * Stripe checkout must never be used inside the store apps; the server learns about
 * store purchases from RevenueCat's webhook (server/billing/revenuecat.ts).
 *
 * The SDK keys are public (safe to ship). Without them the native app simply shows
 * the paywall as "coming soon".
 */
const SDK_KEY =
  Capacitor.getPlatform() === 'ios'
    ? import.meta.env.VITE_REVENUECAT_IOS_KEY
    : Capacitor.getPlatform() === 'android'
      ? import.meta.env.VITE_REVENUECAT_ANDROID_KEY
      : undefined;

/** True when running in a store app that has RevenueCat configured. */
export function isStoreBillingAvailable(): boolean {
  return Capacitor.isNativePlatform() && !!SDK_KEY;
}

let configured: Promise<void> | null = null;
let loggedInUid: string | null = null;

function ensureConfigured(): Promise<void> {
  if (!configured) {
    configured = Purchases.configure({ apiKey: SDK_KEY as string }).catch((e) => {
      configured = null;
      throw e;
    });
  }
  return configured;
}

/** Tie purchases to the Firebase uid (= users.id on the server). Call after sign-in. */
export async function loginStoreBilling(uid: string): Promise<void> {
  if (!isStoreBillingAvailable() || loggedInUid === uid) return;
  await ensureConfigured();
  await Purchases.logIn({ appUserID: uid });
  loggedInUid = uid;
}

export async function logoutStoreBilling(): Promise<void> {
  if (!isStoreBillingAvailable() || !loggedInUid) return;
  loggedInUid = null;
  try {
    await Purchases.logOut();
  } catch {
    // Already anonymous — nothing to do.
  }
}

export interface StorePackages {
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
}

export async function loadStorePackages(): Promise<StorePackages> {
  await ensureConfigured();
  const offering = (await Purchases.getOfferings()).current;
  const byType = (t: PACKAGE_TYPE) => offering?.availablePackages.find((p) => p.packageType === t) ?? null;
  return { monthly: byType(PACKAGE_TYPE.MONTHLY), yearly: byType(PACKAGE_TYPE.ANNUAL) };
}

export type PurchaseOutcome = 'purchased' | 'cancelled';

export async function purchaseStorePackage(aPackage: PurchasesPackage): Promise<PurchaseOutcome> {
  await ensureConfigured();
  try {
    await Purchases.purchasePackage({ aPackage });
    return 'purchased';
  } catch (e) {
    const err = e as { code?: string; userCancelled?: boolean | null };
    if (err.userCancelled || err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
    throw e;
  }
}

/** Required by App Store review: lets users on a new device get their subscription back. */
export async function restoreStorePurchases(): Promise<void> {
  await ensureConfigured();
  await Purchases.restorePurchases();
}

/** Where the user manages / cancels a store subscription. */
export async function getStoreManagementUrl(): Promise<string> {
  try {
    await ensureConfigured();
    const { customerInfo } = await Purchases.getCustomerInfo();
    if (customerInfo.managementURL) return customerInfo.managementURL;
  } catch {
    // fall through to the store's generic page
  }
  return Capacitor.getPlatform() === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';
}

export const ENTITLEMENTS_REFRESH_EVENT = 'pd:entitlements-refresh';

/**
 * RevenueCat tells our server via webhook, which can lag the purchase by a few
 * seconds. Poll the server (the source of truth for isPremium) before telling the
 * UI to refresh. Returns false if it hasn't caught up yet (the webhook will still land).
 */
export async function waitForServerPlus(timeoutMs = 20000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const resp = await fetch(apiUrl('/api/billing/entitlements'), { credentials: 'include' });
      if (resp.ok && ((await resp.json()) as { isPremium?: boolean }).isPremium === true) {
        window.dispatchEvent(new Event(ENTITLEMENTS_REFRESH_EVENT));
        return true;
      }
    } catch {
      // transient — keep polling
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  window.dispatchEvent(new Event(ENTITLEMENTS_REFRESH_EVENT));
  return false;
}
