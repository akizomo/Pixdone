import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoTaskItem } from './DemoTaskItem';
import { EFFECTS_REGISTRY, isEffectLocked, canDeactivateEffect } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { Toggle } from '../../design-system';
import { EvolutionSection } from './EvolutionSection';
import { resolveAnimationKey } from '../../data/effectEvolution';
import type { EffectProgressEntry } from '../../hooks/useEffectProgress';

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
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--pd-color-text-secondary)',
        fontFamily: 'var(--pd-font-brand)',
        fontSize: '0.75rem',
        letterSpacing: '1px',
      }}>
        {lang === 'ja' ? 'エフェクトを選択' : 'SELECT AN EFFECT'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar: Active toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '10px 16px',
        gap: '8px',
        flexShrink: 0,
      }}>
        {disableToggleOff && (
          <span style={{
            fontFamily: 'var(--pd-font-body)',
            fontSize: '0.6875rem',
            color: 'var(--pd-color-text-secondary)',
          }}>
            {lang === 'ja' ? '※最低1つ必要' : 'min. 1 required'}
          </span>
        )}
        {(!isChallenge || challengeOwned) && (
          <>
            <span style={{
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.6875rem',
              letterSpacing: '1px',
              color: 'var(--pd-color-text-secondary)',
            }}>
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
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 24px',
      }}>
        <DemoTaskItem
          ref={demoRef}
          lang={lang}
          onSmash={triggerDemo}
        />
      </div>

      {/* Bottom: challenge progress + description + optional CTA */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--pd-color-border-default)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flexShrink: 0,
        background: 'var(--pd-color-background-default)',
      }}>
        {isChallenge && withinDeadline && !challengeOwned && challengeThreshold > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', color: 'var(--pd-color-text-primary)' }}>
                {lang === 'ja'
                  ? `タスクを${challengeThreshold}回完了で解放`
                  : `Complete ${challengeThreshold} tasks to unlock`}
              </span>
              <span style={{
                fontFamily: 'var(--pd-font-body)',
                fontSize: '0.8125rem',
                color: 'var(--pd-color-text-secondary)',
                flexShrink: 0,
                alignSelf: 'center',
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {challengeProgress} / {challengeThreshold}
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--pd-color-border-default)', position: 'relative' }}>
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
        <p style={{
          margin: 0,
          fontFamily: 'var(--pd-font-body)',
          fontSize: '0.8125rem',
          color: 'var(--pd-color-text-secondary)',
          lineHeight: 1.5,
        }}>
          {effect.description[lang]}
        </p>
        {isLocked && effect.access === 'premium' && (
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            style={{
              padding: '10px 12px',
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.75rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              background: 'var(--pd-color-background-elevated)',
              color: 'var(--pd-color-text-primary)',
              border: '1px solid var(--pd-color-border-default)',
            }}
          >
            {lang === 'ja' ? 'PixDone+ にアップグレード' : 'UPGRADE TO PIXDONE+'}
          </button>
        )}
      </div>
    </div>
  );
}
