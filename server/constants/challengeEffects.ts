export interface ChallengeEffectDef {
  effectId: string;
  threshold: number;           // タスク完了数でアンロック
  deadline: Date;              // この期限を過ぎると challenge → premium に移行
}

export const ACTIVE_CHALLENGE_EFFECTS: ChallengeEffectDef[] = [
  {
    effectId: 'punch',
    threshold: 50,
    deadline: new Date('2026-05-31T23:59:59+09:00'),
  },
];
