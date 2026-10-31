import type { EffectDef } from '../../data/effectsRegistry';
import { PixelIcon } from '../../design-system';
import { isEffectLocked } from '../../data/effectsRegistry';
import { badgeColor } from './rarityColors';
import './EffectCard.css';

interface EffectCardProps {
  effect: EffectDef;
  isEquipped: boolean;
  isPremium: boolean;
  ownedChallengeEffects?: string[];
  onClick: () => void;
}

export function EffectCard({ effect, isEquipped, isPremium, ownedChallengeEffects = [], onClick }: EffectCardProps) {
  const isLocked = isEffectLocked(effect, isPremium, ownedChallengeEffects);
  const isChallenge = effect.access === 'challenge';
  const withinDeadline = !effect.challengeDeadline || Date.now() <= effect.challengeDeadline.getTime();

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '12px',
        background: 'var(--pd-color-background-elevated)',
        border: '2px solid var(--pd-color-border-default)',
        borderRadius: 0,
        cursor: 'pointer',
        textAlign: 'left',
        opacity: isLocked ? 0.7 : 1,
        position: 'relative',
        width: '100%',
        transition: 'opacity 0.15s',
      }}
    >
      {/* Rarity badge — level badges are obsolete now that each level is a separate card. */}
      <span
        style={{
          fontSize: 'var(--pd-font-size-sm)',
          fontFamily: 'var(--pd-font-brand)',
          letterSpacing: '1px',
          color: badgeColor(effect.rarity, isChallenge),
        }}
      >
        {effect.rarity}
      </span>

      {/* Effect name */}
      <span
        className="effect-card__effect-name"
      >
        {effect.name}
      </span>

      {/* Status indicator */}
      {isEquipped && !isLocked && (
        <span
          className="effect-card__text-1"
        >
          <PixelIcon name="check" />
        </span>
      )}
      {isLocked && (
        <span
          className="effect-card__text-2"
        >
          🔒
        </span>
      )}
      {/* Challenge badge (active period, not yet earned) */}
      {isChallenge && withinDeadline && !ownedChallengeEffects.includes(effect.key) && (
        <span
          className="effect-card__text-3"
        >
          CHALLENGE
        </span>
      )}
    </button>
  );
}
