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
      className={`effect-card__col-4${isLocked ? ' effect-card__col-4--is-locked' : ''}`}
    >
      {/* Rarity badge — level badges are obsolete now that each level is a separate card. */}
      <span
        className="effect-card__text-5"
        style={{ color: badgeColor(effect.rarity, isChallenge) }}
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
