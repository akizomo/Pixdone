import { useMemo, useRef, useState, useEffect } from 'react';
import { EffectsTab } from './EffectsTab';
import { ThemesTab } from './ThemesTab';
import { EffectSheetContent } from './EffectSheetContent';
import { EffectPreviewPanel } from './EffectPreviewPanel';
import { ThemePreviewPanel } from './ThemePreviewPanel';
import { ThemeSheetContent } from './ThemeSheetContent';
import type { ThemeKey } from '../../design-system/themes/themeRegistry';
import type { EffectRarity } from '../../data/effectsRegistry';
import { EFFECTS_REGISTRY } from '../../data/effectsRegistry';
import { themeList } from '../../design-system/themes/themeRegistry';
import { playSound } from '../../services/sound';
import { BottomSheet } from '../../design-system';
import './CollectionPage.css';

type FilterKey = 'ALL' | EffectRarity | 'OWNED' | 'CHALLENGE';
const FILTERS: FilterKey[] = ['ALL', 'COMMON', 'RARE', 'EPIC', 'OWNED', 'CHALLENGE'];

interface CollectionPageProps {
  lang: 'en' | 'ja';
  isPremium: boolean;
  activeEffects: string[];
  setActiveEffects: (keys: string[]) => void;
  activeTheme: ThemeKey;
  changeTheme: (key: ThemeKey) => void;
  colorMode: 'light' | 'dark';
  initialTab?: 'effects' | 'themes';
  initialEffectKey?: string | null;
  ownedChallengeEffects?: string[];
  challengeProgressMap?: Record<string, number>;
  onRequestEffect?: () => void;
}

export function CollectionPage({
  lang,
  isPremium,
  activeEffects,
  setActiveEffects,
  activeTheme,
  changeTheme,
  colorMode,
  initialTab = 'effects',
  initialEffectKey = null,
  ownedChallengeEffects = [],
  challengeProgressMap = {},
  onRequestEffect,
}: CollectionPageProps) {
  const [activeTab, setActiveTab] = useState<'effects' | 'themes'>(initialTab);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(initialEffectKey);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const [desktopFilter, setDesktopFilter] = useState<FilterKey>('ALL');
  const [mobileFilter, setMobileFilter] = useState<FilterKey>('ALL');

  const desktopEffects = useMemo(() => {
    if (!isDesktop || activeTab !== 'effects') return [];
    if (desktopFilter === 'ALL') return EFFECTS_REGISTRY;
    if (desktopFilter === 'OWNED') return EFFECTS_REGISTRY.filter((e) => activeEffects.includes(e.key));
    if (desktopFilter === 'CHALLENGE') return EFFECTS_REGISTRY.filter((e) => e.access === 'challenge');
    return EFFECTS_REGISTRY.filter((e) => e.rarity === desktopFilter);
  }, [isDesktop, activeTab, desktopFilter, activeEffects]);

  // Desktop UX: when entering Effects/Themes, preselect the top item so the right panel isn't empty.
  useEffect(() => {
    if (!isDesktop) return;
    if (activeTab === 'effects') {
      const first = desktopEffects[0]?.key ?? null;
      if (!selectedEffect || (first && selectedEffect !== first && !desktopEffects.some((e) => e.key === selectedEffect))) {
        setSelectedEffect(first);
      }
      return;
    }
    if (activeTab === 'themes') {
      const firstTheme = (themeList[0]?.key as ThemeKey | undefined) ?? null;
      if (!selectedTheme) setSelectedTheme(firstTheme);
    }
  }, [isDesktop, activeTab, desktopEffects, selectedEffect, selectedTheme]);

  const mobileEffects = useMemo(() => {
    if (activeTab !== 'effects') return [];
    if (mobileFilter === 'ALL') return EFFECTS_REGISTRY;
    if (mobileFilter === 'OWNED') return EFFECTS_REGISTRY.filter((e) => activeEffects.includes(e.key));
    if (mobileFilter === 'CHALLENGE') return EFFECTS_REGISTRY.filter((e) => e.access === 'challenge');
    return EFFECTS_REGISTRY.filter((e) => e.rarity === mobileFilter);
  }, [activeTab, mobileFilter, activeEffects]);

  const selectedEffectIndex = useMemo(() => {
    if (!selectedEffect) return -1;
    return mobileEffects.findIndex((e) => e.key === selectedEffect);
  }, [mobileEffects, selectedEffect]);

  const goPrevEffect = () => {
    if (mobileEffects.length <= 1 || selectedEffectIndex < 0) return;
    playSound('buttonClick');
    const nextIdx = (selectedEffectIndex - 1 + mobileEffects.length) % mobileEffects.length;
    setSelectedEffect(mobileEffects[nextIdx]?.key ?? null);
  };

  const goNextEffect = () => {
    if (mobileEffects.length <= 1 || selectedEffectIndex < 0) return;
    playSound('buttonClick');
    const nextIdx = (selectedEffectIndex + 1) % mobileEffects.length;
    setSelectedEffect(mobileEffects[nextIdx]?.key ?? null);
  };

  // ── Theme navigation (mobile sheet) ────────────────────────────────────────
  const selectedThemeIndex = useMemo(() => {
    if (!selectedTheme) return -1;
    return themeList.findIndex(t => t.key === selectedTheme);
  }, [selectedTheme]);

  const goPrevTheme = () => {
    if (themeList.length <= 1 || selectedThemeIndex < 0) return;
    playSound('buttonClick');
    const nextIdx = (selectedThemeIndex - 1 + themeList.length) % themeList.length;
    setSelectedTheme(themeList[nextIdx]?.key as ThemeKey ?? null);
  };

  const goNextTheme = () => {
    if (themeList.length <= 1 || selectedThemeIndex < 0) return;
    playSound('buttonClick');
    const nextIdx = (selectedThemeIndex + 1) % themeList.length;
    setSelectedTheme(themeList[nextIdx]?.key as ThemeKey ?? null);
  };

  // Swipe navigation (within effect or theme sheet)
  const swipeStartRef = useRef<{ x: number; y: number; sheet: 'effect' | 'theme' } | null>(null);
  const onSwipeStart = (x: number, y: number, sheet: 'effect' | 'theme') => {
    swipeStartRef.current = { x, y, sheet };
  };
  const onSwipeEnd = (x: number, y: number) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.abs(dx) < 44) return;
    if (Math.abs(dy) > 48) return;
    if (start.sheet === 'effect') {
      if (dx > 0) goPrevEffect(); else goNextEffect();
    } else {
      if (dx > 0) goPrevTheme(); else goNextTheme();
    }
  };

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const tabBar = (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid var(--pd-color-border-default)',
      flexShrink: 0,
    }}>
      {(['effects', 'themes'] as const).map(tab => {
        const label = tab === 'effects'
          ? (lang === 'ja' ? 'エフェクト' : 'EFFECTS')
          : (lang === 'ja' ? 'テーマ' : 'THEMES');
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => { playSound('buttonClick'); setActiveTab(tab); }}
            style={{
              flex: 1,
              padding: '12px',
              fontFamily: 'var(--pd-font-brand)',
              fontSize: '0.75rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              borderBottom: `3px solid ${isActive ? 'var(--pd-color-accent-default)' : 'transparent'}`,
              color: isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-secondary)',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: '-2px',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  // ── Desktop: split layout ──────────────────────────────────────────────────
  // Height: viewport minus app header (~80px) + main paddingBottom (48px) + buffer
  // Tabs and filter chips are fixed (flexShrink:0); only the left list scrolls.
  if (isDesktop) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - 160px)',
        minHeight: '400px',
        overflow: 'hidden',
      }}>
        {/* Tab bar — fixed, never scrolls */}
        {tabBar}

        {/* Filter chips — fixed, effects tab only */}
        {activeTab === 'effects' && (
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '8px 10px',
            overflowX: 'auto',
            borderBottom: '1px solid var(--pd-color-border-default)',
            scrollbarWidth: 'none',
            flexShrink: 0,
            background: 'var(--pd-color-background-elevated)',
          }}>
            {FILTERS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => { playSound('buttonClick'); setDesktopFilter(f); }}
                style={{
                  padding: '3px 8px',
                  fontFamily: 'var(--pd-font-brand)',
                  fontSize: '0.5625rem',
                  letterSpacing: '1px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  background: desktopFilter === f
                    ? 'var(--pd-color-accent-default)'
                    : 'var(--pd-color-background-elevated)',
                  color: desktopFilter === f
                    ? 'var(--pd-color-background-default)'
                    : 'var(--pd-color-text-secondary)',
                  border: `1px solid ${desktopFilter === f ? 'var(--pd-color-accent-default)' : 'var(--pd-color-border-default)'}`,
                  borderRadius: 0,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Split: left list (scrollable) + right preview (viewport-constrained) */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left panel — only this scrolls */}
          <div style={{
            width: '180px',
            flexShrink: 0,
            borderRight: '1px solid var(--pd-color-border-default)',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
          }}>
            {activeTab === 'effects' ? (
              <EffectsTab
                isPremium={isPremium}
                activeEffects={activeEffects}
                ownedChallengeEffects={ownedChallengeEffects}
                lang={lang}
                onSelect={setSelectedEffect}
                selectedEffect={selectedEffect}
                isDesktop
                activeFilter={desktopFilter}
                onRequestEffect={onRequestEffect}
              />
            ) : (
              <ThemesTab
                activeTheme={activeTheme}
                isPremium={isPremium}
                colorMode={colorMode}
                onSelect={setSelectedTheme}
                selectedTheme={selectedTheme}
                isDesktop
              />
            )}
          </div>

          {/* Right panel — viewport-constrained, no scroll */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'effects' && selectedEffect ? (
              <EffectPreviewPanel
                key={selectedEffect}
                effectKey={selectedEffect}
                isPremium={isPremium}
                activeEffects={activeEffects}
                setActiveEffects={setActiveEffects}
                ownedChallengeEffects={ownedChallengeEffects}
                challengeProgressMap={challengeProgressMap}
                lang={lang}
              />
            ) : activeTab === 'themes' && selectedTheme ? (
              <ThemePreviewPanel
                key={selectedTheme}
                themeKey={selectedTheme}
                activeTheme={activeTheme}
                isPremium={isPremium}
                colorMode={colorMode}
                changeTheme={changeTheme}
                lang={lang}
                isDesktop
              />
            ) : (
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
                {activeTab === 'effects'
                  ? (lang === 'ja' ? 'エフェクトを選択' : 'SELECT AN EFFECT')
                  : (lang === 'ja' ? 'テーマを選択' : 'SELECT A THEME')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Mobile: tab + full-screen overlays ────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {tabBar}

      <div>
        {activeTab === 'effects' ? (
          <EffectsTab
            isPremium={isPremium}
            activeEffects={activeEffects}
            ownedChallengeEffects={ownedChallengeEffects}
            lang={lang}
            onSelect={setSelectedEffect}
            onFilterChange={(f) => {
              setMobileFilter(f);
              // If current selection disappears due to filter change, close sheet.
              if (selectedEffect && f !== 'ALL') {
                const nextList = f === 'OWNED'
                  ? EFFECTS_REGISTRY.filter((e) => activeEffects.includes(e.key))
                  : f === 'CHALLENGE'
                    ? EFFECTS_REGISTRY.filter((e) => e.access === 'challenge')
                    : EFFECTS_REGISTRY.filter((e) => e.rarity === f);
                if (!nextList.some((e) => e.key === selectedEffect)) {
                  setSelectedEffect(null);
                }
              }
            }}
            onRequestEffect={onRequestEffect}
          />
        ) : (
          <ThemesTab
            activeTheme={activeTheme}
            isPremium={isPremium}
            colorMode={colorMode}
            onSelect={setSelectedTheme}
          />
        )}
      </div>

      <BottomSheet
        open={!!selectedEffect && activeTab === 'effects'}
        onClose={() => setSelectedEffect(null)}
        title={lang === 'ja' ? 'エフェクトギャラリー' : 'Effects Gallery'}
        className="pxd-sheet--effect-gallery"
      >
        <div
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (!t) return;
            onSwipeStart(t.clientX, t.clientY, 'effect');
          }}
          onTouchEnd={(e) => {
            const t = e.changedTouches[0];
            if (!t) return;
            onSwipeEnd(t.clientX, t.clientY);
          }}
        >
          {selectedEffect && (
            <div style={{ flex: 1, minHeight: 0 }}>
              <EffectSheetContent
                key={selectedEffect}
                effectKey={selectedEffect}
                isPremium={isPremium}
                activeEffects={activeEffects}
                setActiveEffects={setActiveEffects}
                ownedChallengeEffects={ownedChallengeEffects}
                challengeProgressMap={challengeProgressMap}
                lang={lang}
                indexLabel={selectedEffectIndex >= 0 ? `${selectedEffectIndex + 1}/${mobileEffects.length}` : ''}
                onPrev={goPrevEffect}
                onNext={goNextEffect}
                canPrevNext={mobileEffects.length > 1 && selectedEffectIndex >= 0}
              />
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        open={!!selectedTheme && activeTab === 'themes'}
        onClose={() => setSelectedTheme(null)}
        title={lang === 'ja' ? 'テーマギャラリー' : 'Themes Gallery'}
        className="pxd-sheet--effect-gallery"
      >
        <div
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (!t) return;
            onSwipeStart(t.clientX, t.clientY, 'theme');
          }}
          onTouchEnd={(e) => {
            const t = e.changedTouches[0];
            if (!t) return;
            onSwipeEnd(t.clientX, t.clientY);
          }}
        >
          {selectedTheme && (
            <div style={{ flex: 1, minHeight: 0 }}>
              <ThemeSheetContent
                key={selectedTheme}
                themeKey={selectedTheme}
                activeTheme={activeTheme}
                isPremium={isPremium}
                colorMode={colorMode}
                changeTheme={changeTheme}
                lang={lang}
                onClose={() => setSelectedTheme(null)}
                indexLabel={selectedThemeIndex >= 0 ? `${selectedThemeIndex + 1}/${themeList.length}` : ''}
                onPrev={goPrevTheme}
                onNext={goNextTheme}
                canPrevNext={themeList.length > 1 && selectedThemeIndex >= 0}
              />
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

// (intentionally removed) themesTitlePrefix was unused
