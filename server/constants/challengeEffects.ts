/**
 * Server-authoritative challenge & evolution definitions.
 *
 * Naming scheme (Phase 3+):
 *   - Each level is stored as a SEPARATE row in `effect_progress`.
 *   - `fighter_punch` is the base challenge effect (was `fighter` pre-Phase 3).
 *   - `fighter_punch_lv2` is a separate child effect unlocked after owning the
 *     parent + completing `threshold` additional tasks.
 *
 * Rows keyed under the legacy `fighter` effectId are auto-migrated to
 * `fighter_punch` on first read (see `migrateLegacyFighterRows` in storage.ts).
 */

export interface ChallengeEffectDef {
  effectId: string;
  threshold: number;           // 通常リストのタスク完了数でアンロック（Smash List は数えない）
  /** この期限を過ぎると challenge → premium に移行。null = 期限なし（常に参加中） */
  deadline: Date | null;
}

export const ACTIVE_CHALLENGE_EFFECTS: ChallengeEffectDef[] = [
  // 最初のチャレンジ（2026-11〜）：全員が登録時から参加。期限なし。
  {
    effectId: 'fighter_punch',
    threshold: 10,
    deadline: null,
  },
];

// ── Child-unlock (evolution-kind) definitions ────────────────────────────────
// After the parent effect is owned, we begin counting completions toward the
// child's unlock. When `threshold` is reached, a new `effect_progress` row is
// inserted for `childEffectId` with owned=true. This replaces the prior
// in-place evolution (same effectId with equippedLevel=2) so both variants
// appear as separate collection cards the user can toggle independently.

export interface EvolutionChildUnlock {
  parentEffectId: string;
  childEffectId: string;
  threshold: number;
  requiresPremium: boolean;
}

export const EVOLUTION_CHILD_UNLOCKS: EvolutionChildUnlock[] = [
  {
    parentEffectId: 'fighter_punch',
    childEffectId: 'fighter_punch_lv2',
    threshold: 50,
    requiresPremium: true,
  },
];

// ── Legacy (pre-Phase 3) in-place evolution — retained for compatibility ─────
// No active entries: `fighter` has been migrated to the split-card model above.
// If a future effect wants in-place evolution, add it here.

export interface EvolutionDef {
  effectId: string;
  maxLevel: number;
  /** Cumulative task completions (after owning) required for the next level */
  evolutionThreshold: number;
  /** Whether premium subscription is required for evolution */
  requiresPremium: boolean;
}

export const EVOLVABLE_EFFECTS: EvolutionDef[] = [];
