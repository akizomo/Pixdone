import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type PremiumEntitlements = {
  plan: 'free' | 'plus';
  billingCycle: 'monthly' | 'yearly' | null;
  currentPeriodEnd: string | null;
  unlockedThemes: string[];
  isPremium: boolean;
  isTrialing: boolean;
  trialEnd: string | null;
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
  isTrialing: false,
  trialEnd: null,
};

function loadInitialFromStorage(): PremiumEntitlements {
  if (typeof window === 'undefined') return DEFAULT_ENTITLEMENTS;
  try {
    const raw = window.localStorage.getItem('pd-entitlements');
    if (!raw) return DEFAULT_ENTITLEMENTS;
    const parsed = JSON.parse(raw) as Partial<PremiumEntitlements>;
    return {
      plan: parsed.plan === 'plus' ? 'plus' : 'free',
      billingCycle: parsed.billingCycle === 'monthly' || parsed.billingCycle === 'yearly' ? parsed.billingCycle : null,
      currentPeriodEnd: typeof parsed.currentPeriodEnd === 'string' ? parsed.currentPeriodEnd : null,
      unlockedThemes: Array.isArray(parsed.unlockedThemes) ? parsed.unlockedThemes as string[] : [],
      isPremium: parsed.isPremium === true,
      isTrialing: (parsed as any).isTrialing === true,
      trialEnd: typeof (parsed as any).trialEnd === 'string' ? (parsed as any).trialEnd : null,
    };
  } catch {
    return DEFAULT_ENTITLEMENTS;
  }
}

/**
 * Fetches PixDone+ subscription entitlements from the server.
 * Falls back to free-tier defaults when unauthenticated or on error.
 */
export function useThemeEntitlements(): PremiumEntitlements & ThemeEntitlements & { loading: boolean } {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<PremiumEntitlements>(() => loadInitialFromStorage());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setEntitlements(DEFAULT_ENTITLEMENTS);
      setLoading(false);
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
        const next: PremiumEntitlements = {
          plan: data.plan ?? 'free',
          billingCycle: data.billingCycle ?? null,
          currentPeriodEnd: data.currentPeriodEnd ?? null,
          unlockedThemes: data.unlockedThemes ?? [],
          isPremium: data.isPremium === true,
          isTrialing: data.isTrialing === true,
          trialEnd: data.trialEnd ?? null,
        };
        setEntitlements(next);
        try {
          window.localStorage.setItem('pd-entitlements', JSON.stringify(next));
        } catch {
          // ignore storage failures
        }
      } catch {
        // Ignore network/auth failures – default remains locked.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      setLoading(false);
    };
  }, [user]);

  // synthwavePremium は isPremium と同義（後方互換）
  return { ...entitlements, synthwavePremium: entitlements.isPremium, loading };
}
