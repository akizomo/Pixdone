import { useState, useEffect } from 'react';
import { ModalDialog, Button } from '../design-system/components';
import type { User } from 'firebase/auth';

const STORAGE_KEY = 'pd-maintenance-notice-20260410';

interface Props {
  user: User | null;
  lang: 'en' | 'ja';
}

export function MaintenanceNotice({ user, lang }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch { return; }
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [user]);

  const handleClose = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  };

  return (
    <ModalDialog
      open={open}
      onClose={handleClose}
      title={lang === 'ja' ? 'メンテナンスのお知らせ' : 'Maintenance Notice'}
      actions={
        <Button variant="primary" size="sm" onClick={handleClose}>
          OK
        </Button>
      }
    >
      <div style={{
        fontFamily: 'var(--pd-font-body)',
        fontSize: '0.85rem',
        color: 'var(--pd-color-text-secondary)',
        lineHeight: 1.7,
      }}>
        {lang === 'ja' ? (
          <>
            <p style={{ margin: '0 0 12px' }}>
              現在、サーバーメンテナンスの影響で一時的にデータの読み込みが遅延する場合があります。
            </p>
            <p style={{ margin: '0 0 12px' }}>
              タスクやリストのデータは安全に保存されています。しばらくお待ちいただければ自動的に復旧します。
            </p>
            <p style={{ margin: 0, color: 'var(--pd-color-text-muted)', fontSize: '0.8rem' }}>
              ご不便をおかけして申し訳ありません。
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 12px' }}>
              Due to server maintenance, data loading may be temporarily delayed.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              Your tasks and lists are safely stored. Service will be restored automatically shortly.
            </p>
            <p style={{ margin: 0, color: 'var(--pd-color-text-muted)', fontSize: '0.8rem' }}>
              We apologize for the inconvenience.
            </p>
          </>
        )}
      </div>
    </ModalDialog>
  );
}
