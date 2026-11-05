import { describe, expect, it } from 'vitest';
import { authErrorCode, describeAuthError, describeLinkPending, isInAppBrowser } from './authErrors';

describe('describeAuthError', () => {
  it('stays silent when the user closes the Google/Apple window', () => {
    expect(describeAuthError({ code: 'auth/popup-closed-by-user' }, 'ja').message).toBeNull();
    expect(describeAuthError({ code: 'auth/cancelled-popup-request' }, 'en').message).toBeNull();
  });

  it('points at Google/Apple when email login fails (method is hidden by enumeration protection)', () => {
    const v = describeAuthError({ code: 'auth/invalid-credential' }, 'ja');
    expect(v.message).toContain('Google や Apple');
    expect(v.action).toBeUndefined();
  });

  it('offers a resend for unverified emails', () => {
    expect(describeAuthError(new Error('email_not_verified'), 'en').action).toBe('resend-verification');
  });

  it('offers the login form when sign-up hits an existing email', () => {
    const v = describeAuthError({ code: 'auth/email-already-in-use' }, 'ja');
    expect(v.action).toBe('go-login');
    expect(v.message).toContain('Google や Apple');
  });

  it('adds the in-app browser hint only to provider errors', () => {
    const err = { code: 'auth/popup-blocked' };
    expect(describeAuthError(err, 'ja', { provider: true, inAppBrowser: true }).message).toContain('Safari');
    expect(describeAuthError(err, 'ja', { provider: true, inAppBrowser: false }).message).not.toContain('アプリ内');
  });

  it('falls back to a generic message for unknown codes', () => {
    expect(describeAuthError({ code: 'auth/something-new' }, 'en').message).toMatch(/try again/i);
    expect(describeAuthError(undefined, 'ja').message).toContain('もう一度');
  });
});

describe('authErrorCode', () => {
  it('prefers code, then message', () => {
    expect(authErrorCode({ code: 'auth/x', message: 'y' })).toBe('auth/x');
    expect(authErrorCode(new Error('missing_email'))).toBe('missing_email');
    expect(authErrorCode(null)).toBe('unknown');
  });
});

describe('isInAppBrowser', () => {
  it('detects LINE / Instagram and ignores Safari', () => {
    expect(isInAppBrowser('Mozilla/5.0 (iPhone) AppleWebKit Line/13.0.0')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 (iPhone) Instagram 300.0')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 (iPhone) Version/17.0 Mobile Safari/604.1')).toBe(false);
  });
});

describe('describeLinkPending', () => {
  it('names the provider and the email', () => {
    const m = describeLinkPending('apple.com', 'a@example.com', 'ja');
    expect(m).toContain('a@example.com');
    expect(m).toContain('Apple');
  });
});
