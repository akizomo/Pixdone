import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import { playSound } from '../services/sound';
import { Button } from '../design-system';
import { SubPageHeader } from '../components/SubPageHeader';
import { detectDefaultLang, type Lang } from '../lib/i18n';
import { apiUrl } from '../lib/apiUrl';
import { getStoreManagementUrl } from '../lib/storeBilling';
import './AccountPage.css';

function formatDate(iso: string | null, lang: Lang): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, deleteAccount } = useAuth();
  const { plan, billingCycle, currentPeriodEnd, provider } = useThemeEntitlements();
  const isStoreSubscription = provider === 'app_store' || provider === 'play_store';
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelledUntil, setCancelledUntil] = useState<string | null>(null);
  const lang: Lang = detectDefaultLang();
  const isJa = lang === 'ja';
  const isPlusUser = plan === 'plus';

  // Store subscriptions can only be changed or cancelled in the store itself.
  const handleManageInStore = async () => {
    window.location.href = await getStoreManagementUrl();
  };

  // Permanently deletes the account and all data (store requirement: in-app account deletion).
  const handleDeleteAccount = async () => {
    const storeNote = isStoreSubscription
      ? (isJa
        ? '\n\n※ App Store / Google Play の契約は、この操作では解約されません。先にストアで解約してください。'
        : '\n\nNote: your App Store / Google Play subscription is NOT cancelled by this. Cancel it in the store first.')
      : (isPlusUser
        ? (isJa ? '\n\nPixDone+ の契約は同時に解約されます（返金はありません）。' : '\n\nYour PixDone+ subscription will be cancelled immediately (no refund).')
        : '');
    const first = window.confirm(
      (isJa
        ? 'アカウントを削除しますか？タスク・リスト・進捗など、すべてのデータが完全に削除され、元に戻せません。'
        : 'Delete your account? All tasks, lists and progress will be permanently deleted. This cannot be undone.') + storeNote,
    );
    if (!first) return;
    const second = window.confirm(isJa ? '本当に削除しますか？' : 'Are you absolutely sure?');
    if (!second) return;
    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/');
    } catch (e) {
      window.alert(e instanceof Error && e.message
        ? e.message
        : (isJa ? 'アカウントの削除に失敗しました。もう一度お試しください。' : 'Failed to delete account. Please try again.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = window.confirm(
      isJa
        ? 'PixDone+ をキャンセルしますか？期間終了まではご利用いただけます。'
        : 'Cancel PixDone+? You will keep access until the end of the current period.',
    );
    if (!confirmed) return;
    setCancelling(true);
    playSound('taskCancel');
    try {
      const resp = await fetch(apiUrl('/api/billing/cancel'), {
        method: 'POST',
        credentials: 'include',
      });
      if (!resp.ok) {
        let msg = isJa ? 'キャンセルに失敗しました。' : 'Failed to cancel subscription.';
        try {
          const err = (await resp.json()) as { message?: string };
          if (err.message) msg = err.message;
        } catch { /* ignore */ }
        window.alert(msg);
        return;
      }
      const data = (await resp.json()) as { cancelAt?: string };
      setCancelledUntil(data.cancelAt ?? currentPeriodEnd);
      playSound('taskComplete');
    } catch {
      window.alert(isJa ? '通信に失敗しました。' : 'Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <SubPageHeader title={isJa ? 'アカウント' : 'ACCOUNT'} isJa={isJa} onBack={() => navigate('/')} />

      <div
        style={{
          flex: 1,
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Profile */}
        {user && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p
              style={{
                fontFamily: 'var(--pd-font-brand)',
                fontSize: 'var(--pd-font-size-sm)',
                letterSpacing: '1px',
                color: 'var(--pd-color-text-muted)',
                margin: 0,
              }}
            >
              {isJa ? 'ログイン中' : 'SIGNED IN AS'}
            </p>
            <p style={{ margin: 0, fontSize: 'var(--pd-font-size-sm)', color: 'var(--pd-color-text-primary)' }}>
              {user.email ?? user.displayName ?? user.uid}
            </p>
          </section>
        )}

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--pd-color-border-default)' }} />

        {/* Subscription */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p
            style={{
              fontFamily: 'var(--pd-font-brand)',
              fontSize: 'var(--pd-font-size-sm)',
              letterSpacing: '1px',
              color: 'var(--pd-color-text-muted)',
              margin: 0,
            }}
          >
            {isJa ? 'サブスクリプション' : 'SUBSCRIPTION'}
          </p>

          {!isPlusUser && (
            <div
              style={{
                border: '2px solid var(--pd-color-border-default)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div>
                <p style={{ fontFamily: 'var(--pd-font-brand)', fontSize: 'var(--pd-font-size-sm)', letterSpacing: '1px', margin: '0 0 4px' }}>
                  FREE
                </p>
                <p style={{ fontSize: 'var(--pd-font-size-xs)', color: 'var(--pd-color-text-secondary)', margin: 0 }}>
                  {isJa ? 'リスト 3 件まで・スタンダード機能' : 'Up to 3 lists · Standard features'}
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate('/pricing')}>
                {isJa ? 'アップグレード' : 'UPGRADE'}
              </Button>
            </div>
          )}

          {isPlusUser && (
            <div
              style={{
                border: '2px solid var(--pd-color-accent-default)',
                padding: '16px',
                background: 'var(--pd-color-accent-subtle)',
              }}
            >
              <p style={{ fontFamily: 'var(--pd-font-brand)', fontSize: 'var(--pd-font-size-sm)', letterSpacing: '1px', margin: '0 0 4px', color: 'var(--pd-color-accent-default)' }}>
                PIXDONE+
              </p>
              {billingCycle && (
                <p style={{ fontSize: 'var(--pd-font-size-xs)', color: 'var(--pd-color-text-secondary)', margin: '0 0 4px' }}>
                  {isStoreSubscription
                    ? (billingCycle === 'monthly' ? (isJa ? '月払い' : 'Monthly') : (isJa ? '年払い' : 'Yearly'))
                    : billingCycle === 'monthly'
                      ? (isJa ? '月払い · ¥300/月' : 'Monthly · ¥300/mo')
                      : (isJa ? '年払い · ¥3,000/年' : 'Yearly · ¥3,000/yr')}
                </p>
              )}
              {cancelledUntil ? (
                <p style={{ fontSize: 'var(--pd-font-size-xs)', color: 'var(--pd-color-text-secondary)', margin: '0 0 16px' }}>
                  {isJa
                    ? `${formatDate(cancelledUntil, lang)} まで有効`
                    : `Active until ${formatDate(cancelledUntil, lang)}`}
                </p>
              ) : currentPeriodEnd ? (
                <p style={{ fontSize: 'var(--pd-font-size-xs)', color: 'var(--pd-color-text-secondary)', margin: '0 0 16px' }}>
                  {isJa
                    ? `次回更新: ${formatDate(currentPeriodEnd, lang)}`
                    : `Renews ${formatDate(currentPeriodEnd, lang)}`}
                </p>
              ) : (
                <div style={{ marginBottom: '16px' }} />
              )}

              {isStoreSubscription ? (
                <Button variant="secondary" size="sm" soundKey="buttonClick" onClick={handleManageInStore}>
                  {provider === 'app_store'
                    ? (isJa ? 'App Store でプランを管理' : 'MANAGE IN APP STORE')
                    : (isJa ? 'Google Play でプランを管理' : 'MANAGE IN GOOGLE PLAY')}
                </Button>
              ) : !cancelledUntil && (
                <Button variant="secondary" size="sm" soundKey="taskDelete" loading={cancelling} onClick={handleCancel}>
                  {isJa ? 'プランをキャンセル' : 'CANCEL PLAN'}
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--pd-color-border-default)' }} />

        {/* Sign out */}
        {user && (
          <Button variant="secondary" size="sm" soundKey="taskCancel" onClick={() => { logout(); navigate('/'); }}>
            {isJa ? 'ログアウト' : 'SIGN OUT'}
          </Button>
        )}

        {/* Delete account */}
        {user && (
          <section className="account-danger">
            <p className="account-danger__note">
              {isJa
                ? 'アカウントとすべてのデータを完全に削除します。元に戻せません。'
                : 'Permanently deletes your account and all data. This cannot be undone.'}
            </p>
            <Button variant="dangerGhost" size="sm" soundKey="taskDelete" loading={deleting} onClick={handleDeleteAccount}>
              {isJa ? 'アカウントを削除' : 'DELETE ACCOUNT'}
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
