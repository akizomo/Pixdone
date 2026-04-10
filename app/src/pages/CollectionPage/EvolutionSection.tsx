import { useNavigate } from 'react-router-dom';
import { getEvolutionStatus } from '../../data/effectEvolution';
import type { EffectProgressEntry } from '../../hooks/useEffectProgress';
import { playSound } from '../../services/sound';

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

  const fontSize = compact ? '0.75rem' : '0.8125rem';
  const smallFontSize = compact ? '0.6875rem' : '0.75rem';
  const remaining = Math.max(0, status.threshold - status.progress);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Level badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontFamily: 'var(--pd-font-brand)',
          fontSize: smallFontSize,
          letterSpacing: '1px',
          color: status.isMaxLevel ? '#64ffda' : '#ffd54f',
          fontWeight: 'bold',
        }}>
          {`Lv${status.currentLevel}`}
        </span>
        {!status.isMaxLevel && (
          <span style={{
            fontFamily: 'var(--pd-font-brand)',
            fontSize: '0.5625rem',
            letterSpacing: '1px',
            color: 'var(--pd-color-text-secondary)',
          }}>
            {lang === 'ja' ? '進化可能' : 'EVOLVABLE'}
          </span>
        )}
      </div>

      {/* Progress bar (only when not maxed) */}
      {!status.isMaxLevel && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--pd-font-body)',
              fontSize,
              color: 'var(--pd-color-text-primary)',
            }}>
              {status.blockedReason === 'need_premium'
                ? (lang === 'ja' ? 'PixDone+で進化解放' : 'Upgrade to evolve')
                : status.blockedReason === 'ready'
                  ? (lang === 'ja' ? '進化準備完了！' : 'Ready to evolve!')
                  : (lang === 'ja'
                    ? `あと${remaining}回でLv${status.currentLevel + 1}に進化`
                    : `${remaining} more to evolve to Lv${status.currentLevel + 1}`)}
            </span>
            <span style={{
              fontFamily: 'var(--pd-font-body)',
              fontSize,
              color: 'var(--pd-color-text-secondary)',
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {status.progress} / {status.threshold}
            </span>
          </div>
          <div style={{
            height: '4px',
            background: 'var(--pd-color-border-default)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${Math.min(100, status.threshold > 0 ? (status.progress / status.threshold) * 100 : 0)}%`,
              background: status.blockedReason === 'need_premium' ? '#9e9e9e' : '#ffd54f',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Premium CTA when progress met but not premium */}
      {status.blockedReason === 'need_premium' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <span style={{ fontSize: '0.75rem' }}>🔒</span>
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); navigate('/pricing'); }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--pd-font-body)',
              fontSize: smallFontSize,
              color: 'var(--pd-color-text-secondary)',
              textDecoration: 'underline',
            }}
          >
            {lang === 'ja' ? 'PixDone+で進化解放' : 'Unlock evolution with PixDone+'}
          </button>
        </div>
      )}
    </div>
  );
}
