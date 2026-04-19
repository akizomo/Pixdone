import { useEffect, useState } from 'react';
import { IconButton, ModalDialog, Button, PixelIcon } from '../design-system/components';
import { BottomSheet } from '../design-system/components/BottomSheet/BottomSheet';
import type { ActiveChallenge } from '../hooks/useActiveChallenge';

const urgentPulseStyle = `
@keyframes challenge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
[data-urgent="true"] .pxd-pixel-icon {
  animation: challenge-pulse 1.2s ease-in-out infinite;
}
`;

const challengeButtonStyle = `
[data-challenge-menu="true"] .pxd-icon-button {
  border-radius: 50%;
}
`;

/** Map effect key → preview GIF path */
const EFFECT_GIF_MAP: Record<string, string> = {
  fighter: '/fighter-punch.gif',
};

const DESKTOP_MQ = '(min-width: 768px)';

interface ChallengeMenuProps {
  challenge: ActiveChallenge | null;
  lang: 'en' | 'ja';
  onPreviewEffect?: (effectKey: string) => void;
}

const COMPLETED_SEEN_KEY = 'pd-challenge-completed-seen';

export function ChallengeMenu({ challenge, lang, onPreviewEffect }: ChallengeMenuProps) {
  const [open, setOpen] = useState(false);
  const [completedSeen, setCompletedSeen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MQ).matches : false,
  );

  // Track whether the user has already opened the menu since this challenge completed.
  useEffect(() => {
    if (!challenge?.isCompleted) {
      setCompletedSeen(false);
      return;
    }
    try {
      const seen = localStorage.getItem(`${COMPLETED_SEEN_KEY}-${challenge.effect.key}`);
      setCompletedSeen(!!seen);
    } catch (_) {
      setCompletedSeen(false);
    }
  }, [challenge?.effect.key, challenge?.isCompleted]);

  // When the menu is opened while completed, mark as seen and hide the red badge.
  useEffect(() => {
    if (!open || !challenge?.isCompleted || completedSeen) return;
    try {
      localStorage.setItem(`${COMPLETED_SEEN_KEY}-${challenge.effect.key}`, '1');
    } catch (_) { /* ignore */ }
    setCompletedSeen(true);
  }, [open, challenge?.effect.key, challenge?.isCompleted, completedSeen]);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!challenge) return null;

  const { effect, progress, threshold, isUrgent, isCompleted } = challenge;
  const pct = Math.min((progress / threshold) * 100, 100);

  const label = lang === 'ja' ? 'チャレンジ' : 'Challenge';

  const gifSrc = EFFECT_GIF_MAP[effect.key];

  const motivationalLine1 =
    lang === 'ja' ? 'チャレンジをクリアして、' : 'Complete the challenge';
  const motivationalLine2 =
    lang === 'ja' ? 'レアエフェクトを手に入れよう！' : 'to earn a rare effect!';

  const missionText = lang === 'ja'
    ? `タスクを ${threshold} 個完了`
    : `Complete ${threshold} tasks`;

  const deadlineText = challenge.deadline
    ? challenge.deadline.toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', {
        month: 'short', day: 'numeric',
      })
    : '';

  // ── Shared content ────────────────────────────────────────────────────
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* GIF preview + motivational message */}
      <div style={{ textAlign: 'center' }}>
        {gifSrc && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={gifSrc}
              alt={effect.name}
              style={{
                width: 200,
                height: 'auto',
                imageRendering: 'pixelated',
                marginBottom: 12,
              }}
            />
          </div>
        )}
        {!isCompleted && (
          <p style={{
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.85rem',
            color: 'var(--pd-color-text-primary)',
            margin: 0,
            lineHeight: 1.6,
          }}>
            {motivationalLine1}<br />
            {motivationalLine2}
          </p>
        )}
      </div>

      {/* Effect name + rarity + deadline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--pd-font-brand)',
          fontSize: '1.1rem',
          color: 'var(--pd-color-text-primary)',
        }}>
          {effect.name}
        </span>
        <span style={{
          fontFamily: 'var(--pd-font-brand)',
          fontSize: '0.65rem',
          letterSpacing: '1px',
          padding: '2px 6px',
          border: '1px solid var(--pd-color-border-default)',
          color: 'var(--pd-color-text-secondary)',
        }}>
          {effect.rarity}
        </span>
        {!isCompleted && deadlineText && (
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--pd-font-body)',
            fontSize: '0.75rem',
            color: isUrgent ? 'var(--pd-color-feedback-error)' : 'var(--pd-color-text-secondary)',
          }}>
            ~{deadlineText}
          </span>
        )}
      </div>

      {/* Description */}
      <p style={{
        fontFamily: 'var(--pd-font-body)',
        fontSize: '0.85rem',
        color: 'var(--pd-color-text-secondary)',
        margin: 0,
      }}>
        {effect.description[lang]}
      </p>

      {/* Progress bar or completion */}
      {isCompleted ? (
        <div style={{
          fontFamily: 'var(--pd-font-brand)',
          fontSize: '0.9rem',
          color: 'var(--pd-color-accent-default)',
          textAlign: 'center',
          padding: '12px 0',
        }}>
          {lang === 'ja' ? '獲得済み！コレクションをチェック。' : 'Earned! Check your collection.'}
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--pd-font-body)',
            fontSize: '0.8rem',
            color: 'var(--pd-color-text-secondary)',
            marginBottom: 4,
          }}>
            <span>{missionText}</span>
            <span>{progress} / {threshold}</span>
          </div>
          <div style={{
            height: 8,
            background: 'var(--pd-color-background-elevated)',
            border: '1px solid var(--pd-color-border-default)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: 'var(--pd-color-accent-default)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Preview button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setOpen(false);
          onPreviewEffect?.(effect.key);
        }}
      >
        {lang === 'ja' ? 'エフェクトをプレビュー →' : 'Preview effect →'}
      </Button>
    </div>
  );

  return (
    <>
      {isUrgent && <style>{urgentPulseStyle}</style>}
      <style>{challengeButtonStyle}</style>
      <div
        data-challenge-menu="true"
        data-urgent={isUrgent ? 'true' : undefined}
        style={{ position: 'relative', display: 'inline-flex' }}
      >
        <IconButton
          variant="ghost"
          size="md"
          aria-label={label}
          title={`${label} ${Math.round(pct)}%`}
          icon={<PixelIcon name="emoji_events" />}

          onClick={() => setOpen(true)}
        />
        {!isCompleted && <ChallengeProgressRing pct={pct} isCompleted={isCompleted} />}
        {isCompleted && !completedSeen && (
          <span
            data-testid="challenge-badge"
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--pd-color-feedback-error)',
            }}
          />
        )}
      </div>

      {/* Desktop: ModalDialog / Mobile: BottomSheet */}
      {isDesktop ? (
        <div data-testid="challenge-dialog">
          <ModalDialog
            open={open}
            onClose={() => setOpen(false)}
            title={label}
          >
            <div style={{ padding: '0 8px 8px' }}>
              {content}
            </div>
          </ModalDialog>
        </div>
      ) : (
        <div data-testid="challenge-sheet">
          <BottomSheet
            open={open}
            onClose={() => setOpen(false)}
            title={label}
          >
            <div style={{ padding: '0 16px 24px' }}>
              {content}
            </div>
          </BottomSheet>
        </div>
      )}
    </>
  );
}

interface ChallengeProgressRingProps {
  pct: number;
  isCompleted: boolean;
}

function ChallengeProgressRing({ pct, isCompleted }: ChallengeProgressRingProps) {
  const size = 40;
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(pct, 100));
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg
      width={size}
      height={size}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-90deg)',
        pointerEvents: 'none',
      }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--pd-color-border-default)"
        strokeWidth={stroke}
        opacity={0.5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--pd-color-accent-default)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={isCompleted ? 0 : offset}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  );
}
