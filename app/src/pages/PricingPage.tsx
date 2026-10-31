import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import { playSound } from '../services/sound';
import { Button, PixelIcon } from '../design-system';
import { detectDefaultLang, type Lang } from '../lib/i18n';
import { apiUrl } from '../lib/apiUrl';
import { Capacitor } from '@capacitor/core';
import {
  isStoreBillingAvailable, loadStorePackages, purchaseStorePackage, restoreStorePurchases, waitForServerPlus,
  type StorePackages,
} from '../lib/storeBilling';
import './PricingPage.css';


const FREE_FEATURES = [
  { en: 'Smash List — unlimited', ja: 'Smash List（無制限）' },
  { en: 'Up to 3 task lists', ja: 'タスクリスト 3 件まで' },
  { en: 'Common effects', ja: 'Common エフェクト' },

  { en: 'Default theme (Arcade)', ja: 'デフォルトテーマ（Arcade）' },
  { en: 'Focus timer', ja: 'フォーカスタイマー' },
];

const PLUS_FEATURES = [
  { en: 'Everything in Free', ja: 'Free の全機能' },
  { en: 'Unlimited task lists', ja: '無制限のタスクリスト' },
  { en: 'All preset themes (Synthwave, Forestbit…)', ja: 'プリセットテーマ全種（Synthwave / Forestbit…）' },
  { en: 'Rare & Epic effects', ja: 'Rare・Epic エフェクト' },
];

export function PricingPage() {
  const navigate = useNavigate();
  const { user, syncServerSession } = useAuth();
  const { plan, isTrialing, trialEnd } = useThemeEntitlements();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  // Native store apps buy through the App Store / Google Play (never Stripe).
  const isNativeApp = Capacitor.isNativePlatform();
  const storeReady = isStoreBillingAvailable();
  const [storePackages, setStorePackages] = useState<StorePackages | null>(null);
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

  useEffect(() => {
    if (!storeReady) return;
    let cancelled = false;
    loadStorePackages()
      .then((p) => { if (!cancelled) setStorePackages(p); })
      .catch(() => { if (!cancelled) setStorePackages({ monthly: null, yearly: null }); });
    return () => { cancelled = true; };
  }, [storeReady]);

  const showPurchased = () => {
    setSuccessBanner(true);
    window.setTimeout(() => setSuccessBanner(false), 5000);
  };

  const handleStorePurchase = async () => {
    const pkg = cycle === 'monthly' ? storePackages?.monthly : storePackages?.yearly;
    if (!pkg) return;
    setLoading(true);
    try {
      if ((await purchaseStorePackage(pkg)) === 'cancelled') return;
      if (await waitForServerPlus()) {
        showPurchased();
      } else {
        window.alert(isJa
          ? '購入は完了しました。反映に少し時間がかかっています。しばらくしてからアプリを開き直してください。'
          : 'Purchase complete. It is taking a moment to apply — please reopen the app shortly.');
      }
    } catch {
      window.alert(isJa ? '購入に失敗しました。もう一度お試しください。' : 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await restoreStorePurchases();
      if (await waitForServerPlus(8000)) {
        showPurchased();
      } else {
        window.alert(isJa ? '復元できる購入が見つかりませんでした。' : 'No purchases to restore were found.');
      }
    } catch {
      window.alert(isJa ? '購入の復元に失敗しました。' : 'Could not restore purchases.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (isNativeApp) {
      if (!user) { navigate('/?auth=1'); return; }
      await handleStorePurchase();
      return;
    }
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
      const resp = await fetch(apiUrl('/api/billing/create-checkout-session'), {
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

  // Prices come from the store (localized, store-tax-aware), never hard-coded in the apps.
  const storePrice = {
    main: cycle === 'monthly'
      ? storePackages?.monthly?.product.priceString
      : storePackages?.yearly?.product.pricePerMonthString ?? storePackages?.yearly?.product.priceString,
    yearly: storePackages?.yearly?.product.priceString,
  };
  const storeUnavailable = isNativeApp && (!storeReady || (storePackages !== null && !(cycle === 'monthly' ? storePackages.monthly : storePackages.yearly)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Sub-page nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0 8px' }}>
        <Button variant="ghost" size="sm" soundKey="taskCancel" onClick={() => navigate('/')}>
          <PixelIcon name="arrow_back" size="sm" />
          {isJa ? 'もどる' : 'BACK'}
        </Button>
        <span style={{
          fontFamily: 'var(--pd-font-brand)',
          fontSize: 'var(--pd-font-size-sm)',
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
            background: 'var(--pd-color-feedback-success)',
            color: 'var(--pd-color-text-inverse)',
            fontFamily: 'var(--pd-font-brand)',
            fontSize: 'var(--pd-font-size-sm)',
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
              fontSize: 'var(--pd-font-size-xl)',
              letterSpacing: '2px',
              margin: '0 0 8px',
            }}
          >
            {isJa ? 'もっと楽しく、もっと自分らしく。' : 'LEVEL UP YOUR PRODUCTIVITY'}
          </h1>
          <p style={{ color: 'var(--pd-color-text-secondary)', margin: 0, fontSize: 'var(--pd-font-size-sm)' }}>
            {isJa
              ? 'PixDone+ でリスト上限・全テーマ・Rare / Epic エフェクトを解放'
              : 'Unlock unlimited lists, all themes, and Rare & Epic effects'}
          </p>
          <span
            style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '4px 12px',
              background: 'var(--pd-color-surface-info)',
              color: 'var(--pd-color-text-info)',
              border: '2px solid var(--pd-color-border-info)',
              fontFamily: 'var(--pd-font-brand)',
              fontSize: 'var(--pd-font-size-sm)',
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
                border: '2px solid var(--pd-color-border-outline)',
                padding: '20px',
                background: 'var(--pd-color-surface-primary)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: 'var(--pd-font-size-sm)',
                  letterSpacing: '1px',
                  margin: '0 0 4px',
                  color: 'var(--pd-color-text-tertiary)',
                }}
              >
                FREE
              </p>
              <p
                style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: 'var(--pd-font-size-xl)',
                  margin: '0 0 16px',
                  letterSpacing: '1px',
                }}
              >
                ¥0
              </p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {FREE_FEATURES.map((f) => (
                  <li key={f.en} style={{ fontSize: 'var(--pd-font-size-xs)', color: 'var(--pd-color-text-secondary)' }}>
                    {isJa ? f.ja : f.en}
                  </li>
                ))}
              </ul>
            </div>

            {/* Plus card */}
            <div
              style={{
                border: '2px solid var(--pd-color-action-primary)',
                padding: '20px',
                background: 'var(--pd-color-surface-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p
                    style={{
                      fontFamily: 'var(--pd-font-brand)',
                      fontSize: 'var(--pd-font-size-sm)',
                      letterSpacing: '1px',
                      margin: 0,
                      color: 'var(--pd-color-text-accent)',
                    }}
                  >
                    PIXDONE+
                  </p>
                  {cycle === 'yearly' && (
                    <span
                      style={{
                        fontFamily: 'var(--pd-font-brand)',
                        fontSize: 'var(--pd-font-size-sm)',
                        letterSpacing: '1px',
                        whiteSpace: 'nowrap',
                        background: 'var(--pd-color-surface-info)',
                        color: 'var(--pd-color-text-info)',
                        border: '1px solid var(--pd-color-border-info)',
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
                    border: '1px solid var(--pd-color-border-interactive)',
                  }}
                >
                  {(['monthly', 'yearly'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="pd-tap-area"
                      onClick={() => { playSound('buttonClick'); setCycle(c); }}
                      style={{
                        padding: '4px 10px',
                        background: cycle === c ? 'var(--pd-color-action-primary)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--pd-font-brand)',
                        fontSize: 'var(--pd-font-size-sm)',
                        color: cycle === c ? 'var(--pd-color-text-inverse)' : 'var(--pd-color-text-secondary)',
                        letterSpacing: '1px',
                        whiteSpace: 'nowrap',
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
                  fontSize: 'var(--pd-font-size-2xl)',
                  margin: '8px 0 4px',
                  letterSpacing: '1px',
                  color: 'var(--pd-color-text-primary)',
                }}
              >
                {isNativeApp
                  ? (storePrice.main ?? '—')
                  : (cycle === 'monthly' ? '¥300' : '¥250')}<span style={{ fontSize: 'var(--pd-font-size-sm)', color: 'var(--pd-color-text-secondary)' }}>{isJa ? '/月' : '/mo'}</span>
              </p>
              {cycle === 'yearly' && (
                <p style={{ fontSize: 'var(--pd-font-size-2xs)', color: 'var(--pd-color-text-tertiary)', margin: '0 0 4px' }}>
                  {isNativeApp
                    ? (storePrice.yearly ? (isJa ? `年払い ${storePrice.yearly}` : `${storePrice.yearly} billed yearly`) : '')
                    : (isJa ? '年払い ¥3,000' : '¥3,000 billed yearly')}
                </p>
              )}
              <p style={{ fontSize: 'var(--pd-font-size-3xs)', color: 'var(--pd-color-text-tertiary)', margin: '0 0 16px' }}>
                {isJa
                  ? '7日間無料。その後自動で課金開始。いつでもキャンセル可能。'
                  : '7-day free trial, then auto-renews. Cancel anytime.'}
              </p>
              <ul style={{ margin: '0 0 20px', padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PLUS_FEATURES.map((f) => (
                  <li key={f.en} style={{ fontSize: 'var(--pd-font-size-xs)', color: 'var(--pd-color-text-primary)' }}>
                    {isJa ? f.ja : f.en}
                  </li>
                ))}
              </ul>
              <Button
                variant="primary"
                fullWidth
                loading={loading || (isNativeApp && storeReady && storePackages === null)}
                disabled={storeUnavailable}
                onClick={handleUpgrade}
              >
                {storeUnavailable
                  ? (isJa ? '準備中です' : 'COMING SOON')
                  : (isJa ? '7日間無料で試す' : 'START 7-DAY FREE TRIAL')}
              </Button>
              {isNativeApp && storeReady && user && (
                <div className="pricing-restore">
                  <Button variant="ghost" size="sm" disabled={loading} onClick={handleRestore}>
                    {isJa ? '購入を復元' : 'Restore purchases'}
                  </Button>
                </div>
              )}
              {isNativeApp && (
                // App Store guideline 3.1.2: subscription screens must link Terms and Privacy.
                // apiUrl() makes these absolute so they open in the system browser, not the app bundle.
                <p className="pricing-legal">
                  <a href={apiUrl('/terms.html')} target="_blank" rel="noopener noreferrer">{isJa ? '利用規約' : 'Terms of Use'}</a>
                  {' · '}
                  <a href={apiUrl('/privacy.html')} target="_blank" rel="noopener noreferrer">{isJa ? 'プライバシーポリシー' : 'Privacy Policy'}</a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Already subscribed */}
        {isPlusUser && (
          <div
            style={{
              border: '2px solid var(--pd-color-action-primary)',
              padding: '24px',
              textAlign: 'center',
              background: 'var(--pd-color-surface-primary)',
            }}
          >
            {isTrialing ? (
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: 'var(--pd-font-size-sm)',
                  letterSpacing: '1px',
                  margin: '0 0 8px',
                  padding: '4px 10px',
                  background: 'var(--pd-color-surface-info)',
                  color: 'var(--pd-color-text-info)',
                  border: '1px solid var(--pd-color-border-info)',
                }}
              >
                {isJa ? '無料トライアル中' : 'FREE TRIAL ACTIVE'}
              </span>
            ) : (
              <p
                style={{
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: 'var(--pd-font-size-sm)',
                  letterSpacing: '1px',
                  margin: '0 0 8px',
                  color: 'var(--pd-color-text-success)',
                }}
              >
                {isJa ? '✓ PixDone+ 加入済み' : '✓ YOU ARE ON PIXDONE+'}
              </p>
            )}
            {isTrialing && trialEnd && (
              <p style={{ color: 'var(--pd-color-text-secondary)', margin: '0 0 8px', fontSize: 'var(--pd-font-size-xs)' }}>
                {isJa
                  ? `トライアル終了: ${new Date(trialEnd).toLocaleDateString('ja-JP')}`
                  : `Trial ends: ${new Date(trialEnd).toLocaleDateString('en-US')}`}
              </p>
            )}
            <p style={{ color: 'var(--pd-color-text-secondary)', margin: '0 0 16px', fontSize: 'var(--pd-font-size-sm)' }}>
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
