import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoTaskItem } from './DemoTaskItem';
import { EFFECTS_REGISTRY, isEffectLocked, canDeactivateEffect } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { Toggle } from '../../design-system';
import { badgeColor } from './rarityColors';

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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--pd-color-background-default)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--pd-color-border-default)',
        gap: '10px',
        flexShrink: 0,
      }}>
        <button type="button" onClick={onClose} aria-label={lang === 'ja' ? '戻る' : 'Back'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--pd-color-text-primary)', flexShrink: 0 }}>
          <span className="material-icons" style={{ fontSize: '24px' }}>arrow_back</span>
        </button>
        <span style={{ fontFamily: 'var(--pd-font-brand)', fontSize: '0.875rem', letterSpacing: '1px', color: 'var(--pd-color-text-primary)', flex: 1, minWidth: 0 }}>
          {effect.name.toUpperCase()}
        </span>
        <span style={{
          fontSize: '0.625rem', fontFamily: 'var(--pd-font-brand)', letterSpacing: '1px',
          color: badgeColor(effect.rarity, isChallenge),
          flexShrink: 0,
        }}>
          {isChallenge ? 'CHALLENGE' : effect.rarity}
        </span>
        {/* Toggle (shown only once challenge is earned, or for non-challenge effects) */}
        {(!isChallenge || challengeOwned) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--pd-font-brand)', fontSize: '0.625rem', letterSpacing: '1px', color: 'var(--pd-color-text-secondary)' }}>
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

      {/* Demo area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <DemoTaskItem
          ref={demoRef}
          lang={lang}
          onSmash={triggerDemo}
        />
      </div>

      {/* Info */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--pd-color-border-default)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flexShrink: 0,
      }}>
        {disableToggleOff && (
          <p style={{ margin: 0, fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)' }}>
            {lang === 'ja'
              ? '各レアリティで最低1つのエフェクトをアクティブにする必要があります。'
              : 'At least one effect per rarity must remain active.'}
          </p>
        )}

        {/* Challenge progress bar (active period, not yet earned) */}
        {isChallenge && withinDeadline && !challengeOwned && challengeThreshold > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', color: 'var(--pd-color-text-primary)' }}>
                {lang === 'ja'
                  ? `タスクを${challengeThreshold}回完了で解放`
                  : `Complete ${challengeThreshold} tasks to unlock`}
              </span>
              <span style={{
                fontFamily: 'var(--pd-font-body)',
                fontSize: '0.8125rem',
                color: 'var(--pd-color-text-secondary)',
                alignSelf: 'center',
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {challengeProgress} / {challengeThreshold}
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--pd-color-border-default)', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${Math.min(100, challengeThreshold > 0 ? (challengeProgress / challengeThreshold) * 100 : 0)}%`,
                background: '#ffd54f',
                transition: 'width 0.3s',
              }} />
            </div>
            {effect.challengeDeadline && (
              <p style={{ margin: '6px 0 0', fontFamily: 'var(--pd-font-body)', fontSize: '0.75rem', color: 'var(--pd-color-text-secondary)' }}>
                {lang === 'ja'
                  ? `期限: ${effect.challengeDeadline.toLocaleDateString('ja-JP')}`
                  : `Deadline: ${effect.challengeDeadline.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`}
              </p>
            )}
          </div>
        )}

        <p style={{ margin: 0, fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem', color: 'var(--pd-color-text-secondary)', lineHeight: 1.5 }}>
          {effect.description[lang]}
        </p>
        {isLocked && effect.access === 'premium' && (
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            style={{
              padding: '12px',
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.875rem',
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
