import { useNavigate } from 'react-router-dom';
import { ModalDialog, Button } from '../design-system';
import './UpsellModal.css';

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
    onClose();
    navigate('/pricing');
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <ModalDialog
      open={open}
      onClose={handleClose}
      closeOnOverlayClick
      aria-label={title}
      actions={
        <div className="upsell-modal__row-1">
          <Button variant="secondary" size="sm" soundKey="taskCancel" onClick={handleClose}>
            {isJa ? 'キャンセル' : 'CANCEL'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleUpgrade}>
            {isJa ? 'アップグレード' : 'UPGRADE'}
          </Button>
        </div>
      }
    >
      <div className="upsell-modal__box-1">
        <p
          className="upsell-modal__text-1"
        >
          {title}
        </p>
        <p
          className="upsell-modal__text-2"
        >
          {body}
        </p>
      </div>
    </ModalDialog>
  );
}
