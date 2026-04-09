import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoTaskItem } from './DemoTaskItem';
import { EFFECTS_REGISTRY, isEffectLocked, canDeactivateEffect } from '../../data/effectsRegistry';
import { playDemoEffect } from '../../services/taskAnimations';
import { Toggle } from '../../design-system';
import { playSound } from '../../services/sound';
import { badgeColor } from './rarityColors';

interface EffectSheetContentProps {
  effectKey: string;
  isPremium: boolean;
  activeEffects: string[];
  setActiveEffects: (keys: string[]) => void;
  ownedChallengeEffects?: string[];
  challengeProgressMap?: Record<string, number>;
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

  const triggerDemo = useCallback(() => {
    if (!demoRef.current) return;
    playDemoEffect(effectKey, demoRef.current);
  }, [effectKey]);

  const handleToggle = () => {
    if (isActive) {
      if (disableToggleOff) return;
      setActiveEffects(activeEffects.filter(k => k !== effectKey));
    } else {
      setActiveEffects([...activeEffects, effectKey]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Preview (maximize vertical space) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 16px',
          minHeight: 0,
        }}>
          <DemoTaskItem
            ref={demoRef}
            lang={lang}
            onSmash={triggerDemo}
          />
        </div>

        {/* Preview bottom: arrows + index */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '10px 12px',
        }}>
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrevNext}
            style={{
              width: '44px', height: '36px', borderRadius: 0,
              border: '2px solid var(--pd-color-border-default)',
              background: 'var(--pd-color-background-elevated)',
              color: 'var(--pd-color-text-primary)',
              cursor: 'pointer', fontFamily: 'var(--pd-font-brand)', fontSize: '0.875rem',
              opacity: canPrevNext ? 1 : 0.5,
            }}
            aria-label={lang === 'ja' ? '前のエフェクト' : 'Previous effect'}
          >
            {'<'}
          </button>

          <div style={{
            flex: 1, minWidth: 0, textAlign: 'center',
            fontFamily: 'var(--pd-font-brand)', fontSize: '0.6875rem',
            letterSpacing: '1px', color: 'var(--pd-color-text-secondary)',
          }}>
            {indexLabel}
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={!canPrevNext}
            style={{
              width: '44px', height: '36px', borderRadius: 0,
              border: '2px solid var(--pd-color-border-default)',
              background: 'var(--pd-color-background-elevated)',
              color: 'var(--pd-color-text-primary)',
              cursor: 'pointer', fontFamily: 'var(--pd-font-brand)', fontSize: '0.875rem',
              opacity: canPrevNext ? 1 : 0.5,
            }}
            aria-label={lang === 'ja' ? '次のエフェクト' : 'Next effect'}
          >
            {'>'}
          </button>
        </div>
      </div>

      {/* Bottom dock */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--pd-color-background-default)',
        borderTop: '2px solid var(--pd-color-border-default)',
      }}>
        {/* Title + toggle */}
        <div style={{
          padding: '8px 12px 2px',
          background: 'var(--pd-color-background-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        }}>
          <div style={{
            fontFamily: 'var(--pd-font-brand)', fontSize: '1.125rem',
            letterSpacing: '1px', color: 'var(--pd-color-text-primary)',
            lineHeight: 1.2, minWidth: 0,
          }}>
            {(effect?.name ?? '').toUpperCase()}
          </div>
          {/* Toggle: shown when not a pending challenge */}
          {(!isChallenge || challengeOwned) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--pd-font-brand)', fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--pd-color-text-secondary)' }}>
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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', padding: '0 12px 6px',
          background: 'var(--pd-color-background-default)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{
              fontSize: '0.625rem', fontFamily: 'var(--pd-font-brand)', letterSpacing: '1px',
              color: effect ? badgeColor(effect.rarity, isChallenge) : 'var(--pd-color-text-secondary)',
              flexShrink: 0,
            }}>
              {isChallenge ? 'CHALLENGE' : (effect?.rarity ?? '')}
            </span>
            {isLocked && (
              <span style={{ fontSize: '0.75rem', flexShrink: 0 }} aria-label={lang === 'ja' ? 'ロック中' : 'Locked'}>
                🔒
              </span>
            )}
          </div>
          {disableToggleOff && (
            <span style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.6875rem', color: 'var(--pd-color-text-secondary)', textAlign: 'right' }}>
              {lang === 'ja' ? '※最低1つ必要' : 'min. 1 required'}
            </span>
          )}
        </div>

        <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Challenge progress bar */}
          {isChallenge && withinDeadline && !challengeOwned && challengeThreshold > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.75rem', color: 'var(--pd-color-text-primary)' }}>
                  {lang === 'ja'
                    ? `タスクを${challengeThreshold}回完了で解放`
                    : `Complete ${challengeThreshold} tasks to unlock`}
                </span>
                <span style={{
                  fontFamily: 'var(--pd-font-body)',
                  fontSize: '0.75rem',
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

          {/* Description */}
          <p style={{
            margin: 0, fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
            color: 'var(--pd-color-text-secondary)', lineHeight: 1.5,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical' as unknown as 'vertical',
            WebkitLineClamp: 2, overflow: 'hidden', minHeight: '2.45rem',
          }}>
            {effect ? effect.description[lang] : ''}
          </p>

          {/* Lock CTA area */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            minHeight: '96px', justifyContent: 'flex-start',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '10px', minHeight: '20px',
              visibility: isLocked && effect?.access === 'premium' ? 'visible' : 'hidden',
            }}>
              <span style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.75rem', color: 'var(--pd-color-text-secondary)', lineHeight: 1.4 }}>
                {lang === 'ja' ? 'PixDone+ が必要' : 'Requires PixDone+'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => { playSound('buttonClick'); navigate('/pricing'); }}
              style={{
                width: '100%', padding: '10px 12px',
                fontFamily: 'var(--pd-font-brand)', fontSize: '0.75rem', letterSpacing: '1px',
                cursor: isLocked && effect?.access === 'premium' ? 'pointer' : 'default',
                background: 'var(--pd-color-background-elevated)',
                color: 'var(--pd-color-text-primary)',
                border: '2px solid var(--pd-color-border-default)', borderRadius: 0,
                opacity: isLocked && effect?.access === 'premium' ? 1 : 0,
                pointerEvents: isLocked && effect?.access === 'premium' ? 'auto' : 'none',
              }}
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
