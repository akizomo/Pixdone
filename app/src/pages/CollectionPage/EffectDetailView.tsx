import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoTaskItem } from './DemoTaskItem';
import { EFFECTS_REGISTRY, isEffectLocked, canDeactivateEffect } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { playSound } from '../../services/sound';
import { Toggle } from '../../design-system';
import { DetailViewHeader } from '../../components/SubPageHeader';
import { badgeColor } from './rarityColors';
import './EffectDetailView.css';

interface EffectDetailViewProps {
  effectKey: string;
  isPremium: boolean;
  activeEffects: string[];
  setActiveEffects: (keys: string[]) => void;
  ownedChallengeEffects?: string[];
  challengeProgressMap?: Record<string, number>;
  lang: 'en' | 'ja';
  onClose: () => void;
}

export function EffectDetailView({
  effectKey, isPremium, activeEffects, setActiveEffects,
  ownedChallengeEffects = [], challengeProgressMap = {},
  lang, onClose,
}: EffectDetailViewProps) {
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

  const triggerDemo = useCallback(() => {
    if (!demoRef.current) return;
    playDemoEffect(effectKey, demoRef.current);
  }, [effectKey]);

  const handleToggle = () => {
    if (isLocked) { navigate('/pricing'); return; }
    if (isActive) {
      if (disableToggleOff) return;
      setActiveEffects(activeEffects.filter(k => k !== effectKey));
    } else {
      setActiveEffects([...activeEffects, effectKey]);
    }
  };

  if (!effect) return null;

  return (
    <div className="effect-detail__col-1">
      {/* Header */}
      <DetailViewHeader title={effect.name.toUpperCase()} isJa={lang === 'ja'} onBack={onClose}>
        <span style={{
          fontSize: 'var(--pd-font-size-sm)', fontFamily: 'var(--pd-font-brand)', letterSpacing: '1px',
          color: badgeColor(effect.rarity, isChallenge),
          flexShrink: 0,
        }}>
          {isChallenge ? 'CHALLENGE' : effect.rarity}
        </span>
        {/* Toggle (shown only once challenge is earned, or for non-challenge effects) */}
        {(!isChallenge || challengeOwned) && (
          <div className="effect-detail__row-1">
            <span className="effect-detail__text-1">
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
      </DetailViewHeader>

      {/* Demo area */}
      <div className="effect-detail__demo-area">
        <DemoTaskItem
          ref={demoRef}
          lang={lang}
          onSmash={triggerDemo}
        />
      </div>

      {/* Info */}
      <div className="effect-detail__info">
        {disableToggleOff && (
          <p className="effect-detail__text-2">
            {lang === 'ja'
              ? '各レアリティで最低1つのエフェクトをアクティブにする必要があります。'
              : 'At least one effect per rarity must remain active.'}
          </p>
        )}

        {/* Challenge progress bar (active period, not yet earned) */}
        {isChallenge && withinDeadline && !challengeOwned && challengeThreshold > 0 && (
          <div>
            <div className="effect-detail__row-2">
              <span className="effect-detail__text-3">
                {lang === 'ja'
                  ? `タスクを${challengeThreshold}回完了で解放`
                  : `Complete ${challengeThreshold} tasks to unlock`}
              </span>
              <span className="effect-detail__text-4">
                {challengeProgress} / {challengeThreshold}
              </span>
            </div>
            <div className="effect-detail__pos-1">
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${Math.min(100, challengeThreshold > 0 ? (challengeProgress / challengeThreshold) * 100 : 0)}%`,
                background: 'var(--pd-color-rarity-legendary)',
                transition: 'width 0.3s',
              }} />
            </div>
            {effect.challengeDeadline && (
              <p className="effect-detail__text-5">
                {lang === 'ja'
                  ? `期限: ${effect.challengeDeadline.toLocaleDateString('ja-JP')}`
                  : `Deadline: ${effect.challengeDeadline.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`}
              </p>
            )}
          </div>
        )}

        <p className="effect-detail__text-6">
          {effect.description[lang]}
        </p>
        {isLocked && effect.access === 'premium' && (
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); navigate('/pricing'); }}
            className="effect-detail__text-7"
          >
            {lang === 'ja' ? 'PixDone+ にアップグレード' : 'UPGRADE TO PIXDONE+'}
          </button>
        )}
      </div>
    </div>
  );
}
