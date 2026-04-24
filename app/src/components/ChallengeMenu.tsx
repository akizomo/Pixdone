import { useEffect, useMemo, useState } from 'react';
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

/** Map effect key → preview GIF path. Kept in sync with `OnboardingTutorial`. */
const EFFECT_GIF_MAP: Record<string, string> = {
  fighter_punch: '/fighter-punch.gif',
  fighter_punch_lv2: '/fighter-kick.gif',
};

const DESKTOP_MQ = '(min-width: 768px)';

interface ChallengeMenuProps {
  /**
   * All currently active challenges (including evolution-kind child unlocks).
   * Owned or expired challenges MUST be filtered out upstream — this component
   * does not re-filter.
   */
  challenges: ActiveChallenge[];
  lang: 'en' | 'ja';
  onPreviewEffect?: (effectKey: string) => void;
}

const COMPLETED_SEEN_KEY = 'pd-challenge-completed-seen';

/**
 * Picks the challenge used to drive the header icon's progress ring and
 * urgency animation. Preference order:
 *   1. the most urgent non-completed challenge (fewest daysLeft)
 *   2. the first non-completed challenge (by registry order)
 *   3. the first challenge (fallback — all completed)
 */
function pickPrimaryChallenge(challenges: ActiveChallenge[]): ActiveChallenge | null {
  if (challenges.length === 0) return null;
  const incomplete = challenges.filter(c => !c.isCompleted);
  if (incomplete.length > 0) {
    return [...incomplete].sort((a, b) => a.daysLeft - b.daysLeft)[0];
  }
  return challenges[0];
}

export function ChallengeMenu({
  challenges,
  lang,
  onPreviewEffect,
}: ChallengeMenuProps) {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MQ).matches : false,
  );
  const [completedSeenMap, setCompletedSeenMap] = useState<Record<string, boolean>>({});

  const primary = useMemo(() => pickPrimaryChallenge(challenges), [challenges]);
  const anyUrgent = challenges.some(c => c.isUrgent && !c.isCompleted);
  const unseenCompleted = challenges.filter(c => c.isCompleted && !completedSeenMap[c.effect.key]);

  // Track completed-unseen per effect key so a red badge can nag the user to open.
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const c of challenges) {
      if (!c.isCompleted) continue;
      try {
        const seen = localStorage.getItem(`${COMPLETED_SEEN_KEY}-${c.effect.key}`);
        next[c.effect.key] = !!seen;
      } catch (_) {
        next[c.effect.key] = false;
      }
    }
    setCompletedSeenMap(next);
  }, [challenges]);

  // Mark all currently-completed challenges as seen when the user opens the menu.
  useEffect(() => {
    if (!open) return;
    const next = { ...completedSeenMap };
    let changed = false;
    for (const c of challenges) {
      if (c.isCompleted && !next[c.effect.key]) {
        try {
          localStorage.setItem(`${COMPLETED_SEEN_KEY}-${c.effect.key}`, '1');
        } catch (_) { /* ignore */ }
        next[c.effect.key] = true;
        changed = true;
      }
    }
    if (changed) setCompletedSeenMap(next);
  }, [open, challenges, completedSeenMap]);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!primary) return null;

  const primaryPct = Math.min((primary.progress / primary.threshold) * 100, 100);
  const label = lang === 'ja' ? 'チャレンジ' : 'Challenge';

  // ── Shared content ────────────────────────────────────────────────────
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {challenges.map((ch, idx) => (
        <ChallengeCard
          key={ch.effect.key}
          challenge={ch}
          lang={lang}
          withDivider={idx > 0}
          onPreview={(effectKey) => {
            setOpen(false);
            onPreviewEffect?.(effectKey);
          }}
        />
      ))}
    </div>
  );

  return (
    <>
      {anyUrgent && <style>{urgentPulseStyle}</style>}
      <style>{challengeButtonStyle}</style>
      <div
        data-challenge-menu="true"
        data-urgent={anyUrgent ? 'true' : undefined}
        style={{ position: 'relative', display: 'inline-flex' }}
      >
        <IconButton
          variant="ghost"
          size="md"
          aria-label={label}
          title={`${label} ${Math.round(primaryPct)}%`}
          icon={<PixelIcon name="emoji_events" />}
          onClick={() => setOpen(true)}
        />
        {!primary.isCompleted && <ChallengeProgressRing pct={primaryPct} isCompleted={false} />}
        {unseenCompleted.length > 0 && (
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

// ── Per-challenge card ───────────────────────────────────────────────────────

interface ChallengeCardProps {
  challenge: ActiveChallenge;
  lang: 'en' | 'ja';
  withDivider: boolean;
  onPreview: (effectKey: string) => void;
}

function ChallengeCard({ challenge, lang, withDivider, onPreview }: ChallengeCardProps) {
  const { effect, progress, threshold, isUrgent, isCompleted } = challenge;
  const pct = Math.min((progress / threshold) * 100, 100);
  const gifSrc = EFFECT_GIF_MAP[effect.key];

  const missionText = lang === 'ja'
    ? `タスクを ${threshold} 個完了`
    : `Complete ${threshold} tasks`;

  // `ActiveChallenge.deadline` carries a sentinel far-future date for
  // evolution-kind entries with no real deadline — don't render that as text.
  const hasRealDeadline = isFinite(challenge.daysLeft);
  const deadlineText = hasRealDeadline
    ? challenge.deadline.toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', {
        month: 'short', day: 'numeric',
      })
    : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingTop: withDivider ? 16 : 0,
        borderTop: withDivider ? '1px solid var(--pd-color-border-default)' : undefined,
      }}
    >
      {gifSrc && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src={gifSrc}
            alt={effect.name}
            style={{ width: 160, height: 'auto', imageRendering: 'pixelated' }}
          />
        </div>
      )}

      {/* Name + Rarity + Deadline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--pd-font-brand)',
          fontSize: '1rem',
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
          padding: '8px 0',
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
      <Button variant="ghost" size="sm" onClick={() => onPreview(effect.key)}>
        {lang === 'ja' ? 'エフェクトをプレビュー →' : 'Preview effect →'}
      </Button>
    </div>
  );
}

// ── Progress ring ────────────────────────────────────────────────────────────

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
