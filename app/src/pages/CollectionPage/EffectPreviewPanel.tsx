import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoTaskItem } from './DemoTaskItem';
import { EFFECTS_REGISTRY, isEffectLocked, canDeactivateEffect } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { Toggle } from '../../design-system';
import { EvolutionSection } from './EvolutionSection';
import { resolveAnimationKey } from '../../data/effectEvolution';
import type { EffectProgressEntry } from '../../hooks/useEffectProgress';
import './EffectPreviewPanel.css';

interface EffectPreviewPanelProps {
  effectKey: string;
  isPremium: boolean;
  activeEffects: string[];
  setActiveEffects: (keys: string[]) => void;
  ownedChallengeEffects?: string[];
  challengeProgressMap?: Record<string, number>;
  effectProgressMap?: Record<string, EffectProgressEntry>;
  lang: 'en' | 'ja';
}

export function EffectPreviewPanel({
  effectKey, isPremium, activeEffects, setActiveEffects,
  ownedChallengeEffects = [], challengeProgressMap = {},
  effectProgressMap = {},
  lang,
}: EffectPreviewPanelProps) {
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
    if (isLocked) { navigate('/pricing'); return; }
    if (isActive) {
      if (disableToggleOff) return;
      setActiveEffects(activeEffects.filter(k => k !== effectKey));
    } else {
      setActiveEffects([...activeEffects, effectKey]);
    }
  };

  if (!effect) {
    return (
      <div className="effect-preview-panel__text-1">
        {lang === 'ja' ? 'エフェクトを選択' : 'SELECT AN EFFECT'}
      </div>
    );
  }

  return (
    <div className="effect-preview-panel__col-1">
      {/* Top bar: Active toggle */}
      <div className="effect-preview-panel__top-bar-active-toggle">
        {disableToggleOff && (
          <span className="effect-preview-panel__text-2">
            {lang === 'ja' ? '※最低1つ必要' : 'min. 1 required'}
          </span>
        )}
        {(!isChallenge || challengeOwned) && (
          <>
            <span className="effect-preview-panel__text-3">
              {lang === 'ja' ? 'アクティブ' : 'ACTIVE'}
            </span>
            <Toggle
              checked={isActive}
              disabled={isLocked || disableToggleOff}
              onChange={handleToggle}
              label={lang === 'ja' ? 'アクティブ' : 'ACTIVE'}
            />
          </>
        )}
      </div>

      {/* Demo area */}
      <div className="effect-preview-panel__demo-area">
        <DemoTaskItem
          ref={demoRef}
          lang={lang}
          onSmash={triggerDemo}
        />
      </div>

      {/* Bottom: challenge progress + description + optional CTA */}
      <div className="effect-preview-panel__bottom-challenge-progress-de">
        {isChallenge && withinDeadline && !challengeOwned && challengeThreshold > 0 && (
          <div>
            <div className="effect-preview-panel__row-1">
              <span className="effect-preview-panel__text-4">
                {lang === 'ja'
                  ? `タスクを${challengeThreshold}回完了で解放`
                  : `Complete ${challengeThreshold} tasks to unlock`}
              </span>
              <span className="effect-preview-panel__text-5">
                {challengeProgress} / {challengeThreshold}
              </span>
            </div>
            <div className="effect-preview-panel__pos-1">
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${Math.min(100, challengeThreshold > 0 ? (challengeProgress / challengeThreshold) * 100 : 0)}%`,
                background: '#ffd54f',
              }} />
            </div>
          </div>
        )}
        {/* Evolution progress (shown after challenge is earned) */}
        <EvolutionSection
          effectKey={effectKey}
          isPremium={isPremium}
          effectProgress={effectProgressMap[effectKey]}
          lang={lang}
        />
        <p className="effect-preview-panel__text-6">
          {effect.description[lang]}
        </p>
        {isLocked && effect.access === 'premium' && (
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="effect-preview-panel__text-7"
          >
            {lang === 'ja' ? 'PixDone+ にアップグレード' : 'UPGRADE TO PIXDONE+'}
          </button>
        )}
      </div>
    </div>
  );
}
