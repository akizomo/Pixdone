export interface ChallengeEffectDef {
  effectId: string;
  threshold: number;           // タスク完了数でアンロック
  deadline: Date;              // この期限を過ぎると challenge → premium に移行
}

export const ACTIVE_CHALLENGE_EFFECTS: ChallengeEffectDef[] = [
  {
    effectId: 'punch',
    threshold: 20,
    deadline: new Date('2026-05-31T23:59:59+09:00'),
  },
];

// ── Evolution definitions ─────────────────────────────────────────────────────

export interface EvolutionDef {
  effectId: string;
  maxLevel: number;
  /** Cumulative task completions (after owning) required for Lv2 */
  evolutionThreshold: number;
  /** Whether premium subscription is required for evolution */
  requiresPremium: boolean;
}

export const EVOLVABLE_EFFECTS: EvolutionDef[] = [
  {
    effectId: 'punch',
    maxLevel: 2,
    evolutionThreshold: 50,
    requiresPremium: true,
  },
];
