/// <reference types="chrome" />
import { useRef, useState } from 'react';
import { IconButton, PixelIcon, PopoverMenu, Chip } from '@app/design-system';
import type { PopoverMenuItem } from '@app/design-system/components/PopoverMenu/PopoverMenu.types';

const WEB_EXTENSION_LINK_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5173/extension-link'
    : 'https://pixdone.vercel.app/extension-link';
const WEB_HOME_URL = 'https://pixdone.vercel.app';

/**
 * Chrome Web Store review URL. The production extension ID isn't known at
 * build time (it's assigned when the extension is uploaded to the store), so
 * we read the runtime id at click time.
 */
function openWebStoreReview(): void {
  const id = chrome.runtime?.id;
  const url = id
    ? `https://chrome.google.com/webstore/detail/${id}/reviews`
    : 'https://chrome.google.com/webstore/category/extensions';
  chrome.tabs.create({ url });
}

interface AccountMenuProps {
  lang: 'en' | 'ja';
  email: string | null;
  soundMuted: boolean;
  onChangeLang: (l: 'en' | 'ja') => void;
  onToggleSound: () => void;
  onSignOut: () => void;
}

/**
 * Compact account menu for the Quick panel header. Mirrors the main app's
 * user menu but trimmed down: Effects/Themes → web-site link, Feedback →
 * Chrome Web Store review link. Removes privacy/terms/commerce entries.
 */
export function AccountMenu({
  lang,
  email,
  soundMuted,
  onChangeLang,
  onToggleSound,
  onSignOut,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  // Wrap in a span because IconButton doesn't forward refs.
  const triggerRef = useRef<HTMLSpanElement>(null);

  const label = lang === 'ja' ? 'アカウントメニュー' : 'Account menu';

  const items: PopoverMenuItem[] = [
    ...(email ? [{ id: 'email', label: email, icon: 'person', group: 'account', disabled: true }] : []),
    { id: 'open-app', label: lang === 'ja' ? 'PixDone を開く' : 'Open PixDone', icon: 'external-link', group: 'nav' },
    {
      id: 'lang',
      label: lang === 'ja' ? '言語' : 'Language',
      icon: 'comment',
      group: 'settings',
      trailing: (
        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <Chip variant="ghost" size="sm" selected={lang === 'en'} onClick={() => onChangeLang('en')}>En</Chip>
          <Chip variant="ghost" size="sm" selected={lang === 'ja'} onClick={() => onChangeLang('ja')}>Ja</Chip>
        </div>
      ),
    },
    {
      id: 'sound',
      label: soundMuted
        ? lang === 'ja' ? 'サウンドオフ' : 'Sound off'
        : lang === 'ja' ? 'サウンドオン' : 'Sound on',
      icon: soundMuted ? 'volume-x' : 'volume-3',
      group: 'settings',
    },
    { id: 'support', label: lang === 'ja' ? 'サポート' : 'Support PixDone', icon: 'heart', group: 'community' },
    { id: 'review', label: lang === 'ja' ? 'ストアでレビュー' : 'Review on Web Store', icon: 'comment', group: 'community' },
    { id: 'logout', label: lang === 'ja' ? 'ログアウト' : 'Sign out', icon: 'logout', group: 'logout' },
  ];

  const onSelect = (id: string) => {
    setOpen(false);
    switch (id) {
      case 'open-app':
        chrome.tabs.create({ url: WEB_HOME_URL });
        return;
      case 'lang':
        return; // handled by trailing chips
      case 'sound':
        onToggleSound();
        return;
      case 'support':
        chrome.tabs.create({ url: 'https://buymeacoffee.com/akizomo' });
        return;
      case 'review':
        openWebStoreReview();
        return;
      case 'logout':
        onSignOut();
        return;
    }
  };

  return (
    <>
      <span ref={triggerRef} style={{ display: 'inline-flex' }}>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={label}
          icon={<PixelIcon name="person" />}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
        />
      </span>
      {open && (
        <PopoverMenu
          items={items}
          anchorEl={triggerRef.current}
          onSelect={onSelect}
          onClose={() => setOpen(false)}
          align="right"
        />
      )}
    </>
  );
}

export { WEB_EXTENSION_LINK_URL };
