import { useEffect, useState } from 'react';
import { ModalDialog, BottomSheet, Button, IconButton, PixelIcon, TextField } from '../design-system';
import { LinkPendingError, useAuth } from '../contexts/AuthContext';
import { describeAuthError, describeLinkPending, isInAppBrowser, type AuthErrorAction } from '../lib/authErrors';
import { playSound } from '../services/sound';
import { Capacitor } from '@capacitor/core';
import './AuthModal.css';

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
  const { login, loginWithGoogle, loginWithApple, register, resetPassword, resendVerification } = useAuth();
  const [mode, setMode] = useState<'signup' | 'login' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorAction, setErrorAction] = useState<AuthErrorAction | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const clearError = () => {
    setError('');
    setErrorAction(null);
  };

  const showError = (err: unknown, provider = false) => {
    const view = describeAuthError(err, lang, { provider, inAppBrowser: provider && isInAppBrowser() });
    setError(view.message ?? '');
    setErrorAction(view.action ?? null);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    clearError();
    setSuccessMsg('');
    setShowPassword(false);
  };

  const switchMode = (m: 'signup' | 'login' | 'reset') => {
    setMode(m);
    resetForm();
  };

  // The modal stays mounted, so re-apply initialMode on every open
  // (otherwise "I already have an account" can reopen in the last mode used).
  useEffect(() => {
    if (open) switchMode(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMode]);

  const handleProviderSignIn = async (signIn: () => Promise<void>) => {
    clearError();
    setSuccessMsg('');
    setLoading(true);
    try {
      await signIn();
      playSound('taskComplete');
      (onLoginSuccess ?? onClose)();
    } catch (err: unknown) {
      if (err instanceof LinkPendingError) {
        // The email is registered another way: switch to the login form (email
        // prefilled) so they can sign in the old way; AuthContext links the new
        // provider right after.
        setMode('login');
        if (err.email && !err.email.endsWith('@privaterelay.appleid.com')) setEmail(err.email);
        setPassword('');
        setError(describeLinkPending(err.providerId, err.email, lang));
        setErrorAction(null);
      } else {
        showError(err, true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    clearError();
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await resendVerification(email, password);
      playSound('taskComplete');
      if (result === 'verified') {
        (onLoginSuccess ?? onClose)();
      } else {
        setSuccessMsg(lang === 'ja'
          ? '確認メールを再送しました。届いたメールのリンクを開いてから、ログインしてください。'
          : 'Verification email sent again. Open the link in it, then log in.');
      }
    } catch (err: unknown) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  /** "Email already in use" on sign-up → the login form, keeping the email. */
  const goToLoginKeepingEmail = () => {
    setMode('login');
    setPassword('');
    clearError();
    setSuccessMsg('');
  };

  const handleSubmit = async () => {
    clearError();
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
        // Firebase sends nothing (and says nothing) for unknown emails or
        // Google/Apple-only accounts, so the message has to cover both.
        setSuccessMsg(lang === 'ja'
          ? '登録済みのメールアドレスなら、パスワード再設定のメールを送りました。Google や Apple で登録したアカウントにはパスワードがないため、メールは届きません。そのボタンからログインしてください。'
          : 'If an account uses this email, we sent a reset link. Accounts created with Google or Apple have no password and get no email — use that button to log in.');
        setEmail('');
      }
    } catch (err: unknown) {
      showError(err);
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

  const actions = (
    <>
      <Button variant="secondary" soundKey="taskCancel" onClick={onClose} disabled={loading}>
        {lang === 'ja' ? 'キャンセル' : 'Cancel'}
      </Button>
      {/* Keep the label while loading (disabled is the cue). Swapping it for "..."
          shrank the button and slid Cancel sideways mid-transition; on iOS, with the
          native Apple sheet coming up, the old Cancel was left painted beside the new one. */}
      <Button variant="primary" onClick={handleSubmit} disabled={loading}>
        {primaryLabel}
      </Button>
    </>
  );

  const body = (
      <div className="auth-modal__col-1">
        {/* Google Sign-In — signup and login modes only (native apps use the
            native Google SDK via loginWithGoogle). */}
        {mode !== 'reset' && (
          <>
            {/* Sign in with Apple — every platform, so an account made with Apple in the
                iOS app (often a hidden @privaterelay email) can log in on the web and
                Android too. Required on iOS by App Store guideline 4.8. Monochrome per Apple HIG. */}
            <button
              type="button"
              onClick={() => { playSound('buttonClick'); handleProviderSignIn(loginWithApple); }}
              disabled={loading}
              className={`auth-modal__text-9${loading ? ' auth-modal__text-9--loading' : ''}`}
            >
              <svg width="16" height="18" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="currentColor" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
              </svg>
              {lang === 'ja' ? 'Appleで続ける' : 'Continue with Apple'}
            </button>
            <button
              type="button"
              onClick={() => { playSound('buttonClick'); handleProviderSignIn(loginWithGoogle); }}
              disabled={loading}
              className={`auth-modal__text-10${loading ? ' auth-modal__text-10--loading' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {lang === 'ja' ? 'Googleで続ける' : 'Continue with Google'}
            </button>

            <div className="auth-modal__row-1">
              <div className="auth-modal__box-1" />
              <span className="auth-modal__text-1">
                {lang === 'ja' ? 'またはメールで' : 'or with email'}
              </span>
              <div className="auth-modal__box-1" />
            </div>
          </>
        )}

        {/* Email */}
        <TextField
          id="auth-email-input"
          type="email"
          label={lang === 'ja' ? 'メールアドレス' : 'Email'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={lang === 'ja' ? 'example@email.com' : 'your.email@example.com'}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />

        {/* Password */}
        {mode !== 'reset' && (
          <TextField
            id="auth-password-input"
            type={showPassword ? 'text' : 'password'}
            label={lang === 'ja' ? 'パスワード' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={lang === 'ja' ? 'パスワード' : 'Password'}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            endAdornment={
              <IconButton
                variant="ghost"
                size="sm"
                aria-label={showPassword
                  ? (lang === 'ja' ? 'パスワードを隠す' : 'Hide password')
                  : (lang === 'ja' ? 'パスワードを表示' : 'Show password')}
                icon={<PixelIcon name={showPassword ? 'visibility_off' : 'visibility'} size="18px" />}
                onClick={() => setShowPassword((v) => !v)}
              />
            }
          />
        )}

        {/* Forgot password link */}
        {mode === 'login' && (
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); switchMode('reset'); }}
            className="auth-modal__text-3"
          >
            {lang === 'ja' ? 'パスワードを忘れた方' : 'Forgot password?'}
          </button>
        )}

        {/* Back to login link when in reset mode */}
        {mode === 'reset' && (
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); switchMode('login'); }}
            className="auth-modal__text-4"
          >
            <PixelIcon name="arrow_back" size="sm" />
            {lang === 'ja' ? 'ログインに戻る' : 'Back to login'}
          </button>
        )}

        {/* Footer: switch between signup / login (vanilla parity: auth-footer) */}
        {mode !== 'reset' && (
          <div className="auth-modal__text-5">
            {mode === 'signup' ? (
              <>
                <span>{lang === 'ja' ? 'すでにアカウントをお持ちですか？ ' : 'Already have an account? '}</span>
                <button
                  type="button"
                  onClick={() => { playSound('taskEdit'); switchMode('login'); }}
                  className="auth-modal__text-6"
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
                  className="auth-modal__text-6"
                >
                  {lang === 'ja' ? 'サインアップ' : 'Sign up'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="auth-modal__text-7">
            {error}
          </p>
        )}
        {error && errorAction === 'resend-verification' && (
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); handleResendVerification(); }}
            disabled={loading}
            className="auth-modal__text-3"
          >
            {lang === 'ja' ? '確認メールを再送する' : 'Send the verification email again'}
          </button>
        )}
        {error && errorAction === 'go-login' && (
          <button
            type="button"
            onClick={() => { playSound('taskEdit'); goToLoginKeepingEmail(); }}
            className="auth-modal__text-3"
          >
            {lang === 'ja' ? 'ログイン画面へ' : 'Go to log in'}
          </button>
        )}

        {/* Success */}
        {successMsg && (
          <p className="auth-modal__text-8">
            {successMsg}
          </p>
        )}
      </div>
  );

  // Native app: full-screen sheet (app-style sign-in screen). Web: centred dialog.
  if (Capacitor.isNativePlatform()) {
    return (
      <BottomSheet open={open} onClose={onClose} title={title}>
        {body}
        <div className="auth-modal__actions">{actions}</div>
      </BottomSheet>
    );
  }

  return (
    <ModalDialog open={open} onClose={onClose} title={title} actions={actions}>
      {body}
    </ModalDialog>
  );
}
