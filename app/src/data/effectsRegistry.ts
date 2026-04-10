import type { ThemeKey } from '../design-system/themes/themeRegistry';

export type EffectRarity = 'COMMON' | 'RARE' | 'EPIC';
export type EffectAccess = 'free_unlocked' | 'challenge' | 'premium';

export interface EffectDef {
  key: string;
  name: string;
  rarity: EffectRarity;
  /** 'all' = shared across all themes; ThemeKey[] = theme-specific */
  themes: ThemeKey[] | 'all';
  /** Access control — independent of rarity */
  access: EffectAccess;
  description: { en: string; ja: string };
  evolutionStages: 1 | 2;
  evolutionCondition: string | null;
  evolutionThreshold: number | null;
  /** Set only for challenge effects: when the challenge period expires */
  challengeDeadline: Date | null;
  /** Set only for challenge effects: total task completions needed to unlock */
  challengeUnlockThreshold: number | null;
}

export const EFFECTS_REGISTRY: EffectDef[] = [
  // ── COMMON — free, all themes ─────────────────────────────────────────────
  { key: 'explode',    name: 'Explode',     rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Burst into pixel confetti.',        ja: 'ピクセル紙吹雪が弾ける。'         }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'flyAway',    name: 'Fly Away',    rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Task takes off into the sky.',       ja: 'タスクが空へ飛んでいく。'         }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'vanish',     name: 'Vanish',      rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Disappears in a puff of smoke.',     ja: '煙とともに消える。'               }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'melt',       name: 'Melt',        rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Melts away like it never existed.',  ja: '溶けて、なかったことに。'         }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'bounce',     name: 'Bounce',      rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Bounces off the screen.',             ja: '画面の外へ跳ねていく。'           }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'slideLeft',  name: 'Slide Left',  rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Slides off to the left.',             ja: '左へスライドして消える。'         }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'slideRight', name: 'Slide Right', rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Slides off to the right.',            ja: '右へスライドして消える。'         }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'flip',       name: 'Flip',        rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Flips out of existence.',             ja: 'くるっと反転して消える。'         }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'shrink',     name: 'Shrink',      rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Shrinks down to nothing.',            ja: '小さく縮んで消える。'             }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'stretch',    name: 'Stretch',     rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Stretches into the distance.',        ja: '伸びて遠ざかっていく。'           }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'wobble',     name: 'Wobble',      rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Wobbles wildly before vanishing.',    ja: 'ぐらぐら揺れて消える。'           }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'fadeOut',    name: 'Fade Out',    rarity: 'COMMON', themes: 'all', access: 'free_unlocked', description: { en: 'Fades gracefully into the void.',     ja: 'ふわっとフェードして消える。'     }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },

  // ── RARE — Arcade + Forestbit (premium) ──────────────────────────────────
  { key: 'shatter',      name: 'Shatter',       rarity: 'RARE', themes: ['arcade', 'forestbit'], access: 'premium', description: { en: 'Shatters into a thousand pieces.',            ja: '粉々に砕け散る。'               }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'spinOff',      name: 'Spin Off',      rarity: 'RARE', themes: ['arcade', 'forestbit'], access: 'premium', description: { en: 'Spins off the screen at full speed.',          ja: '高速スピンで画面外へ。'         }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'crumpleThrow', name: 'Crumple Throw', rarity: 'RARE', themes: ['arcade', 'forestbit'], access: 'premium', description: { en: 'Crumples up like paper and gets tossed.',     ja: 'くしゃっと丸めて投げ捨て。'   }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },

  // ── RARE — Arcade: CHALLENGE ──────────────────────────────────────────────
  { key: 'punch', name: 'Fighter Kick', rarity: 'RARE', themes: ['arcade'], access: 'challenge', description: { en: "A fighter's kick sends it flying.", ja: 'ファイターのキックで吹き飛ぶ。' }, evolutionStages: 2, evolutionCondition: 'cumulative_completions_50', evolutionThreshold: 50, challengeDeadline: new Date('2026-05-31T23:59:59+09:00'), challengeUnlockThreshold: 20 },

  // ── RARE — Synthwave (premium) ────────────────────────────────────────────
  { key: 'glitchSlide', name: 'Glitch Slide', rarity: 'RARE', themes: ['synthwave'], access: 'premium', description: { en: 'Glitches out with neon artifacts.', ja: 'ネオンのノイズでグリッチ。' }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'neonWarp',    name: 'Neon Warp',    rarity: 'RARE', themes: ['synthwave'], access: 'premium', description: { en: 'Warps through a neon portal.',       ja: 'ネオンポータルでワープ。'     }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'scanDrone',   name: 'Scan Drone',   rarity: 'RARE', themes: ['synthwave'], access: 'premium', description: { en: 'A drone scans and pixelates the task.', ja: 'ドローンがスキャンしてピクセル分解。' }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },

  // ── RARE — Forest Bit (premium) ───────────────────────────────────────────
  { key: 'leafScatter',  name: 'Leaf Scatter',  rarity: 'RARE', themes: ['forestbit'], access: 'premium', description: { en: 'A gust of leaves scatters across the screen.', ja: '葉っぱが舞い散る。'           }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'butterflyFly', name: 'Butterfly Fly', rarity: 'RARE', themes: ['forestbit'], access: 'premium', description: { en: 'Butterflies flutter and carry it away.',         ja: '蝶がひらひら運んでいく。'   }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'fireflyBurst', name: 'Firefly Burst', rarity: 'RARE', themes: ['forestbit'], access: 'premium', description: { en: 'Fireflies burst in a warm night glow.',          ja: 'ホタルの光がふわっと弾ける。' }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },

  // ── EPIC — Arcade + Forestbit (premium) ──────────────────────────────────
  { key: 'rainbowSmash', name: 'Rainbow Smash', rarity: 'EPIC', themes: ['arcade', 'forestbit'], access: 'premium', description: { en: 'Explodes in a full rainbow of pixel glory.',          ja: '虹色のピクセル大爆発。'           }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'freeze',       name: 'Freeze',        rarity: 'EPIC', themes: ['arcade', 'forestbit'], access: 'premium', description: { en: 'Time freezes. The task crystallizes and shatters.',  ja: '時間が止まり、結晶化して砕ける。' }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'bomb',         name: 'Bomb',          rarity: 'EPIC', themes: ['arcade'],             access: 'premium', description: { en: 'Countdown… then a huge pixel blast.',                ja: 'カウントダウン…そして大爆発。'   }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },

  // ── EPIC — Forest Bit (premium) ───────────────────────────────────────────
  { key: 'giantTreeGrow', name: 'Giant Tree Grow', rarity: 'EPIC', themes: ['forestbit'], access: 'premium', description: { en: 'A giant tree grows and takes over the world.', ja: '巨大な木が育ち、世界を覆う。'   }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
  { key: 'owlBlink',      name: 'Owl Blink',       rarity: 'EPIC', themes: ['forestbit'], access: 'premium', description: { en: 'A mysterious owl appears… blink.',          ja: '謎のフクロウが現れて…まばたき。' }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },

  // ── EPIC — Synthwave (premium) ────────────────────────────────────────────
  { key: 'neonBigBang', name: 'Neon Big Bang', rarity: 'EPIC', themes: ['synthwave'], access: 'premium', description: { en: 'A neon supernova consumes the task.', ja: 'ネオンの超新星が飲み込む。' }, evolutionStages: 1, evolutionCondition: null, evolutionThreshold: null, challengeDeadline: null, challengeUnlockThreshold: null },
];

/** Fallback effect key when the draw pool is empty */
export const FALLBACK_EFFECT_KEY = 'explode';

/** All free_unlocked effects (available to every user) */
export const COMMON_EFFECTS = EFFECTS_REGISTRY.filter(ef => ef.access === 'free_unlocked');

// ── Access helpers ────────────────────────────────────────────────────────────

/**
 * Returns true if the effect is inaccessible (should show lock icon).
 *
 * - free_unlocked: never locked
 * - premium: locked unless isPremium
 * - challenge (active): locked until earned via challenge progress
 * - challenge (expired): locked unless isPremium or already owned
 */
export function isEffectLocked(
  effect: EffectDef,
  isPremium: boolean,
  ownedChallengeEffects: string[] = [],
): boolean {
  if (effect.access === 'free_unlocked') return false;
  if (effect.access === 'premium') return !isPremium;
  if (effect.access === 'challenge') {
    if (ownedChallengeEffects.includes(effect.key)) return false;
    const withinDeadline =
      !effect.challengeDeadline || Date.now() <= effect.challengeDeadline.getTime();
    if (withinDeadline) return true; // active challenge — not yet earned
    return !isPremium; // expired — locked unless premium
  }
  return false;
}

/**
 * Returns true if the user can toggle OFF this effect.
 * At least one effect per rarity tier must remain active.
 */
export function canDeactivateEffect(
  key: string,
  activeEffects: string[],
  isPremium: boolean,
  ownedChallengeEffects: string[] = [],
): boolean {
  const effect = EFFECTS_REGISTRY.find(ef => ef.key === key);
  if (!effect) return true;
  const { rarity } = effect;
  const accessibleOfRarity = EFFECTS_REGISTRY.filter(
    ef => ef.rarity === rarity && !isEffectLocked(ef, isPremium, ownedChallengeEffects),
  );
  if (accessibleOfRarity.length === 0) return true;
  const activeOfRarity = activeEffects.filter(
    k => EFFECTS_REGISTRY.find(ef => ef.key === k)?.rarity === rarity,
  );
  return activeOfRarity.length > 1;
}

// ── Draw pool ─────────────────────────────────────────────────────────────────

/**
 * Build the eligible effect draw pool for a given user.
 *
 * - free_unlocked + theme match → always included (if activated)
 * - premium + theme match + isPremium → included (if activated)
 * - challenge + within deadline + owned → included (if activated)
 * - Falls back to all free_unlocked 'all'-theme effects if pool is empty
 */
export function buildDrawPool(
  isPremium: boolean,
  activeThemeKey: ThemeKey,
  activatedKeys: string[],
  ownedChallengeEffects: string[] = [],
): EffectDef[] {
  const now = Date.now();

  const pool = activatedKeys
    .map(key => EFFECTS_REGISTRY.find(ef => ef.key === key))
    .filter((ef): ef is EffectDef => ef !== undefined)
    .filter(ef => {
      const themeOk =
        ef.themes === 'all' || (ef.themes as ThemeKey[]).includes(activeThemeKey);
      if (!themeOk) return false;

      if (ef.access === 'free_unlocked') return true;
      if (ef.access === 'premium') return isPremium;
      if (ef.access === 'challenge') {
        const withinDeadline =
          !ef.challengeDeadline || now <= ef.challengeDeadline.getTime();
        return withinDeadline && ownedChallengeEffects.includes(ef.key);
      }
      return false;
    });

  if (pool.length === 0) {
    return EFFECTS_REGISTRY.filter(ef => ef.access === 'free_unlocked' && ef.themes === 'all');
  }
  return pool;
}

/**
 * Weighted random selection from a draw pool.
 * Weights: COMMON = 85, RARE = 12, EPIC = 3
 */
export function weightedRandomEffect(pool: EffectDef[]): EffectDef {
  const WEIGHTS: Record<EffectRarity, number> = { COMMON: 85, RARE: 12, EPIC: 3 };
  const totalWeight = pool.reduce((sum, ef) => sum + (WEIGHTS[ef.rarity] ?? 1), 0);
  let rand = Math.random() * totalWeight;
  for (const ef of pool) {
    rand -= WEIGHTS[ef.rarity] ?? 1;
    if (rand <= 0) return ef;
  }
  return pool[pool.length - 1] ?? pool[0];
}

// ── Tutorial draw pool ───────────────────────────────────────────────────────

/**
 * Build a special draw pool for tutorial (unauthenticated) users.
 * Includes ALL effects compatible with the active theme, regardless of
 * access level, with boosted weights for Rare/Epic so visitors experience
 * the "wow" effects they saw on SNS.
 */
export function buildTutorialDrawPool(activeThemeKey: ThemeKey): EffectDef[] {
  return EFFECTS_REGISTRY.filter(ef => {
    // Skip challenge effects — they require server state
    if (ef.access === 'challenge') return false;
    const themeOk =
      ef.themes === 'all' || (ef.themes as ThemeKey[]).includes(activeThemeKey);
    return themeOk;
  });
}

/**
 * Weighted random selection tuned for tutorial: Rare/Epic appear much more
 * often so the first experience is exciting.
 * Weights: COMMON = 40, RARE = 40, EPIC = 20
 */
export function weightedRandomEffectTutorial(pool: EffectDef[]): EffectDef {
  const WEIGHTS: Record<EffectRarity, number> = { COMMON: 40, RARE: 40, EPIC: 20 };
  const totalWeight = pool.reduce((sum, ef) => sum + (WEIGHTS[ef.rarity] ?? 1), 0);
  let rand = Math.random() * totalWeight;
  for (const ef of pool) {
    rand -= WEIGHTS[ef.rarity] ?? 1;
    if (rand <= 0) return ef;
  }
  return pool[pool.length - 1] ?? pool[0];
}

/**
 * Pick a guaranteed Rare or Epic effect from the pool.
 * Used for tutorial-2 to ensure the visitor sees a premium-tier effect.
 * Prefers Epic (30% chance) over Rare (70% chance).
 */
export function pickGuaranteedRareOrEpic(pool: EffectDef[]): EffectDef {
  const epic = pool.filter(ef => ef.rarity === 'EPIC');
  const rare = pool.filter(ef => ef.rarity === 'RARE');
  if (epic.length > 0 && Math.random() < 0.3) {
    return epic[Math.floor(Math.random() * epic.length)]!;
  }
  if (rare.length > 0) {
    return rare[Math.floor(Math.random() * rare.length)]!;
  }
  // Fallback (shouldn't happen if pool has Rare/Epic)
  return weightedRandomEffectTutorial(pool);
}

// ── Theme preview helpers ─────────────────────────────────────────────────────

export function getThemeLimitedEffectKeys(themeKey: ThemeKey): string[] {
  return EFFECTS_REGISTRY
    .filter(ef => ef.themes !== 'all')
    .filter(ef => (ef.themes as ThemeKey[]).includes(themeKey))
    .map(ef => ef.key);
}

export function getThemeExclusiveEffectKeys(themeKey: ThemeKey): string[] {
  return EFFECTS_REGISTRY
    .filter(ef => Array.isArray(ef.themes))
    .filter(ef => (ef.themes as ThemeKey[]).length === 1 && (ef.themes as ThemeKey[])[0] === themeKey)
    .map(ef => ef.key);
}

export function getRandomThemeLimitedEffectKey(themeKey: ThemeKey): string {
  const exclusive = getThemeExclusiveEffectKeys(themeKey);
  if (exclusive.length > 0) {
    return exclusive[Math.floor(Math.random() * exclusive.length)] ?? FALLBACK_EFFECT_KEY;
  }
  const limited = getThemeLimitedEffectKeys(themeKey);
  if (limited.length > 0) {
    return limited[Math.floor(Math.random() * limited.length)] ?? FALLBACK_EFFECT_KEY;
  }
  return FALLBACK_EFFECT_KEY;
}
