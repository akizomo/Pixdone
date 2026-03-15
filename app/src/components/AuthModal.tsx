import { useState } from 'react';
import { ModalDialog, Button, Chip } from '../design-system';
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
};

function getErrorMessage(code: string, lang: 'en' | 'ja'): string {
  const entry = ERROR_MESSAGES[code];
  if (entry) return entry[lang];
  return lang === 'ja' ? 'エラーが発生しました。' : 'An error occurred.';
}

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  lang: 'en' | 'ja';
  initialMode?: 'signup' | 'login';
}

export function AuthModal({ open, onClose, lang, initialMode = 'signup' }: AuthModalProps) {
  const { login, register, resetPassword } = useAuth();
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

  const handleSubmit = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        playSound('taskComplete');
        onClose();
      } else if (mode === 'signup') {
        await register(email, password);
        playSound('taskComplete');
        setSuccessMsg(lang === 'ja' ? 'メール確認リンクを送信しました。メールをご確認ください。' : 'Verification email sent. Please check your inbox.');
        setEmail('');
        setPassword('');
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--pd-color-background-default)',
    border: '2px solid var(--pd-color-border-default)',
    borderRadius: 0,
    color: 'var(--pd-color-text-primary)',
    fontFamily: 'var(--pd-font-body)',
    fontSize: '0.875rem',
    padding: '8px 12px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {lang === 'ja' ? 'キャンセル' : 'Cancel'}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '...' : title}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Mode toggle chips (signup / login) */}
        {mode !== 'reset' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Chip selected={mode === 'signup'} onClick={() => { playSound('buttonClick'); switchMode('signup'); }}>
              {lang === 'ja' ? 'サインアップ' : 'Sign Up'}
            </Chip>
            <Chip selected={mode === 'login'} onClick={() => { playSound('buttonClick'); switchMode('login'); }}>
              {lang === 'ja' ? 'ログイン' : 'Log In'}
            </Chip>
          </div>
        )}

        {/* Email */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={inputStyle}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />

        {/* Password */}
        {mode !== 'reset' && (
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={lang === 'ja' ? 'パスワード' : 'Password'}
              style={{ ...inputStyle, paddingRight: '40px' }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
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
