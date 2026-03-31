import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type PremiumEntitlements = {
  plan: 'free' | 'plus';
  billingCycle: 'monthly' | 'yearly' | null;
  currentPeriodEnd: string | null;
  unlockedThemes: string[];
  isPremium: boolean;
};

/** @deprecated Use PremiumEntitlements instead */
export type ThemeEntitlements = {
  synthwavePremium: boolean;
};

const DEFAULT_ENTITLEMENTS: PremiumEntitlements = {
  plan: 'free',
  billingCycle: null,
  currentPeriodEnd: null,
  unlockedThemes: [],
  isPremium: false,
};

/**
 * Fetches PixDone+ subscription entitlements from the server.
 * Falls back to free-tier defaults when unauthenticated or on error.
 */
export function useThemeEntitlements(): PremiumEntitlements & ThemeEntitlements {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<PremiumEntitlements>(DEFAULT_ENTITLEMENTS);

  useEffect(() => {
    if (!user) {
      setEntitlements(DEFAULT_ENTITLEMENTS);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/billing/entitlements', {
          method: 'GET',
          credentials: 'include',
        });
        if (resp.status === 401 && import.meta.env.DEV) {
          console.debug(
            '[useThemeEntitlements] 401 — Passport セッション未同期の可能性。AuthContext の firebase-session 同期を確認。',
          );
        }
        if (!resp.ok) return;
        const data = await resp.json();
        if (cancelled) return;
        setEntitlements({
          plan: data.plan ?? 'free',
          billingCycle: data.billingCycle ?? null,
          currentPeriodEnd: data.currentPeriodEnd ?? null,
          unlockedThemes: data.unlockedThemes ?? [],
          isPremium: data.isPremium === true,
        });
      } catch {
        // Ignore network/auth failures – default remains locked.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // synthwavePremium は isPremium と同義（後方互換）
  return { ...entitlements, synthwavePremium: entitlements.isPremium };
}
