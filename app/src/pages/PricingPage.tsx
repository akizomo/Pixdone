import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import { playSound } from '../services/sound';
import { Button } from '../design-system';
import { detectDefaultLang, type Lang } from '../lib/i18n';


const FREE_FEATURES = [
  { en: 'Smash List — unlimited', ja: 'Smash List（無制限）' },
  { en: 'Up to 3 task lists', ja: 'タスクリスト 3 件まで' },
  { en: 'Common effects', ja: 'Common エフェクト' },
  { en: 'Challenge effects — earnable during events', ja: 'チャレンジエフェクト（イベント期間中に獲得可能）' },
  { en: 'Default theme (Arcade)', ja: 'デフォルトテーマ（Arcade）' },
  { en: 'Focus timer', ja: 'フォーカスタイマー' },
];

const PLUS_FEATURES = [
  { en: 'Everything in Free', ja: 'Free の全機能' },
  { en: 'Unlimited task lists', ja: '無制限のタスクリスト' },
  { en: 'All preset themes (Synthwave, Forestbit…)', ja: 'プリセットテーマ全種（Synthwave / Forestbit…）' },
  { en: 'Rare & Epic effects', ja: 'Rare・Epic エフェクト' },
  { en: 'Monthly effect request (1/month)', ja: 'エフェクトリクエスト（月1回）' },
];

export function PricingPage() {
  const navigate = useNavigate();
  const { user, syncServerSession } = useAuth();
  const { plan, isTrialing, trialEnd } = useThemeEntitlements();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const lang: Lang = detectDefaultLang();
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Sub-page nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0 8px' }}>
        <Button variant="ghost" size="sm" soundKey="taskCancel" onClick={() => navigate('/')}>
          ← {isJa ? 'もどる' : 'BACK'}
        </Button>
        <span style={{
          fontFamily: 'var(--pd-font-brand)',
          fontSize: '0.875rem',
          color: 'var(--pd-color-text-primary)',
          letterSpacing: '2px',
        }}>
          PIXDONE+
        </span>
      </div>

      {/* Success banner */}
      {successBanner && (
        <div
          role="status"
          style={{
            background: 'var(--pxd-color-feedback-success)',
            color: 'var(--pxd-color-text-inverse)',
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
      <div
        style={{
          flex: 1,
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 0',
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
          <p style={{ color: 'var(--pxd-color-text-secondary)', margin: 0, fontSize: '0.875rem' }}>
            {isJa
              ? 'PixDone+ でリスト上限・全テーマ・Rare / Epic エフェクトを解放'
              : 'Unlock unlimited lists, all themes, and Rare & Epic effects'}
          </p>
          <span
            style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '4px 12px',
              background: 'var(--pxd-color-surface-info)',
              color: 'var(--pxd-color-text-info)',
              border: '2px solid var(--pxd-color-border-info)',
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.75rem',
              letterSpacing: '1px',
            }}
          >
            {isJa ? '7日間の無料トライアル付き' : '7-DAY FREE TRIAL'}
          </span>
        </div>

        {/* Pricing cards */}
        {!isPlusUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Free card */}
            <div
              style={{
                border: '2px solid var(--pxd-color-border-outline)',
                padding: '20px',
                background: 'var(--pxd-color-surface-primary)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  margin: '0 0 4px',
                  color: 'var(--pxd-color-text-tertiary)',
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
                  <li key={f.en} style={{ fontSize: '0.8125rem', color: 'var(--pxd-color-text-secondary)' }}>
                    {isJa ? f.ja : f.en}
                  </li>
                ))}
              </ul>
            </div>

            {/* Plus card */}
            <div
              style={{
                border: '2px solid var(--pxd-color-action-primary)',
                padding: '20px',
                background: 'var(--pxd-color-surface-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p
                    style={{
                      fontFamily: 'var(--pd-font-brand)',
                      fontSize: '0.75rem',
                      letterSpacing: '1px',
                      margin: 0,
                      color: 'var(--pxd-color-text-accent)',
                    }}
                  >
                    PIXDONE+
                  </p>
                  {cycle === 'yearly' && (
                    <span
                      style={{
                        fontFamily: 'var(--pd-font-brand)',
                        fontSize: '0.575rem',
                        letterSpacing: '1px',
                        background: 'var(--pxd-color-surface-info)',
                        color: 'var(--pxd-color-text-info)',
                        border: '1px solid var(--pxd-color-border-info)',
                        padding: '2px 6px',
                      }}
                    >
                      {isJa ? '2ヶ月分お得' : '2 MO. FREE'}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    border: '1px solid var(--pxd-color-border-interactive)',
                  }}
                >
                  {(['monthly', 'yearly'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { playSound('buttonClick'); setCycle(c); }}
                      style={{
                        padding: '4px 10px',
                        background: cycle === c ? 'var(--pxd-color-action-primary)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--pd-font-brand)',
                        fontSize: '0.6rem',
                        color: cycle === c ? 'var(--pxd-color-text-inverse)' : 'var(--pxd-color-text-secondary)',
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
              <p
                style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '1.5rem',
                  margin: '8px 0 4px',
                  letterSpacing: '1px',
                  color: 'var(--pxd-color-text-primary)',
                }}
              >
                {cycle === 'monthly' ? '¥600' : '¥500'}<span style={{ fontSize: '0.75rem', color: 'var(--pxd-color-text-secondary)' }}>{isJa ? '/月' : '/mo'}</span>
              </p>
              {cycle === 'yearly' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--pxd-color-text-tertiary)', margin: '0 0 4px' }}>
                  {isJa ? '年払い ¥6,000' : '¥6,000 billed yearly'}
                </p>
              )}
              <p style={{ fontSize: '0.6875rem', color: 'var(--pxd-color-text-tertiary)', margin: '0 0 16px' }}>
                {isJa
                  ? '7日間無料 → その後自動で課金開始。いつでもキャンセル可能。'
                  : '7-day free trial, then auto-renews. Cancel anytime.'}
              </p>
              <ul style={{ margin: '0 0 20px', padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PLUS_FEATURES.map((f) => (
                  <li key={f.en} style={{ fontSize: '0.8125rem', color: 'var(--pxd-color-text-primary)' }}>
                    {isJa ? f.ja : f.en}
                  </li>
                ))}
              </ul>
              <Button variant="primary" fullWidth loading={loading} onClick={handleUpgrade}>
                {isJa ? '7日間無料で試す' : 'START 7-DAY FREE TRIAL'}
              </Button>
            </div>
          </div>
        )}

        {/* Already subscribed */}
        {isPlusUser && (
          <div
            style={{
              border: '2px solid var(--pxd-color-action-primary)',
              padding: '24px',
              textAlign: 'center',
              background: 'var(--pxd-color-surface-primary)',
            }}
          >
            {isTrialing ? (
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  margin: '0 0 8px',
                  padding: '4px 10px',
                  background: 'var(--pxd-color-surface-info)',
                  color: 'var(--pxd-color-text-info)',
                  border: '1px solid var(--pxd-color-border-info)',
                }}
              >
                {isJa ? '無料トライアル中' : 'FREE TRIAL ACTIVE'}
              </span>
            ) : (
              <p
                style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '0.875rem',
                  letterSpacing: '1px',
                  margin: '0 0 8px',
                  color: 'var(--pxd-color-text-success)',
                }}
              >
                {isJa ? '✓ PixDone+ 加入済み' : '✓ YOU ARE ON PIXDONE+'}
              </p>
            )}
            {isTrialing && trialEnd && (
              <p style={{ color: 'var(--pxd-color-text-secondary)', margin: '0 0 8px', fontSize: '0.8125rem' }}>
                {isJa
                  ? `トライアル終了: ${new Date(trialEnd).toLocaleDateString('ja-JP')}`
                  : `Trial ends: ${new Date(trialEnd).toLocaleDateString('en-US')}`}
              </p>
            )}
            <p style={{ color: 'var(--pxd-color-text-secondary)', margin: '0 0 16px', fontSize: '0.875rem' }}>
              {isJa ? 'すべての機能をご利用いただけます。' : 'You have access to all premium features.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/account')}>
              {isJa ? 'アカウント管理' : 'MANAGE ACCOUNT'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
