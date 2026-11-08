import { useNavigate } from '../../hooks/useNavigate';
import { getEvolutionStatus } from '../../data/effectEvolution';
import type { EffectProgressEntry } from '../../hooks/useEffectProgress';
import { playSound } from '../../services/sound';
import { pricingPath } from '../../services/analytics';
import './EvolutionSection.css';

interface EvolutionSectionProps {
  effectKey: string;
  isPremium: boolean;
  effectProgress?: EffectProgressEntry;
  lang: 'en' | 'ja';
  /** Compact mode for mobile sheet (smaller text) */
  compact?: boolean;
}

/**
 * Displays evolution progress for evolving effects (e.g. Fighter Kick Lv1 → Lv2).
 * Shows progress bar, level badge, and premium CTA when applicable.
 * Returns null for non-evolving effects.
 */
export function EvolutionSection({
  effectKey,
  isPremium,
  effectProgress,
  lang,
  compact = false,
}: EvolutionSectionProps) {
  const navigate = useNavigate();

  const status = getEvolutionStatus({
    effectKey,
    equippedLevel: effectProgress?.equippedLevel ?? 1,
    evolutionProgress: effectProgress?.evolutionProgress ?? 0,
    isPremium,
  });

  if (!status) return null;

  // Only show for owned effects
  if (!effectProgress?.owned) return null;

  const fontSize = compact ? 'var(--pd-font-size-2xs)' : 'var(--pd-font-size-xs)';
  const smallFontSize = compact ? 'var(--pd-font-size-3xs)' : 'var(--pd-font-size-2xs)';
  const remaining = Math.max(0, status.threshold - status.progress);

  return (
    <div className="evolution-section__col-1">
      {/* Level badge */}
      <div className="evolution-section__level-badge">
        <span className={`evolution-section__text-3${status.isMaxLevel ? ' evolution-section__text-3--status-is-max-level' : ''}`} style={{ fontSize: smallFontSize }}>
          {`Lv${status.currentLevel}`}
        </span>
        {!status.isMaxLevel && (
          <span className="evolution-section__text-1">
            {lang === 'ja' ? '進化可能' : 'EVOLVABLE'}
          </span>
        )}
      </div>

      {/* Progress bar (only when not maxed) */}
      {!status.isMaxLevel && (
        <div>
          <div className="evolution-section__row-1">
            <span className="evolution-section__text-4" style={{ fontSize }}>
              {status.blockedReason === 'need_premium'
                ? (lang === 'ja' ? 'PixDone+で進化解放' : 'Upgrade to evolve')
                : status.blockedReason === 'ready'
                  ? (lang === 'ja' ? '進化準備完了！' : 'Ready to evolve!')
                  : (lang === 'ja'
                    ? `あと${remaining}回でLv${status.currentLevel + 1}に進化`
                    : `${remaining} more to evolve to Lv${status.currentLevel + 1}`)}
            </span>
            <span className="evolution-section__text-5" style={{ fontSize }}>
              {status.progress} / {status.threshold}
            </span>
          </div>
          <div className="evolution-section__pos-1">
            <div className={`evolution-section__pos-6${status.blockedReason === 'need_premium' ? ' evolution-section__pos-6--status-blocked-reason-ne' : ''}`} style={{ width: `${Math.min(100, status.threshold > 0 ? (status.progress / status.threshold) * 100 : 0)}%` }} />
          </div>
        </div>
      )}

      {/* Premium CTA when progress met but not premium */}
      {status.blockedReason === 'need_premium' && (
        <div className="evolution-section__row-2">
          <span className="evolution-section__text-2">🔒</span>
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); navigate(pricingPath('evolution')); }}
            className="evolution-section__text-7"
            style={{ fontSize: smallFontSize }}
          >
            {lang === 'ja' ? 'PixDone+で進化解放' : 'Unlock evolution with PixDone+'}
          </button>
        </div>
      )}
    </div>
  );
}
