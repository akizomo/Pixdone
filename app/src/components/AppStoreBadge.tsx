import { IOS_APP_STORE_URL, isAndroidBrowser } from '../services/iosLaunchAnnouncement';
import type { Lang } from '../lib/i18n';
import './AppStoreBadge.css';

interface Props {
  lang: Lang;
  className?: string;
}

/**
 * Official "Download on the App Store" badge (Apple marketing resources, black lockup).
 * Do not recolor, crop or restyle the artwork — only its size is adjusted via CSS.
 * Hidden on Android browsers, where the iOS app can't be installed.
 */
export function AppStoreBadge({ lang, className }: Props) {
  if (!IOS_APP_STORE_URL || isAndroidBrowser()) return null;
  const isJa = lang === 'ja';
  return (
    <a
      href={IOS_APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`app-store-badge${className ? ` ${className}` : ''}`}
    >
      <img
        src={`/badges/app-store-${isJa ? 'ja' : 'en'}.svg`}
        alt={isJa ? 'App Store からダウンロード' : 'Download on the App Store'}
        className="app-store-badge__img"
        draggable={false}
      />
    </a>
  );
}
