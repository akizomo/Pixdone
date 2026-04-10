import { useState } from 'react';
import { ModalDialog, Button } from '../design-system';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../services/sound';

const ERROR_MESSAGES: Record<string, { en: string; ja: string }> = {
  'auth/invalid-email': { en: 'Invalid email address.', ja: 'メールアドレスが無効です。' },
  'auth/user-not-found': { en: 'No account found with this email.', ja: 'このメールのアカウントが見つかりません。' },
  'auth/wrong-password': { en: 'Incorrect password.', ja: 'パスワードが正しくありません。' },
  'auth/email-already-in-use': { en: 'Email already in use.', ja: 'このメールは既に使用されています。' },
  'auth/weak-password': { en: 'Password must be at least 6 characters.', ja: 'パスワードは6文字以上にしてください。' },
  'auth/too-many-requests': { en: 'Too many attempts. Please try again later.', ja: 'しばらく経ってから再試行してください。' },
  'email_not_verified': { en: 'Please verify your email before logging in.', ja: 'ログイン前にメールを確認してください。' },
  'auth/requires-recent-login': { en: 'Please log out and log in again to delete your account.', ja: '再ログインしてからアカウントを削除してください。' },
  'auth/invalid-credential': { en: 'Invalid email or password.', ja: 'メールまたはパスワードが正しくありません。' },
  'auth/account-exists-with-different-credential': { en: 'An account with this email already exists. Please log in with your email and password.', ja: 'このメールアドレスはすでに登録されています。メールとパスワードでログインしてください。' },
};

function getErrorMessage(code: string, lang: 'en' | 'ja'): string {
  const entry = ERROR_MESSAGES[code];
  if (entry) return entry[lang];
  return lang === 'ja' ? 'エラーが発生しました。' : 'An error occurred.';
}

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after successful email login (no cancel sound from parent). */
  onLoginSuccess?: () => void;
  lang: 'en' | 'ja';
  initialMode?: 'signup' | 'login';
  onSignupSuccess?: () => void;
}

export function AuthModal({ open, onClose, onLoginSuccess, lang, initialMode = 'signup', onSignupSuccess }: AuthModalProps) {
  const { login, loginWithGoogle, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signup' | 'login' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const switchMode = (m: 'signup' | 'login' | 'reset') => {
    setMode(m);
    resetForm();
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      playSound('taskComplete');
      (onLoginSuccess ?? onClose)();
    } catch (err: unknown) {
      const code = (err as { code?: string; message?: string })?.code ?? (err as { message?: string })?.message ?? 'unknown';
      // popup closed by user — silently ignore
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError(getErrorMessage(code, lang));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        playSound('taskComplete');
        (onLoginSuccess ?? onClose)();
      } else if (mode === 'signup') {
        await register(email, password);
        playSound('taskComplete');
        setSuccessMsg(lang === 'ja' ? 'メール確認リンクを送信しました。メールをご確認ください。' : 'Verification email sent. Please check your inbox.');
        setEmail('');
        setPassword('');
        onSignupSuccess?.();
      } else if (mode === 'reset') {
        await resetPassword(email);
        playSound('taskComplete');
        setSuccessMsg(lang === 'ja' ? 'リセットメールを送信しました。' : 'Password reset email sent.');
        setEmail('');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string; message?: string })?.code ?? (err as { message?: string })?.message ?? 'unknown';
      setError(getErrorMessage(code, lang));
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'reset'
    ? (lang === 'ja' ? 'パスワードリセット' : 'Reset password')
    : mode === 'login'
    ? (lang === 'ja' ? 'ログイン' : 'Log in')
    : (lang === 'ja' ? 'サインアップ' : 'Sign up');

  const primaryLabel =
    mode === 'reset'
      ? (lang === 'ja' ? 'パスワードリセット' : 'Reset password')
      : mode === 'login'
      ? (lang === 'ja' ? 'ログイン' : 'Log in')
      : (lang === 'ja' ? 'サインアップ' : 'Sign up');

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="secondary" soundKey="taskCancel" onClick={onClose} disabled={loading}>
            {lang === 'ja' ? 'キャンセル' : 'Cancel'}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '...' : primaryLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Google Sign-In — signup and login modes only */}
        {mode !== 'reset' && (
          <>
            <button
              type="button"
              onClick={() => { playSound('buttonClick'); handleGoogleSignIn(); }}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', padding: '10px 16px',
                background: 'var(--pd-color-background-elevated)',
                border: '1px solid var(--pd-color-text-primary)',
                borderRadius: 'var(--pd-radius-md, 8px)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem',
                color: 'var(--pd-color-text-primary)',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {lang === 'ja' ? 'Googleで続ける' : 'Continue with Google'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--pd-color-border-default, #e5e7eb)' }} />
              <span style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.75rem', color: 'var(--pd-color-text-muted)' }}>
                {lang === 'ja' ? 'またはメールで' : 'or with email'}
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--pd-color-border-default, #e5e7eb)' }} />
            </div>
          </>
        )}

        {/* Email */}
        <div className="pxd-text-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            htmlFor="auth-email-input"
            style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)' }}
          >
            {lang === 'ja' ? 'メールアドレス' : 'Email'}
          </label>
          <input
            id="auth-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={lang === 'ja' ? 'example@email.com' : 'your.email@example.com'}
            className="pxd-text-field__input"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {/* Password */}
        {mode !== 'reset' && (
          <div className="pxd-text-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              htmlFor="auth-password-input"
              style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)' }}
            >
              {lang === 'ja' ? 'パスワード' : 'Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={lang === 'ja' ? 'パスワード' : 'Password'}
                className="pxd-text-field__input"
                style={{ paddingRight: '36px' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => { playSound('buttonClick'); setShowPassword((v) => !v); }}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--pd-color-text-muted)', display: 'flex', alignItems: 'center',
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Forgot password link */}
        {mode === 'login' && (
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); switchMode('reset'); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--pd-color-accent-default)',
              fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
              textAlign: 'left', padding: 0,
            }}
          >
            {lang === 'ja' ? 'パスワードを忘れた方' : 'Forgot password?'}
          </button>
        )}

        {/* Back to login link when in reset mode */}
        {mode === 'reset' && (
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); switchMode('login'); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--pd-color-text-secondary)',
              fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
              textAlign: 'left', padding: 0,
            }}
          >
            {lang === 'ja' ? '← ログインに戻る' : '← Back to login'}
          </button>
        )}

        {/* Footer: switch between signup / login (vanilla parity: auth-footer) */}
        {mode !== 'reset' && (
          <div style={{ marginTop: '4px', fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)' }}>
            {mode === 'signup' ? (
              <>
                <span>{lang === 'ja' ? 'すでにアカウントをお持ちですか？ ' : 'Already have an account? '}</span>
                <button
                  type="button"
                  onClick={() => { playSound('taskEdit'); switchMode('login'); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--pd-color-accent-default)', padding: 0,
                    fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
                  }}
                >
                  {lang === 'ja' ? 'ログイン' : 'Log in'}
                </button>
              </>
            ) : (
              <>
                <span>{lang === 'ja' ? 'アカウントがない？ ' : "Don't have an account? "}</span>
                <button
                  type="button"
                  onClick={() => { playSound('taskEdit'); switchMode('signup'); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--pd-color-accent-default)', padding: 0,
                    fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
                  }}
                >
                  {lang === 'ja' ? 'サインアップ' : 'Sign up'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: 'var(--pd-color-semantic-danger, #ef4444)', fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', margin: 0 }}>
            {error}
          </p>
        )}

        {/* Success */}
        {successMsg && (
          <p style={{ color: 'var(--pd-color-accent-default)', fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', margin: 0 }}>
            {successMsg}
          </p>
        )}
      </div>
    </ModalDialog>
  );
}
