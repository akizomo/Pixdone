import { useCallback, useRef } from 'react';
import { useNavigate } from '../../hooks/useNavigate';
import { DemoTaskItem } from './DemoTaskItem';
import { EFFECTS_REGISTRY, isEffectLocked, canDeactivateEffect } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { Toggle } from '../../design-system';
import { playSound } from '../../services/sound';
import { badgeColor } from './rarityColors';
import { EvolutionSection } from './EvolutionSection';
import { resolveAnimationKey } from '../../data/effectEvolution';
import type { EffectProgressEntry } from '../../hooks/useEffectProgress';
import { pricingPath } from '../../services/analytics';
import './EffectSheetContent.css';

interface EffectSheetContentProps {
  effectKey: string;
  isPremium: boolean;
  activeEffects: string[];
  setActiveEffects: (keys: string[]) => void;
  ownedChallengeEffects?: string[];
  challengeProgressMap?: Record<string, number>;
  effectProgressMap?: Record<string, EffectProgressEntry>;
  lang: 'en' | 'ja';
  indexLabel: string;
  onPrev: () => void;
  onNext: () => void;
  canPrevNext: boolean;
}

export function EffectSheetContent({
  effectKey,
  isPremium,
  activeEffects,
  setActiveEffects,
  ownedChallengeEffects = [],
  challengeProgressMap = {},
  effectProgressMap = {},
  lang,
  indexLabel,
  onPrev,
  onNext,
  canPrevNext,
}: EffectSheetContentProps) {
  const navigate = useNavigate();
  const demoRef = useRef<HTMLDivElement>(null);

  const effect = EFFECTS_REGISTRY.find(e => e.key === effectKey);
  const isActive = activeEffects.includes(effectKey);
  const isLocked = effect ? isEffectLocked(effect, isPremium, ownedChallengeEffects) : true;
  const disableToggleOff = isActive && !canDeactivateEffect(effectKey, activeEffects, isPremium, ownedChallengeEffects);

  const isChallenge = effect?.access === 'challenge';
  const withinDeadline = !effect?.challengeDeadline || Date.now() <= effect.challengeDeadline.getTime();
  const challengeOwned = ownedChallengeEffects.includes(effectKey);
  const challengeProgress = challengeProgressMap[effectKey] ?? 0;
  const challengeThreshold = effect?.challengeUnlockThreshold ?? 0;

  const demoAnimKey = resolveAnimationKey(effectKey, effectProgressMap[effectKey]?.equippedLevel ?? 1);
  const triggerDemo = useCallback(() => {
    if (!demoRef.current) return;
    playDemoEffect(demoAnimKey, demoRef.current);
  }, [demoAnimKey]);

  const handleToggle = () => {
    if (isActive) {
      if (disableToggleOff) return;
      setActiveEffects(activeEffects.filter(k => k !== effectKey));
    } else {
      setActiveEffects([...activeEffects, effectKey]);
    }
  };

  return (
    <div className="effect-sheet-content__col-1">
      {/* Preview (maximize vertical space) */}
      <div className="effect-sheet-content__preview-maximize-vertical-sp">
        <div className="effect-sheet-content__row-1">
          <DemoTaskItem
            ref={demoRef}
            lang={lang}
            onSmash={triggerDemo}
          />
        </div>

        {/* Preview bottom: arrows + index */}
        <div className="effect-sheet-content__preview-bottom-arrows-index">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrevNext}
            className={`effect-sheet-content__text-9${canPrevNext ? ' effect-sheet-content__text-9--can-prev-next' : ''}`}
            aria-label={lang === 'ja' ? '前のエフェクト' : 'Previous effect'}
          >
            {'<'}
          </button>

          <div className="effect-sheet-content__text-1">
            {indexLabel}
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={!canPrevNext}
            className={`effect-sheet-content__text-9${canPrevNext ? ' effect-sheet-content__text-9--can-prev-next' : ''}`}
            aria-label={lang === 'ja' ? '次のエフェクト' : 'Next effect'}
          >
            {'>'}
          </button>
        </div>
      </div>

      {/* Bottom dock */}
      <div className="effect-sheet-content__bottom-dock">
        {/* Title + toggle */}
        <div className="effect-sheet-content__title-toggle">
          <div className="effect-sheet-content__text-2">
            {(effect?.name ?? '').toUpperCase()}
          </div>
          {/* Toggle: shown when not a pending challenge */}
          {(!isChallenge || challengeOwned) && (
            <div className="effect-sheet-content__row-2">
              <span className="effect-sheet-content__text-3">
                {lang === 'ja' ? 'アクティブ' : 'ACTIVE'}
              </span>
              <Toggle
                checked={isActive}
                disabled={isLocked || disableToggleOff}
                onChange={handleToggle}
                label={lang === 'ja' ? 'アクティブ' : 'ACTIVE'}
              />
            </div>
          )}
        </div>

        {/* Rarity / challenge badge + lock icon */}
        <div className="effect-sheet-content__rarity-challenge-badge-lock-">
          <div className="effect-sheet-content__row-3">
            <span className="effect-sheet-content__text-10" style={{ color: effect ? badgeColor(effect.rarity, isChallenge) : 'var(--pd-color-text-secondary)' }}>
              {isChallenge ? 'CHALLENGE' : (effect?.rarity ?? '')}
            </span>
            {isLocked && (
              <span className="effect-sheet-content__text-4" aria-label={lang === 'ja' ? 'ロック中' : 'Locked'}>
                🔒
              </span>
            )}
          </div>
          {disableToggleOff && (
            <span className="effect-sheet-content__text-5">
              {lang === 'ja' ? '※最低1つ必要' : 'min. 1 required'}
            </span>
          )}
        </div>

        <div className="effect-sheet-content__col-2">
          {/* Challenge progress bar */}
          {isChallenge && withinDeadline && !challengeOwned && challengeThreshold > 0 && (
            <div>
              <div className="effect-sheet-content__row-4">
                <span className="effect-sheet-content__text-6">
                  {lang === 'ja'
                    ? `タスクを${challengeThreshold}回完了で解放`
                    : `Complete ${challengeThreshold} tasks to unlock`}
                </span>
                <span className="effect-sheet-content__text-7">
                  {challengeProgress} / {challengeThreshold}
                </span>
              </div>
              <div className="effect-sheet-content__pos-1">
                <div className="effect-sheet-content__pos-11" style={{ width: `${Math.min(100, challengeThreshold > 0 ? (challengeProgress / challengeThreshold) * 100 : 0)}%` }} />
              </div>
            </div>
          )}

          {/* Evolution progress (shown after challenge is earned) */}
          <EvolutionSection
            effectKey={effectKey}
            isPremium={isPremium}
            effectProgress={effectProgressMap[effectKey]}
            lang={lang}
            compact
          />

          {/* Description */}
          <p className="effect-sheet-content__text-12 effect-sheet-content__box-15" >
            {effect ? effect.description[lang] : ''}
          </p>

          {/* Lock CTA area */}
          <div className="effect-sheet-content__lock-cta-area">
            <div className={`effect-sheet-content__row-13 effect-sheet-content__box-16${isLocked && effect?.access === 'premium' ? ' effect-sheet-content__box-16--is-locked-effect-access-' : ''}`} >
              <span className="effect-sheet-content__text-8">
                {lang === 'ja' ? 'PixDone+ が必要' : 'Requires PixDone+'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => { playSound('buttonClick'); navigate(pricingPath('collection_effect')); }}
              className={`effect-sheet-content__text-14 effect-sheet-content__box-17${isLocked && effect?.access === 'premium' ? ' effect-sheet-content__box-17--is-locked-effect-access-' : ''}`}
              aria-hidden={!(isLocked && effect?.access === 'premium')}
              tabIndex={isLocked && effect?.access === 'premium' ? 0 : -1}
            >
              {lang === 'ja' ? 'PixDone+ にアップグレード' : 'UPGRADE TO PIXDONE+'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
