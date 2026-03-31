import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import { playSound } from '../services/sound';

const FREE_FEATURES = [
  { en: 'Up to 3 task lists', ja: 'タスクリスト 3 件まで' },
  { en: 'Smash List', ja: 'Smash List' },
  { en: 'Standard themes', ja: 'スタンダードテーマ' },
  { en: 'Standard task effects', ja: 'スタンダードエフェクト' },
  { en: 'Focus timer', ja: 'フォーカスタイマー' },
];

const PLUS_FEATURES = [
  { en: 'Everything in Free', ja: 'Free の全機能' },
  { en: 'Unlimited task lists', ja: '無制限のタスクリスト' },
  { en: 'Premium themes', ja: 'プレミアムテーマ' },
  { en: 'Super rare task effects (Rainbow Smash, Freeze…)', ja: 'レアエフェクト（Rainbow Smash / Freeze…）' },
  { en: 'Priority support', ja: '優先サポート' },
];

type Lang = 'en' | 'ja';

function detectLang(): Lang {
  try { return (localStorage.getItem('pixdone-lang') as Lang) ?? 'en'; } catch { return 'en'; }
}

export function PricingPage() {
  const navigate = useNavigate();
  const { user, syncServerSession } = useAuth();
  const { plan } = useThemeEntitlements();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const lang = detectLang();
  const isJa = lang === 'ja';

  // ?purchase=plus_success banner
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchase') === 'plus_success') {
      setSuccessBanner(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('purchase');
      window.history.replaceState({}, '', url.toString());
      const tid = window.setTimeout(() => setSuccessBanner(false), 5000);
      return () => window.clearTimeout(tid);
    }
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      // Not logged in: go back to main and open auth modal via URL param (simple approach)
      navigate('/?auth=1');
      return;
    }
    setLoading(true);
    playSound('buttonClick');
    try {
      const sync = await syncServerSession();
      if (!sync.ok) {
        window.alert(sync.message || (isJa ? 'ログイン同期に失敗しました。' : 'Session sync failed.'));
        return;
      }
      const resp = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ billingCycle: cycle }),
      });
      if (!resp.ok) {
        let msg = isJa ? `Checkout に失敗しました (${resp.status})` : `Checkout failed (${resp.status})`;
        try {
          const err = (await resp.json()) as { message?: string };
          if (err.message) msg = err.message;
        } catch { /* ignore */ }
        window.alert(msg);
        return;
      }
      const data = (await resp.json()) as { checkoutUrl?: string };
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      window.alert(isJa ? '通信に失敗しました。' : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPlusUser = plan === 'plus';

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--pd-color-background-default)',
        color: 'var(--pd-color-text-primary)',
        fontFamily: 'var(--pd-font-body)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 24px',
          borderBottom: '2px solid var(--pd-color-border-default)',
        }}
      >
        <button
          type="button"
          onClick={() => { playSound('taskCancel'); navigate('/'); }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.75rem',
            color: 'var(--pd-color-text-secondary)',
            letterSpacing: '1px',
            padding: '4px 0',
          }}
        >
          ← {isJa ? 'もどる' : 'BACK'}
        </button>
        <span
          style={{
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.875rem',
            color: 'var(--pd-color-text-primary)',
            letterSpacing: '2px',
          }}
        >
          PIXDONE+
        </span>
      </header>

      {/* Success banner */}
      {successBanner && (
        <div
          role="status"
          style={{
            background: 'var(--pd-color-accent-default)',
            color: 'var(--pd-color-background-default)',
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.75rem',
            letterSpacing: '1px',
            padding: '10px 24px',
            textAlign: 'center',
          }}
        >
          {isJa ? '🎉 PixDone+ へようこそ！' : '🎉 Welcome to PixDone+!'}
        </div>
      )}

      {/* Content */}
      <main
        style={{
          flex: 1,
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
        }}
      >
        {/* Headline */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '1.25rem',
              letterSpacing: '2px',
              margin: '0 0 8px',
            }}
          >
            {isJa ? 'もっと楽しく、もっと自分らしく。' : 'LEVEL UP YOUR PRODUCTIVITY'}
          </h1>
          <p style={{ color: 'var(--pd-color-text-secondary)', margin: 0, fontSize: '0.875rem' }}>
            {isJa
              ? 'PixDone+ でリスト上限・テーマ・レアエフェクトをフル解放'
              : 'Unlock unlimited lists, premium themes, and super rare effects'}
          </p>
        </div>

        {/* Cycle toggle */}
        {!isPlusUser && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                border: '2px solid var(--pd-color-border-default)',
              }}
            >
              {(['monthly', 'yearly'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { playSound('buttonClick'); setCycle(c); }}
                  style={{
                    padding: '8px 20px',
                    background: cycle === c ? 'var(--pd-color-accent-default)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--pd-font-brand)',
                    fontSize: '0.7rem',
                    color: cycle === c ? 'var(--pd-color-background-default)' : 'var(--pd-color-text-primary)',
                    letterSpacing: '1px',
                    transition: 'background 0.15s',
                  }}
                >
                  {c === 'monthly'
                    ? (isJa ? '月払い' : 'MONTHLY')
                    : (isJa ? '年払い' : 'YEARLY')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pricing cards */}
        {!isPlusUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Free card */}
            <div
              style={{
                border: '2px solid var(--pd-color-border-default)',
                padding: '20px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  margin: '0 0 4px',
                  color: 'var(--pd-color-text-secondary)',
                }}
              >
                FREE
              </p>
              <p
                style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '1.25rem',
                  margin: '0 0 16px',
                  letterSpacing: '1px',
                }}
              >
                ¥0
              </p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {FREE_FEATURES.map((f) => (
                  <li key={f.en} style={{ fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)' }}>
                    {isJa ? f.ja : f.en}
                  </li>
                ))}
              </ul>
            </div>

            {/* Plus card */}
            <div
              style={{
                border: '2px solid var(--pd-color-accent-default)',
                padding: '20px',
                background: 'var(--pd-color-accent-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p
                  style={{
                    fontFamily: 'var(--pd-font-brand)',
                    fontSize: '0.75rem',
                    letterSpacing: '1px',
                    margin: 0,
                    color: 'var(--pd-color-accent-default)',
                  }}
                >
                  PIXDONE+
                </p>
                {cycle === 'yearly' && (
                  <span
                    style={{
                      fontFamily: 'var(--pd-font-brand)',
                      fontSize: '0.625rem',
                      letterSpacing: '1px',
                      background: 'var(--pd-color-accent-default)',
                      color: 'var(--pd-color-background-default)',
                      padding: '2px 6px',
                    }}
                  >
                    {isJa ? '2ヶ月無料' : '2 MONTHS FREE'}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '1.25rem',
                  margin: '0 0 4px',
                  letterSpacing: '1px',
                  color: 'var(--pd-color-accent-default)',
                }}
              >
                {cycle === 'monthly' ? '¥600' : '¥500'}{isJa ? '/月' : '/mo'}
              </p>
              {cycle === 'yearly' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--pd-color-text-secondary)', margin: '0 0 16px' }}>
                  {isJa ? '年払い ¥6,000' : '¥6,000 billed yearly'}
                </p>
              )}
              {cycle === 'monthly' && <div style={{ marginBottom: '16px' }} />}
              <ul style={{ margin: '0 0 20px', padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PLUS_FEATURES.map((f) => (
                  <li key={f.en} style={{ fontSize: '0.8125rem', color: 'var(--pd-color-text-primary)' }}>
                    {isJa ? f.ja : f.en}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={loading}
                onClick={handleUpgrade}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? 'var(--pd-color-border-default)' : 'var(--pd-color-accent-default)',
                  border: 'none',
                  borderRadius: 0,
                  cursor: loading ? 'progress' : 'pointer',
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '0.75rem',
                  color: 'var(--pd-color-background-default)',
                  letterSpacing: '1px',
                }}
              >
                {loading
                  ? (isJa ? '処理中...' : 'LOADING...')
                  : (isJa ? 'アップグレード' : 'UPGRADE TO PIXDONE+')}
              </button>
            </div>
          </div>
        )}

        {/* Already subscribed */}
        {isPlusUser && (
          <div
            style={{
              border: '2px solid var(--pd-color-accent-default)',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--pd-font-brand)',
                fontSize: '0.875rem',
                letterSpacing: '1px',
                margin: '0 0 8px',
                color: 'var(--pd-color-accent-default)',
              }}
            >
              {isJa ? '✓ PixDone+ 加入済み' : '✓ YOU ARE ON PIXDONE+'}
            </p>
            <p style={{ color: 'var(--pd-color-text-secondary)', margin: '0 0 16px', fontSize: '0.875rem' }}>
              {isJa ? 'すべての機能をご利用いただけます。' : 'You have access to all premium features.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/account')}
              style={{
                padding: '8px 20px',
                background: 'transparent',
                border: '2px solid var(--pd-color-accent-default)',
                borderRadius: 0,
                cursor: 'pointer',
                fontFamily: 'var(--pd-font-brand)',
                fontSize: '0.7rem',
                color: 'var(--pd-color-accent-default)',
                letterSpacing: '1px',
              }}
            >
              {isJa ? 'アカウント管理' : 'MANAGE ACCOUNT'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
