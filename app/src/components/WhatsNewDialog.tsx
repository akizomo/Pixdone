import { ModalDialog, Button } from '../design-system';
import { playSound } from '../services/sound';

/** Bump this whenever you want to show the dialog again for returning users. */
export const WHATS_NEW_VERSION = '2.0';
const STORAGE_KEY = 'pixdone-whats-new-v';

export function hasSeenWhatsNew(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === WHATS_NEW_VERSION;
  } catch {
    return true;
  }
}

export function markWhatsNewSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION);
  } catch { /* ignore */ }
}

const IMPROVEMENTS = {
  en: [
    'Faster, smoother UI rebuilt in React',
    'More reliable cloud sync across devices',
  ],
  ja: [
    'React で作り直した、より速くなめらかな UI',
    'デバイス間のクラウド同期をさらに安定化',
  ],
};

export interface WhatsNewDialogProps {
  open: boolean;
  onClose: () => void;
  lang?: 'en' | 'ja';
}

export function WhatsNewDialog({ open, onClose, lang = 'en' }: WhatsNewDialogProps) {
  const handleClose = () => {
    markWhatsNewSeen();
    playSound('taskCancel');
    onClose();
  };

  const isJa = lang === 'ja';

  return (
    <ModalDialog
      open={open}
      onClose={handleClose}
      title={isJa ? '🎉 アップデートのお知らせ' : "🎉 What's New"}
      actions={
        <Button variant="primary" onClick={handleClose}>
          {isJa ? 'わかった！' : 'Got it!'}
        </Button>
      }
    >
      {/* ── Hero: Pomodoro ── */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          padding: '12px',
          border: '2px solid var(--pd-color-accent-default)',
          boxShadow: '3px 3px 0px var(--pd-color-shadow-default)',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>⏱️</span>
        <div>
          <div
            style={{
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: 'var(--pd-color-accent-default)',
              marginBottom: '4px',
            }}
          >
            {isJa ? 'ポモドーロ タイマー' : 'Pomodoro Timer'}
          </div>
          <div
            style={{
              fontFamily: 'var(--pd-font-body)',
              fontSize: '0.8125rem',
              lineHeight: 1.45,
              color: 'var(--pd-color-text-secondary)',
            }}
          >
            {isJa
              ? '25分フォーカス → 休憩のサイクルで集中力アップ。ピクセル世界観のBGM・サウンドと組み合わせて、さらに没入できるよ。フォーカスタブから試してみて。'
              : '25-minute focus sessions with breaks to keep you in flow. Pair it with pixel-style BGM and chiptune sound effects for full immersion. Check the Focus tab.'}
          </div>
        </div>
      </div>

      {/* ── Other improvements ── */}
      <div
        style={{
          fontFamily: 'var(--pd-font-brand)',
          fontSize: '0.6875rem',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--pd-color-text-muted)',
          marginBottom: '8px',
        }}
      >
        {isJa ? 'デザイン・操作性の改善' : 'Design & UX Improvements'}
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: '0 0 20px',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {(isJa ? IMPROVEMENTS.ja : IMPROVEMENTS.en).map((item) => (
          <li
            key={item}
            style={{
              display: 'flex',
              gap: '8px',
              fontFamily: 'var(--pd-font-body)',
              fontSize: '0.8125rem',
              lineHeight: 1.45,
              color: 'var(--pd-color-text-secondary)',
            }}
          >
            <span style={{ flexShrink: 0, color: 'var(--pd-color-accent-default)' }}>▸</span>
            {item}
          </li>
        ))}
      </ul>

      {/* ── Coming Soon ── */}
      <div
        style={{
          padding: '10px 12px',
          border: '1px dashed var(--pd-color-border-default)',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1.2, flexShrink: 0 }}>🎨</span>
        <div>
          <div
            style={{
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.6875rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--pd-color-text-muted)',
              marginBottom: '2px',
            }}
          >
            Coming Soon
          </div>
          <div
            style={{
              fontFamily: 'var(--pd-font-body)',
              fontSize: '0.8125rem',
              color: 'var(--pd-color-text-secondary)',
            }}
          >
            {isJa
              ? '新しいテーマを制作中。お楽しみに！'
              : 'New themes are on the way. Stay tuned!'}
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
