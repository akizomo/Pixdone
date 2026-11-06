import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoBack } from '../hooks/useGoBack';
import { useAuth } from '../contexts/AuthContext';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import { playSound } from '../services/sound';
import { Button, Chip, ListRow, ModalDialog, Toggle, useToast } from '../design-system';
import type { ThemeKey } from '../design-system';
import { AgentIcon } from '../components/AgentIcon';
import { SubPageHeader } from '../components/SubPageHeader';
import type { Lang } from '../lib/i18n';
import { apiUrl } from '../lib/apiUrl';
import { getStoreManagementUrl } from '../lib/storeBilling';
import { pricingPath } from '../services/analytics';
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

export interface AccountPageProps {
  lang: Lang;
  onChangeLang: (lang: Lang) => void;
  soundOn: boolean;
  /** Called by the Sound toggle (the Toggle plays its own sound). */
  onSoundChange: (on: boolean) => void;
  onOpenCollection: () => void;
  /** Theme for the agent avatar. */
  themeKey: ThemeKey;
}

const SUPPORT_URL = 'https://buymeacoffee.com/akizomo';

/**
 * Account hub: profile & plan, collection, settings, support, legal, sign out
 * and account deletion. On mobile the header avatar opens this page; desktop
 * keeps its avatar popover and reaches this page via "Manage".
 */
export function AccountPage({ lang, onChangeLang, soundOn, onSoundChange, onOpenCollection, themeKey }: AccountPageProps) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user, logout, deleteAccount } = useAuth();
  const { plan, billingCycle, currentPeriodEnd, provider } = useThemeEntitlements();
  const isStoreSubscription = provider === 'app_store' || provider === 'play_store';
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelledUntil, setCancelledUntil] = useState<string | null>(null);
  /** Which destructive action is awaiting confirmation. */
  const [confirming, setConfirming] = useState<'delete' | 'cancel' | null>(null);
  const { showToast } = useToast();
  const isJa = lang === 'ja';
  const isPlusUser = plan === 'plus';

  // Store subscriptions can only be changed or cancelled in the store itself.
  const handleManageInStore = async () => {
    window.location.href = await getStoreManagementUrl();
  };

  // Shown in the delete confirmation: what happens to an active subscription.
  const deleteSubscriptionNote = isStoreSubscription
    ? (isJa
      ? '※ App Store / Google Play の契約は、この操作では解約されません。先にストアで解約してください。'
      : 'Note: your App Store / Google Play subscription is NOT cancelled by this. Cancel it in the store first.')
    : (isPlusUser
      ? (isJa ? 'PixDone+ の契約は同時に解約されます（返金はありません）。' : 'Your PixDone+ subscription will be cancelled immediately (no refund).')
      : null);

  // Permanently deletes the account and all data (store requirement: in-app account deletion).
  const handleDeleteAccount = async () => {
    setConfirming(null);
    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/', { replace: true });
    } catch (e) {
      showToast({
        message: e instanceof Error && e.message
          ? e.message
          : (isJa ? 'アカウントの削除に失敗しました。もう一度お試しください。' : 'Failed to delete account. Please try again.'),
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = async () => {
    setConfirming(null);
    setCancelling(true);
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
        showToast({ message: msg });
        return;
      }
      const data = (await resp.json()) as { cancelAt?: string };
      setCancelledUntil(data.cancelAt ?? currentPeriodEnd);
      playSound('taskComplete');
    } catch {
      showToast({ message: isJa ? '通信に失敗しました。' : 'Network error. Please try again.' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="account-page" data-pd-screen>
      <SubPageHeader title={isJa ? 'アカウント' : 'ACCOUNT'} isJa={isJa} onBack={goBack} />

      <div className="account-body">
        {/* Profile */}
        {user && (
          <section className="account-profile">
            <AgentIcon themeKey={themeKey} isPremium={isPlusUser} size={48} faceOnly />
            <div className="account-profile__text">
              <p className="account-label">
                {isJa ? 'ログイン中' : 'SIGNED IN AS'}
              </p>
              <p className="account-value">
                {user.email ?? user.displayName ?? user.uid}
              </p>
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="account-divider" />

        {/* Subscription */}
        <section className="account-section">
          <p className="account-label">
            {isJa ? 'サブスクリプション' : 'SUBSCRIPTION'}
          </p>

          {!isPlusUser && (
            <div className="account-plan account-plan--free">
              <div>
                <p className="account-plan__name">
                  FREE
                </p>
                <p className="account-plan__desc">
                  {isJa ? 'リスト 3 件まで・スタンダード機能' : 'Up to 3 lists · Standard features'}
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate(pricingPath('account'))}>
                {isJa ? 'アップグレード' : 'UPGRADE'}
              </Button>
            </div>
          )}

          {isPlusUser && (
            <div className="account-plan">
              <p className="account-plan__name">
                PIXDONE+
              </p>
              {billingCycle && (
                <p className="account-plan__meta">
                  {isStoreSubscription
                    ? (billingCycle === 'monthly' ? (isJa ? '月払い' : 'Monthly') : (isJa ? '年払い' : 'Yearly'))
                    : billingCycle === 'monthly'
                      ? (isJa ? '月払い · ¥300/月' : 'Monthly · ¥300/mo')
                      : (isJa ? '年払い · ¥3,000/年' : 'Yearly · ¥3,000/yr')}
                </p>
              )}
              {cancelledUntil ? (
                <p className="account-plan__meta account-plan__meta--end">
                  {isJa
                    ? `${formatDate(cancelledUntil, lang)} まで有効`
                    : `Active until ${formatDate(cancelledUntil, lang)}`}
                </p>
              ) : currentPeriodEnd ? (
                <p className="account-plan__meta account-plan__meta--end">
                  {isJa
                    ? `次回更新: ${formatDate(currentPeriodEnd, lang)}`
                    : `Renews ${formatDate(currentPeriodEnd, lang)}`}
                </p>
              ) : (
                <div className="account-plan__spacer" />
              )}

              {isStoreSubscription ? (
                <Button variant="secondary" size="sm" soundKey="buttonClick" onClick={handleManageInStore}>
                  {provider === 'app_store'
                    ? (isJa ? 'App Store でプランを管理' : 'MANAGE IN APP STORE')
                    : (isJa ? 'Google Play でプランを管理' : 'MANAGE IN GOOGLE PLAY')}
                </Button>
              ) : !cancelledUntil && (
                <Button variant="text" size="sm" loading={cancelling} onClick={() => setConfirming('cancel')}>
                  {isJa ? 'プランをキャンセル' : 'CANCEL PLAN'}
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Collection */}
        <section className="account-section">
          <p className="account-label">{isJa ? 'コレクション' : 'COLLECTION'}</p>
          <div className="account-list">
            <ListRow icon="auto_awesome" label={isJa ? 'エフェクト / テーマ' : 'Effects / Themes'} onClick={onOpenCollection} />
          </div>
        </section>

        {/* Settings */}
        <section className="account-section">
          <p className="account-label">{isJa ? '設定' : 'SETTINGS'}</p>
          <div className="account-list">
            <ListRow
              icon="language"
              label={isJa ? '言語' : 'Language'}
              trailing={(
                <>
                  <Chip variant="ghost" size="sm" selected={lang === 'en'} onClick={() => onChangeLang('en')}>En</Chip>
                  <Chip variant="ghost" size="sm" selected={lang === 'ja'} onClick={() => onChangeLang('ja')}>Ja</Chip>
                </>
              )}
            />
            <ListRow
              icon={soundOn ? 'volume_up' : 'volume_off'}
              label={isJa ? 'サウンド' : 'Sound'}
              trailing={<Toggle label={isJa ? 'サウンド' : 'Sound'} checked={soundOn} onChange={onSoundChange} />}
            />
          </div>
        </section>

        {/* Support */}
        <section className="account-section">
          <p className="account-label">{isJa ? 'サポート' : 'SUPPORT'}</p>
          <div className="account-list">
            <ListRow icon="chat_bubble_outline" label={isJa ? 'フィードバック' : 'Feedback'} onClick={() => navigate('/feedback')} />
            <ListRow icon="favorite" label="Support PixDone" href={SUPPORT_URL} />
          </div>
        </section>

        {/* Legal */}
        <section className="account-section">
          <p className="account-label">{isJa ? '規約' : 'LEGAL'}</p>
          <div className="account-list">
            <ListRow label={isJa ? 'プライバシーポリシー' : 'Privacy Policy'} href="/privacy.html" />
            <ListRow label={isJa ? '利用規約' : 'Terms of Service'} href="/terms.html" />
            <ListRow label={isJa ? '特定商取引法に基づく表記' : 'Commerce Disclosure'} href="/tokushoho.html" />
          </div>
        </section>

        {/* Divider */}
        <div className="account-divider" />

        {/* Sign out */}
        {user && (
          <Button variant="secondary" size="sm" soundKey="taskCancel" onClick={() => { logout(); navigate('/', { replace: true }); }}>
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
            <Button variant="dangerGhost" size="sm" loading={deleting} onClick={() => setConfirming('delete')}>
              {isJa ? 'アカウントを削除' : 'DELETE ACCOUNT'}
            </Button>
          </section>
        )}

        <ModalDialog
          open={confirming === 'cancel'}
          onClose={() => setConfirming(null)}
          title={isJa ? 'PixDone+ をキャンセル' : 'Cancel PixDone+'}
          actions={
            <>
              <Button variant="secondary" soundKey="taskCancel" onClick={() => setConfirming(null)}>
                {isJa ? '続ける' : 'KEEP'}
              </Button>
              <Button variant="danger" soundKey="taskDelete" onClick={handleCancel}>
                {isJa ? 'キャンセルする' : 'CANCEL PLAN'}
              </Button>
            </>
          }
        >
          <p className="account-dialog__text">
            {isJa
              ? '期間終了まではご利用いただけます。'
              : 'You will keep access until the end of the current period.'}
          </p>
        </ModalDialog>

        <ModalDialog
          open={confirming === 'delete'}
          onClose={() => setConfirming(null)}
          title={isJa ? 'アカウントを削除' : 'Delete account'}
          actions={
            <>
              <Button variant="secondary" soundKey="taskCancel" onClick={() => setConfirming(null)}>
                {isJa ? 'キャンセル' : 'CANCEL'}
              </Button>
              <Button variant="danger" soundKey="taskDelete" onClick={handleDeleteAccount}>
                {isJa ? '削除する' : 'DELETE'}
              </Button>
            </>
          }
        >
          <p className="account-dialog__text">
            {isJa
              ? 'タスク・リスト・進捗など、すべてのデータが完全に削除され、元に戻せません。'
              : 'All tasks, lists and progress will be permanently deleted. This cannot be undone.'}
          </p>
          {deleteSubscriptionNote && (
            <p className="account-dialog__text account-dialog__text--note">{deleteSubscriptionNote}</p>
          )}
        </ModalDialog>

        <p className="account-credit">
          <a href="https://akizony.com" target="_blank" rel="noopener noreferrer">Made by Akihiro Uezono</a>
        </p>
      </div>
    </div>
  );
}
