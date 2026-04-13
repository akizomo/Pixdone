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
  // RARE
  shatter:      { ja: 'タスクを粉砕した。',               en: 'Shattered the task.' },
  spinOff:      { ja: 'タスクをスピンで吹き飛ばした。',   en: 'Spun the task right off.' },
  crumpleThrow: { ja: 'タスクをくしゃっと投げ捨てた。',   en: 'Crumpled and tossed the task.' },
  fighter:      { ja: 'タスクを殴り倒した。',             en: 'Knocked the task out cold.' },
  glitchSlide:  { ja: 'タスクをグリッチさせた。',         en: 'Glitched the task away.' },
  neonWarp:     { ja: 'タスクをワープ送りにした。',       en: 'Warped the task out.' },
  scanDrone:    { ja: 'タスクをスキャンして分解した。',   en: 'Scanned the task into pixels.' },
  laserCutter:  { ja: 'タスクを真っ二つにした。',         en: 'Sliced the task in two.' },
  leafScatter:  { ja: 'タスクを風に散らした。',           en: 'Scattered the task to the wind.' },
  butterflyFly: { ja: '蝶がタスクを運び去った。',         en: 'Butterflies carried the task away.' },
  fireflyBurst: { ja: 'ホタルの光がタスクを包んだ。',     en: 'Fireflies burst the task away.' },
  // EPIC
  rainbowSmash:  { ja: '虹色の一撃でタスクを粉砕した。',  en: 'Rainbow-smashed the task.' },
  freeze:        { ja: 'タスクを凍らせて砕いた。',        en: 'Froze and shattered the task.' },
  bomb:          { ja: 'タスクを爆破した。',              en: 'Bombed the task.' },
  giantTreeGrow: { ja: '巨大な木がタスクを飲み込んだ。',  en: 'A giant tree swallowed the task.' },
  owlBlink:      { ja: 'フクロウがタスクを消し去った。',  en: 'The owl blinked the task away.' },
  neonBigBang:   { ja: '超新星がタスクを飲み込んだ。',    en: "Supernova'd the task." },
};

export function getCompletionToastMessage(effectKey: string | undefined, lang: Lang): string {
  const entry = effectKey ? EFFECT_COMPLETION_MESSAGES[effectKey] : undefined;
  return (entry ?? DEFAULT_COMPLETION_MESSAGE)[lang];
}

export function getUndoLabel(lang: Lang): string {
  return UNDO_LABEL[lang];
}
