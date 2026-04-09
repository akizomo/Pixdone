import { useNavigate } from 'react-router-dom';
import { ModalDialog } from '../design-system';
import { playSound } from '../services/sound';

export type UpsellReason = 'list-limit' | 'preset-theme' | 'sound-effect';

interface UpsellModalProps {
  open: boolean;
  onClose: () => void;
  reason: UpsellReason;
  lang?: 'en' | 'ja';
}

const COPY: Record<UpsellReason, { title: string; body: string; titleJa: string; bodyJa: string }> = {
  'list-limit': {
    title: 'LIST LIMIT REACHED',
    body: 'Free plan supports up to 3 lists.\nUpgrade to PixDone+ for unlimited lists.',
    titleJa: 'リスト上限に達しました',
    bodyJa: 'フリープランは最大3リストまで。\nPixDone+ にアップグレードして無制限に。',
  },
  'preset-theme': {
    title: 'PREMIUM THEME',
    body: 'This theme is available on PixDone+.\nUpgrade to unlock all premium themes.',
    titleJa: 'プレミアムテーマ',
    bodyJa: 'このテーマは PixDone+ で利用できます。\nアップグレードして全テーマを解放。',
  },
  'sound-effect': {
    title: 'PREMIUM SOUND',
    body: 'Custom sound effects are available on PixDone+.\nUpgrade to unlock.',
    titleJa: 'プレミアムサウンド',
    bodyJa: 'カスタムサウンドは PixDone+ で利用できます。\nアップグレードして解放。',
  },
};

export function UpsellModal({ open, onClose, reason, lang = 'en' }: UpsellModalProps) {
  const navigate = useNavigate();
  const copy = COPY[reason];
  const isJa = lang === 'ja';
  const title = isJa ? copy.titleJa : copy.title;
  const body = isJa ? copy.bodyJa : copy.body;

  const handleUpgrade = () => {
    playSound('buttonClick');
    onClose();
    navigate('/pricing');
  };

  const handleClose = () => {
    playSound('taskCancel');
    onClose();
  };

  return (
    <ModalDialog
      open={open}
      onClose={handleClose}
      closeOnOverlayClick
      aria-label={title}
      actions={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '2px solid var(--pd-color-border-default)',
              borderRadius: 0,
              cursor: 'pointer',
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.7rem',
              color: 'var(--pd-color-text-secondary)',
              letterSpacing: '1px',
            }}
          >
            {isJa ? 'キャンセル' : 'CANCEL'}
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            style={{
              padding: '8px 20px',
              background: 'var(--pd-color-accent-default)',
              border: '2px solid var(--pd-color-accent-default)',
              borderRadius: 0,
              cursor: 'pointer',
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.7rem',
              color: 'var(--pd-color-background-default)',
              letterSpacing: '1px',
            }}
          >
            {isJa ? 'アップグレード' : 'UPGRADE'}
          </button>
        </div>
      }
    >
      <div style={{ padding: '4px 0 8px' }}>
        <p
          style={{
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.875rem',
            color: 'var(--pd-color-text-primary)',
            letterSpacing: '1px',
            margin: '0 0 12px',
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: 'var(--pd-font-body)',
            fontSize: '0.875rem',
            color: 'var(--pd-color-text-secondary)',
            margin: 0,
            whiteSpace: 'pre-line',
            lineHeight: 1.6,
          }}
        >
          {body}
        </p>
      </div>
    </ModalDialog>
  );
}
