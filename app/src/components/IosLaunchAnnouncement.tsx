import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Button, ModalDialog, PixelIcon } from '../design-system';
import { openExternal } from '../services/externalLink';
import {
  IOS_APP_STORE_URL,
  markIosLaunchAnnouncementSeen,
  shouldShowIosLaunchAnnouncement,
} from '../services/iosLaunchAnnouncement';
import { t, type Lang } from '../lib/i18n';
import './IosLaunchAnnouncement.css';

interface Props {
  lang: Lang;
  /** False while another full-screen flow (e.g. onboarding) is on screen, or the user is logged out. */
  ready: boolean;
}

const POINTS: { icon: string; key: string }[] = [
  { icon: 'auto_awesome', key: 'iosLaunchPointEffects' },
  { icon: 'format_list_bulleted', key: 'iosLaunchPointReminders' },
  { icon: 'person', key: 'iosLaunchPointAccount' },
];

export function IosLaunchAnnouncement({ lang, ready }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready || !shouldShowIosLaunchAnnouncement(Capacitor.isNativePlatform())) return;
    // Mark as seen as soon as it is shown, so closing by overlay / Esc never brings it back.
    markIosLaunchAnnouncementSeen();
    setOpen(true);
  }, [ready]);

  return (
    <ModalDialog
      open={open}
      onClose={() => setOpen(false)}
      title={t('iosLaunchTitle', lang)}
      actions={
        <>
          <Button variant="secondary" soundKey="taskCancel" onClick={() => setOpen(false)}>
            {t('iosLaunchLater', lang)}
          </Button>
          <Button
            variant="primary"
            soundKey="buttonClick"
            onClick={() => {
              if (IOS_APP_STORE_URL) openExternal(IOS_APP_STORE_URL);
              setOpen(false);
            }}
          >
            {t('iosLaunchCta', lang)}
          </Button>
        </>
      }
    >
      <img
        className="ios-launch__hero"
        src={`/announcements/ios-launch-hero-${lang === 'ja' ? 'ja' : 'en'}.jpg`}
        alt=""
        width={1200}
        height={720}
      />
      <p className="ios-launch__lead">{t('iosLaunchBody', lang)}</p>
      <ul className="ios-launch__points">
        {POINTS.map(({ icon, key }) => (
          <li key={key} className="ios-launch__point">
            <span className="ios-launch__point-icon">
              <PixelIcon name={icon} size="md" />
            </span>
            {t(key, lang)}
          </li>
        ))}
      </ul>
    </ModalDialog>
  );
}
