import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type ThemeEntitlements = {
  synthwavePremium: boolean;
};

/**
 * Theme entitlements are stored on the server (Postgres) and guarded by the
 * server session cookie (isAuthenticated).
 *
 * If the server cookie isn't present, this hook falls back to "locked".
 */
export function useThemeEntitlements(): ThemeEntitlements {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<ThemeEntitlements>({ synthwavePremium: false });

  useEffect(() => {
    if (!user) return;

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
        const data = (await resp.json()) as Partial<ThemeEntitlements>;
        if (cancelled) return;
        setEntitlements({ synthwavePremium: !!data.synthwavePremium });
      } catch {
        // Ignore network/auth failures – default remains locked.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return entitlements;
}

