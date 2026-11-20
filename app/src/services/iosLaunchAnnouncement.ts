/**
 * One-time "PixDone is now on the App Store" announcement for existing web users.
 *
 * Set IOS_APP_STORE_URL to null to switch it off.
 */
export const IOS_APP_STORE_URL: string | null = 'https://apps.apple.com/app/pixdone/id6827877093';

const SEEN_KEY = 'pd.iosLaunchAnnouncement.seen';

export function isAndroidBrowser(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

export function shouldShowIosLaunchAnnouncement(isNative: boolean): boolean {
  // Android web users can't install the iOS app, so don't show it to them.
  if (!IOS_APP_STORE_URL || isNative || isAndroidBrowser()) return false;
  try {
    return localStorage.getItem(SEEN_KEY) !== '1';
  } catch {
    return false;
  }
}

export function markIosLaunchAnnouncementSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}
