import { useState, useMemo } from 'react';
import { PixelIcon } from '../../design-system';
import { EFFECTS_REGISTRY } from '../../data/effectsRegistry';
import type { EffectRarity } from '../../data/effectsRegistry';
import { isEffectLocked } from '../../data/effectsRegistry';
import { EffectCard } from './EffectCard';
import { playSound } from '../../services/sound';
import { badgeColor } from './rarityColors';
import type { EffectProgressEntry } from '../../hooks/useEffectProgress';
import './EffectsTab.css';

type FilterKey = 'ALL' | EffectRarity | 'OWNED' | 'CHALLENGE';

interface EffectsTabProps {
  isPremium: boolean;
  activeEffects: string[];
  ownedChallengeEffects?: string[];
  effectProgressMap?: Record<string, EffectProgressEntry>;
  lang: 'en' | 'ja';
  onSelect: (effectKey: string) => void;
  /** Desktop only: which effect is currently selected in the right panel */
  selectedEffect?: string | null;
  /** When true: renders a flat list (no filter pills, no grid) for desktop split layout */
  isDesktop?: boolean;
  /** Desktop only: controlled filter state from parent */
  activeFilter?: FilterKey;
  /** Mobile only: allow CollectionPage to control filter (for sheet nav) */
  onFilterChange?: (next: FilterKey) => void;
}

const FILTERS: FilterKey[] = ['ALL', 'COMMON', 'RARE', 'EPIC', 'OWNED', 'CHALLENGE'];

export function EffectsTab({
  isPremium, activeEffects, ownedChallengeEffects = [], lang, onSelect,
  selectedEffect, isDesktop = false, activeFilter: activeFilterProp,
  onFilterChange,
}: EffectsTabProps) {
  const [localFilter, setLocalFilter] = useState<FilterKey>('ALL');
  const activeFilter = isDesktop && activeFilterProp !== undefined ? activeFilterProp : localFilter;

  const filtered = useMemo(() => {
    if (activeFilter === 'ALL') return EFFECTS_REGISTRY;
    if (activeFilter === 'OWNED') return EFFECTS_REGISTRY.filter(e => activeEffects.includes(e.key));
    if (activeFilter === 'CHALLENGE') return EFFECTS_REGISTRY.filter(e => e.access === 'challenge');
    return EFFECTS_REGISTRY.filter(e => e.rarity === activeFilter);
  }, [activeFilter, activeEffects]);

  // Desktop: flat list only (no filter pills — parent renders those)
  if (isDesktop) {
    return (
      <div className="effects-tab__box-1">
        {filtered.length === 0 ? (
          <p className="effects-tab__text-1">
            {lang === 'ja' ? 'もうすぐ登場！' : 'COMING SOON'}
          </p>
        ) : (
          <>
            {filtered.map(effect => {
              const isSelected = selectedEffect === effect.key;
              const locked = isEffectLocked(effect, isPremium, ownedChallengeEffects);
              return (
                <button
                  key={effect.key}
                  type="button"
                  onClick={() => { playSound('buttonClick'); onSelect(effect.key); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: isSelected ? 'var(--pd-color-accent-subtle)' : 'none',
                    border: 'none',
                    borderLeft: `3px solid ${isSelected ? 'var(--pd-color-accent-default)' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                >
                  <div className="effects-tab__box-2">
                    <div style={{
                      fontFamily: 'var(--pd-font-brand)',
                      fontSize: 'var(--pd-font-size-sm)',
                      letterSpacing: '0.5px',
                      color: isSelected ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      {effect.name}
                    </div>
                    <div style={{
                      fontSize: 'var(--pd-font-size-sm)',
                      fontFamily: 'var(--pd-font-brand)',
                      letterSpacing: '1px',
                      color: badgeColor(effect.rarity, effect.access === 'challenge'),
                      marginTop: '1px',
                    }}>
                      {effect.access === 'challenge' ? 'CHALLENGE' : effect.rarity}
                    </div>
                  </div>
                  <div className="effects-tab__row-1">
                    {activeEffects.includes(effect.key) && !locked && (
                      <PixelIcon name="check" size="0.875rem" style={{ color: 'var(--pd-color-text-primary)' }} />
                    )}
                    {locked && <span className="effects-tab__text-2">🔒</span>}
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    );
  }

  // Mobile: filter pills + 2-column card grid
  return (
    <div>
      {/* Filter bar */}
      <div className="effects-tab__filter-bar">
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => {
              playSound('buttonClick');
              setLocalFilter(f);
              onFilterChange?.(f);
            }}
            style={{
              padding: '4px 10px',
              fontFamily: 'var(--pd-font-brand)',
              fontSize: 'var(--pd-font-size-sm)',
              letterSpacing: '1px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              background: localFilter === f
                ? 'var(--pd-color-accent-default)'
                : 'var(--pd-color-background-elevated)',
              color: localFilter === f
                ? 'var(--pd-color-background-default)'
                : 'var(--pd-color-text-secondary)',
              border: `2px solid ${localFilter === f ? 'var(--pd-color-accent-default)' : 'var(--pd-color-border-default)'}`,
              borderRadius: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="effects-tab__grid">
        {filtered.length === 0 ? (
          <p className="effects-tab__text-3">
            {lang === 'ja' ? 'もうすぐ登場！' : 'COMING SOON'}
          </p>
        ) : (
          <div className="effects-tab__box-3">
            {filtered.map(effect => (
              <EffectCard
                key={effect.key}
                effect={effect}
                isEquipped={activeEffects.includes(effect.key)}
                isPremium={isPremium}
                ownedChallengeEffects={ownedChallengeEffects}
                onClick={() => { playSound('buttonClick'); onSelect(effect.key); }}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
