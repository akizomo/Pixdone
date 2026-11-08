import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from '../hooks/useNavigate';
import { useGoBack } from '../hooks/useGoBack';
import { useAuth } from '../contexts/AuthContext';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import { playSound } from '../services/sound';
import { Button, ModalDialog, useToast } from '../design-system';
import { SubPageHeader } from '../components/SubPageHeader';
import { detectDefaultLang, type Lang } from '../lib/i18n';
import { apiUrl } from '../lib/apiUrl';
import { Capacitor } from '@capacitor/core';
import {
  isStoreBillingAvailable, loadStorePackages, purchaseStorePackage, restoreStorePurchases, waitForServerPlus, syncStorePurchase,
  type StorePackages,
} from '../lib/storeBilling';
import {
  parsePricingSource, trackPricingView, trackPurchaseStart, trackPurchaseSuccess, trackPurchaseCancel,
} from '../services/analytics';
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
  const goBack = useGoBack();
  const { showToast } = useToast();
  const { user, syncServerSession } = useAuth();
  const { plan, isTrialing, trialEnd } = useThemeEntitlements();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  // Welcome dialog after a purchase / restore (or ?purchase=plus_success from Stripe).
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  // After a store purchase the dialog opens at once; this says whether PixDone+ is unlocked yet.
  const [applyState, setApplyState] = useState<'applying' | 'done' | 'delayed'>('done');
  // Native store apps buy through the App Store / Google Play (never Stripe).
  const isNativeApp = Capacitor.isNativePlatform();
  const storeReady = isStoreBillingAvailable();
  const [storePackages, setStorePackages] = useState<StorePackages | null>(null);
  const lang: Lang = detectDefaultLang();
  const isJa = lang === 'ja';
  const [searchParams] = useSearchParams();
  const source = parsePricingSource(searchParams.get('source'));

  useEffect(() => {
    trackPricingView({ source });
  }, [source]);

  // ?purchase=plus_success (back from Stripe Checkout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchase') === 'plus_success') {
      setWelcomeOpen(true);
      playSound('taskComplete');
      const url = new URL(window.location.href);
      url.searchParams.delete('purchase');
      window.history.replaceState({}, '', url.toString());
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
    setApplyState('done');
    setWelcomeOpen(true);
    playSound('taskComplete');
  };

  const handleStorePurchase = async () => {
    const pkg = cycle === 'monthly' ? storePackages?.monthly : storePackages?.yearly;
    if (!pkg) return;
    setLoading(true);
    trackPurchaseStart({ plan: cycle });
    try {
      if ((await purchaseStorePackage(pkg)) === 'cancelled') {
        trackPurchaseCancel();
        return;
      }
      // The App Store has confirmed the purchase: say so now instead of leaving the screen unchanged
      // while we wait for the server to hear about it from RevenueCat.
      setApplyState('applying');
      setWelcomeOpen(true);
      playSound('taskComplete');
      // Ask the server to check RevenueCat directly (about a second); the webhook is only the fallback.
      const status = (await syncStorePurchase()) ?? (await waitForServerPlus());
      if (status) {
        trackPurchaseSuccess({ plan: status.billingCycle ?? cycle, is_trial: status.isTrialing });
        setApplyState('done');
      } else {
        setApplyState('delayed');
        // The webhook may just be slow: keep checking quietly and switch the dialog when it lands.
        void waitForServerPlus(180000).then((late) => {
          if (!late) return;
          trackPurchaseSuccess({ plan: late.billingCycle ?? cycle, is_trial: late.isTrialing });
          setApplyState('done');
        });
      }
    } catch {
      showToast({ message: isJa ? '購入に失敗しました。もう一度お試しください。' : 'Purchase failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await restoreStorePurchases();
      if ((await syncStorePurchase()) ?? (await waitForServerPlus(8000))) {
        showPurchased();
      } else {
        showToast({ message: isJa ? '復元できる購入が見つかりませんでした。' : 'No purchases to restore were found.' });
      }
    } catch {
      showToast({ message: isJa ? '購入の復元に失敗しました。' : 'Could not restore purchases.' });
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
    trackPurchaseStart({ plan: cycle });
    try {
      const sync = await syncServerSession();
      if (!sync.ok) {
        showToast({ message: sync.message || (isJa ? 'ログイン同期に失敗しました。' : 'Session sync failed.') });
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
        showToast({ message: msg });
        return;
      }
      const data = (await resp.json()) as { checkoutUrl?: string };
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      showToast({ message: isJa ? '通信に失敗しました。' : 'Network error. Please try again.' });
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
    <div className="pricing__col-1" data-pd-screen>
      <SubPageHeader title="PIXDONE+" isJa={isJa} onBack={goBack} />

      {/* Purchase complete: a dialog so it is seen even when the page is scrolled to the button */}
      <ModalDialog
        open={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        title={isJa ? 'PixDone+ へようこそ！' : 'Welcome to PixDone+!'}
        description={applyState === 'applying'
          ? (isJa ? '購入が完了しました。PixDone+ を反映しています…' : 'Purchase complete. Activating PixDone+…')
          : applyState === 'delayed'
            ? (isJa
              ? '購入は完了しましたが、反映に時間がかかっています。このまま待つと自動で反映されます。反映されない場合は、料金画面の「購入を復元」を押してください。'
              : 'Purchase complete, but activation is taking longer than usual. It will apply automatically; if it does not, tap "Restore purchases" on the pricing screen.')
            : isTrialing && trialEnd
              ? (isJa
                ? `無料トライアルが始まりました（${new Date(trialEnd).toLocaleDateString('ja-JP')} まで）。`
                : `Your free trial has started (until ${new Date(trialEnd).toLocaleDateString('en-US')}).`)
              : (isJa ? '購入が完了しました。' : 'Your purchase is complete.')}
        actions={
          <Button variant="primary" soundKey="taskComplete" onClick={() => setWelcomeOpen(false)}>
            OK
          </Button>
        }
      >
        <ul className="pricing__col-4">
          {PLUS_FEATURES.slice(1).map((f) => (
            <li key={f.en} className="pricing__text-14">
              {isJa ? f.ja : f.en}
            </li>
          ))}
        </ul>
      </ModalDialog>

      {/* Content */}
      <div
        className="pricing__content"
      >
        {/* Headline */}
        <div className="pricing__headline">
          <h1
            className="pricing__text-2"
          >
            {isJa ? 'もっと楽しく、もっと自分らしく。' : 'LEVEL UP YOUR PRODUCTIVITY'}
          </h1>
          <p className="pricing__text-3">
            {isJa
              ? 'PixDone+ でリスト上限・全テーマ・Rare / Epic エフェクトを解放'
              : 'Unlock unlimited lists, all themes, and Rare & Epic effects'}
          </p>
          <span
            className="pricing__text-4"
          >
            {isJa ? '7日間の無料トライアル付き' : '7-DAY FREE TRIAL'}
          </span>
        </div>

        {/* Pricing cards */}
        {!isPlusUser && (
          <div className="pricing__col-2">
            {/* Free card */}
            <div
              className="pricing__free-card"
            >
              <p
                className="pricing__text-5"
              >
                FREE
              </p>
              <p
                className="pricing__text-6"
              >
                ¥0
              </p>
              <ul className="pricing__col-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f.en} className="pricing__text-7">
                    {isJa ? f.ja : f.en}
                  </li>
                ))}
              </ul>
            </div>

            {/* Plus card */}
            <div
              className="pricing__plus-card"
            >
              <div className="pricing__row-1">
                <div className="pricing__row-2">
                  <p
                    className="pricing__text-8"
                  >
                    PIXDONE+
                  </p>
                  {/* 月払いでも場所を確保して、切り替えでトグルが動かないようにする */}
                  <span
                    className={`pricing__text-9${cycle === 'yearly' ? '' : ' pricing__reserve--hidden'}`}
                    aria-hidden={cycle !== 'yearly'}
                  >
                    {isJa ? '2ヶ月分お得' : '2 MO. FREE'}
                  </span>
                </div>
                <div
                  className="pricing__row-3"
                >
                  {(['monthly', 'yearly'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`pd-tap-area pricing__text-19${cycle === c ? ' pricing__text-19--cycle-c' : ''}`}
                      onClick={() => { playSound('buttonClick'); setCycle(c); }}
                    >
                      {c === 'monthly'
                        ? (isJa ? '月払い' : 'MONTHLY')
                        : (isJa ? '年払い' : 'YEARLY')}
                    </button>
                  ))}
                </div>
              </div>
              <p
                className="pricing__text-10"
              >
                {isNativeApp
                  ? (storePrice.main ?? '—')
                  : (cycle === 'monthly' ? '¥300' : '¥250')}<span className="pricing__text-11">{isJa ? '/月' : '/mo'}</span>
              </p>
              <p
                className={`pricing__text-12${cycle === 'yearly' ? '' : ' pricing__reserve--hidden'}`}
                aria-hidden={cycle !== 'yearly'}
              >
                {isNativeApp
                  ? (storePrice.yearly ? (isJa ? `年払い ${storePrice.yearly}` : `${storePrice.yearly} billed yearly`) : '')
                  : (isJa ? '年払い ¥3,000' : '¥3,000 billed yearly')}
              </p>
              <p className="pricing__text-13">
                {isJa
                  ? '7日間無料。その後自動で課金開始。いつでもキャンセル可能。'
                  : '7-day free trial, then auto-renews. Cancel anytime.'}
              </p>
              <ul className="pricing__col-4">
                {PLUS_FEATURES.map((f) => (
                  <li key={f.en} className="pricing__text-14">
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
            className="pricing__box-1"
          >
            {isTrialing ? (
              <span
                className="pricing__text-15"
              >
                {isJa ? '無料トライアル中' : 'FREE TRIAL ACTIVE'}
              </span>
            ) : (
              <p
                className="pricing__text-16"
              >
                {isJa ? '✓ PixDone+ 加入済み' : '✓ YOU ARE ON PIXDONE+'}
              </p>
            )}
            {isTrialing && trialEnd && (
              <p className="pricing__text-17">
                {isJa
                  ? `トライアル終了: ${new Date(trialEnd).toLocaleDateString('ja-JP')}`
                  : `Trial ends: ${new Date(trialEnd).toLocaleDateString('en-US')}`}
              </p>
            )}
            <p className="pricing__text-18">
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
