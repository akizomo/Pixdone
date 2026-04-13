export type Lang = 'ja' | 'en';

interface LocalizedMessage {
  ja: string;
  en: string;
}

const DEFAULT_COMPLETION_MESSAGE: LocalizedMessage = {
  ja: 'タスクを完了しました',
  en: 'Task completed',
};

const UNDO_LABEL: LocalizedMessage = {
  ja: '元に戻す',
  en: 'Undo',
};

const EFFECT_COMPLETION_MESSAGES: Record<string, LocalizedMessage> = {
  // RARE — 攻撃系
  shatter:      { ja: 'タスクを粉々にしました。',           en: 'Shattered the task.' },
  spinOff:      { ja: 'タスクをスピンで飛ばしました。',     en: 'Spun the task right off.' },
  crumpleThrow: { ja: 'タスクをくしゃっと丸めました。',     en: 'Crumpled and tossed the task.' },
  fighter:      { ja: 'タスクをパンチしました。',           en: 'Punched the task out.' },
  chomp:        { ja: 'タスクをパクッと食べました。',       en: 'Devoured the task whole.' },
  glitchSlide:  { ja: 'タスクをグリッチで消しました。',     en: 'Glitched the task away.' },
  neonWarp:     { ja: 'タスクをワープで飛ばしました。',     en: 'Warped the task out.' },
  scanDrone:    { ja: 'タスクをスキャンで分解しました。',   en: 'Scanned the task into pixels.' },
  laserCutter:  { ja: 'タスクをレーザーでカットしました。', en: 'Sliced the task in two.' },
  // RARE — 祝福系
  leafScatter:  { ja: '木の葉がタスクを運んでいきました。', en: 'Leaves carried the task away.' },
  butterflyFly: { ja: '蝶がタスクを運んでいきました。',     en: 'Butterflies carried the task away.' },
  fireflyBurst: { ja: '蛍がタスクを照らしました。',         en: 'Fireflies lit up the task.' },
  // EPIC — 攻撃系
  bomb:          { ja: 'タスクをドカンと消しました。',        en: 'Bombed the task.' },
  freeze:        { ja: 'タスクを凍らせました。',              en: 'Froze the task.' },
  neonBigBang:   { ja: 'タスクをビッグバンで消し去りました。', en: "Supernova'd the task." },
  // EPIC — 祝福系
  rainbowSmash:  { ja: '虹がタスクを見送りました。',          en: 'A rainbow saw the task off.' },
  giantTreeGrow: { ja: '大木がタスクを包みました。',          en: 'A giant tree wrapped up the task.' },
  owlBlink:      { ja: 'フクロウがタスクを見送りました。',    en: 'The owl saw the task off.' },
};

export function getCompletionToastMessage(effectKey: string | undefined, lang: Lang): string {
  const entry = effectKey ? EFFECT_COMPLETION_MESSAGES[effectKey] : undefined;
  return (entry ?? DEFAULT_COMPLETION_MESSAGE)[lang];
}

export function getUndoLabel(lang: Lang): string {
  return UNDO_LABEL[lang];
}
