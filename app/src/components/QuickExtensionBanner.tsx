import { useCallback, useEffect, useRef, useState } from 'react';
import { playSound } from '../services/sound';
import { PixelIcon } from '../design-system';
import './QuickExtensionBanner.css';

// Update this once the extension is published on Chrome Web Store
const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/jdlcihdlbpmhhhplgapmolemkkejhebd';
const STORAGE_KEY = 'pixdone-quick-banner-dismissed';

function canInstallChromeExtension(): boolean {
  return typeof window !== 'undefined' && 'chrome' in window;
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

interface Props {
  isDesktop: boolean;
}

export function QuickExtensionBanner({ isDesktop }: Props) {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDesktop || !canInstallChromeExtension() || isDismissed()) return;

    delayRef.current = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
    }, 1500);

    return () => { if (delayRef.current) clearTimeout(delayRef.current); };
  }, [isDesktop]);

  const dismiss = useCallback(() => {
    setExiting(true);
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
    setTimeout(() => setVisible(false), 220);
  }, []);

  if (!visible) return null;

  const cls = `quick-extension-banner${entered ? ' quick-extension-banner--entered' : ''}${exiting ? ' quick-extension-banner--exiting' : ''}`;

  return (
    <div className={cls} role="complementary" aria-label="PixDone quick の紹介">
      <span className="quick-extension-banner__icon">⚡</span>
      <span className="quick-extension-banner__text">
        PixDone quick — Chrome拡張でどこからでも即タスク追加
      </span>
      <a
        href={CHROME_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="quick-extension-banner__cta"
        onClick={() => playSound('buttonClick')}
      >
        Chrome に追加
      </a>
      <button
        type="button"
        className="quick-extension-banner__close"
        aria-label="閉じる"
        onClick={() => { playSound('taskCancel'); dismiss(); }}
      >
        <PixelIcon name="close" size="16px" />
      </button>
    </div>
  );
}
