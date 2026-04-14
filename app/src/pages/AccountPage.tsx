import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import { playSound } from '../services/sound';
import { Button } from '../design-system';
import { detectDefaultLang, type Lang } from '../lib/i18n';

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
  const { user, logout } = useAuth();
  const { plan, billingCycle, currentPeriodEnd } = useThemeEntitlements();
  const [cancelling, setCancelling] = useState(false);
  const [cancelledUntil, setCancelledUntil] = useState<string | null>(null);
  const lang: Lang = detectDefaultLang();
  const isJa = lang === 'ja';
  const isPlusUser = plan === 'plus';

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
      const resp = await fetch('/api/billing/cancel', {
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
          {isJa ? 'アカウント' : 'ACCOUNT'}
        </span>
      </div>

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
                fontSize: '0.625rem',
                letterSpacing: '1px',
                color: 'var(--pd-color-text-muted)',
                margin: 0,
              }}
            >
              {isJa ? 'ログイン中' : 'SIGNED IN AS'}
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--pd-color-text-primary)' }}>
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
              fontSize: '0.625rem',
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
                <p style={{ fontFamily: 'var(--pd-font-brand)', fontSize: '0.75rem', letterSpacing: '1px', margin: '0 0 4px' }}>
                  FREE
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)', margin: 0 }}>
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
              <p style={{ fontFamily: 'var(--pd-font-brand)', fontSize: '0.75rem', letterSpacing: '1px', margin: '0 0 4px', color: 'var(--pd-color-accent-default)' }}>
                PIXDONE+
              </p>
              {billingCycle && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)', margin: '0 0 4px' }}>
                  {billingCycle === 'monthly'
                    ? (isJa ? '月払い · ¥600/月' : 'Monthly · ¥600/mo')
                    : (isJa ? '年払い · ¥6,000/年' : 'Yearly · ¥6,000/yr')}
                </p>
              )}
              {cancelledUntil ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)', margin: '0 0 16px' }}>
                  {isJa
                    ? `${formatDate(cancelledUntil, lang)} まで有効`
                    : `Active until ${formatDate(cancelledUntil, lang)}`}
                </p>
              ) : currentPeriodEnd ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)', margin: '0 0 16px' }}>
                  {isJa
                    ? `次回更新: ${formatDate(currentPeriodEnd, lang)}`
                    : `Renews ${formatDate(currentPeriodEnd, lang)}`}
                </p>
              ) : (
                <div style={{ marginBottom: '16px' }} />
              )}

              {!cancelledUntil && (
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
      </div>
    </div>
  );
}
