/**
 * Maps Firebase Auth / sign-in errors to what the sign-in screen shows.
 *
 * Email enumeration protection is on, so Firebase never says *which* method an
 * email was registered with: a Google/Apple-only account and a wrong password
 * both come back as `auth/invalid-credential`. Messages therefore always point
 * at the other sign-in buttons instead of guessing.
 */

export type AuthLang = 'en' | 'ja';

/** A follow-up the screen offers next to the message. */
export type AuthErrorAction = 'resend-verification' | 'go-login';

export interface AuthErrorView {
  /** null = show nothing (the user dismissed the sign-in themself). */
  message: string | null;
  action?: AuthErrorAction;
}

type Msg = { en: string; ja: string };

const PROVIDER_HINT: Msg = {
  en: 'If you signed up with Google or Apple, use that button instead.',
  ja: 'Google や Apple で登録した場合は、そのボタンからログインしてください。',
};

const TRY_AGAIN: Msg = {
  en: 'Could not sign in. Please try again.',
  ja: 'ログインできませんでした。もう一度お試しください。',
};

const MESSAGES: Record<string, Msg> = {
  // ── Input ────────────────────────────────────────────
  missing_email: { en: 'Enter your email address.', ja: 'メールアドレスを入力してください。' },
  missing_password: { en: 'Enter your password.', ja: 'パスワードを入力してください。' },
  'auth/missing-email': { en: 'Enter your email address.', ja: 'メールアドレスを入力してください。' },
  'auth/missing-password': { en: 'Enter your password.', ja: 'パスワードを入力してください。' },
  'auth/invalid-email': { en: 'That email address is not valid.', ja: 'メールアドレスの形式が正しくありません。' },
  'auth/weak-password': { en: 'Use at least 6 characters for your password.', ja: 'パスワードは6文字以上にしてください。' },
  'auth/password-does-not-meet-requirements': {
    en: 'That password does not meet the requirements. Try a longer one.',
    ja: 'パスワードが条件を満たしていません。もっと長いものにしてください。',
  },

  // ── Email login ──────────────────────────────────────
  'auth/invalid-credential': {
    en: `Wrong email or password. ${PROVIDER_HINT.en}`,
    ja: `メールアドレスまたはパスワードが正しくありません。${PROVIDER_HINT.ja}`,
  },
  'auth/wrong-password': {
    en: `Wrong email or password. ${PROVIDER_HINT.en}`,
    ja: `メールアドレスまたはパスワードが正しくありません。${PROVIDER_HINT.ja}`,
  },
  'auth/user-not-found': {
    en: `No account uses this email. ${PROVIDER_HINT.en}`,
    ja: `このメールアドレスのアカウントが見つかりません。${PROVIDER_HINT.ja}`,
  },
  email_not_verified: {
    en: 'Confirm your email first. Open the link in the email we sent you.',
    ja: 'メールアドレスの確認が済んでいません。届いたメールのリンクを開いてください。',
  },

  // ── Sign up ──────────────────────────────────────────
  'auth/email-already-in-use': {
    en: `This email already has an account. Log in instead. ${PROVIDER_HINT.en}`,
    ja: `このメールアドレスは登録済みです。ログインしてください。${PROVIDER_HINT.ja}`,
  },

  // ── Google / Apple ───────────────────────────────────
  'auth/popup-blocked': {
    en: 'The sign-in window was blocked. Allow pop-ups for this site and try again.',
    ja: 'ログイン画面がブロックされました。このサイトのポップアップを許可して、もう一度お試しください。',
  },
  'auth/operation-not-allowed': {
    en: 'This sign-in method is not available right now. Try another one.',
    ja: 'この方法では現在ログインできません。別の方法でお試しください。',
  },
  'auth/unauthorized-domain': {
    en: 'This sign-in method is not available on this page. Try another one.',
    ja: 'このページではこの方法でログインできません。別の方法でお試しください。',
  },
  'auth/web-storage-unsupported': {
    en: 'This browser blocks sign-in. Open the page in Safari or Chrome.',
    ja: 'このブラウザではログインできません。Safari や Chrome で開いてください。',
  },
  google_sign_in_failed: TRY_AGAIN,
  apple_sign_in_failed: TRY_AGAIN,

  // ── Account state ────────────────────────────────────
  'auth/user-disabled': {
    en: 'This account has been disabled. Please contact support.',
    ja: 'このアカウントは無効になっています。サポートにお問い合わせください。',
  },
  'auth/requires-recent-login': {
    en: 'Please log out and log in again, then try once more.',
    ja: '一度ログアウトしてログインし直してから、もう一度お試しください。',
  },

  // ── Transport ────────────────────────────────────────
  'auth/network-request-failed': {
    en: 'Could not connect. Check your connection and try again.',
    ja: '通信できませんでした。接続を確認して、もう一度お試しください。',
  },
  'auth/too-many-requests': {
    en: 'Too many attempts. Wait a while and try again.',
    ja: '試行回数が多すぎます。しばらく待ってから、もう一度お試しください。',
  },
  'auth/timeout': TRY_AGAIN,
  'auth/internal-error': TRY_AGAIN,
};

/** The user closed the Google/Apple window — not an error. */
const SILENT = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);

/** In-app browsers (LINE, Instagram, Facebook…) where Google refuses OAuth. */
export function isInAppBrowser(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): boolean {
  return /\bLine\/|Instagram|FBAN|FBAV|FB_IAB|Twitter|MicroMessenger/i.test(ua);
}

const IN_APP_HINT: Msg = {
  en: 'Sign-in may not work inside this app. Open the page in Safari or Chrome.',
  ja: 'アプリ内のブラウザではログインできないことがあります。Safari や Chrome で開いてください。',
};

/** Pulls a code out of whatever was thrown (Firebase errors carry `code`, ours carry it on `message`). */
export function authErrorCode(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { code?: unknown; message?: unknown };
    if (typeof e.code === 'string' && e.code) return e.code;
    if (typeof e.message === 'string' && e.message) return e.message;
  }
  return 'unknown';
}

export function describeAuthError(
  err: unknown,
  lang: AuthLang,
  context: { provider?: boolean; inAppBrowser?: boolean } = {},
): AuthErrorView {
  const code = authErrorCode(err);
  if (SILENT.has(code)) return { message: null };

  let message =
    MESSAGES[code]?.[lang] ??
    (lang === 'ja' ? 'エラーが発生しました。もう一度お試しください。' : 'Something went wrong. Please try again.');

  if (context.provider && context.inAppBrowser && code !== 'auth/network-request-failed') {
    message = `${message} ${IN_APP_HINT[lang]}`;
  }

  if (code === 'email_not_verified') return { message, action: 'resend-verification' };
  if (code === 'auth/email-already-in-use') return { message, action: 'go-login' };
  return { message };
}

const PROVIDER_LABEL: Record<string, string> = {
  'google.com': 'Google',
  'apple.com': 'Apple',
};

/**
 * Shown when Google/Apple sign-in hits an email that is already registered with
 * another method. The credential is kept and linked after the user signs in the
 * old way (see AuthContext), so both methods work from then on.
 */
export function describeLinkPending(providerId: string, email: string | null, lang: AuthLang): string {
  const name = PROVIDER_LABEL[providerId] ?? providerId;
  if (lang === 'ja') {
    const who = email ? `${email} は` : 'このメールアドレスは';
    return `${who}別の方法で登録済みです。前に使った方法（メール・Google・Apple のいずれか）でログインすると、次回から ${name} でもログインできるようになります。`;
  }
  const who = email ? `${email} is` : 'This email is';
  return `${who} already registered with another method. Log in the way you did before (email, Google or Apple) and ${name} will work from then on too.`;
}
