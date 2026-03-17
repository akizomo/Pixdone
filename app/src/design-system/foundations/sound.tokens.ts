/**
 * Pixdone sound tokens.
 * vanilla (public/script.js + .cursor/rules/pixdone-sounds.mdc) と同一の割り当てルール。
 * key は playSound に渡す値。実再生は services/sound.ts / ComicEffectsManager に委譲。
 */

/** サウンドトークン: key は playSound に渡す値。when は鳴らすタイミング（vanilla ルール準拠）。 */
export const sound = {
  /** データ追加（タスク/リスト/サブタスク追加、確定） */
  taskAdd: {
    key: "taskAdd",
    role: "dataAdd",
    when: "タスク/リスト/サブタスク追加・確定",
    description: "データ追加のフィードバック",
  },
  /** 編集・モード開始（タスク編集を開く、サブタスク編集） */
  taskEdit: {
    key: "taskEdit",
    role: "editConfirm",
    when: "タスク編集を開く、サブタスク編集",
    description: "編集・モード開始のフィードバック",
  },
  /** データ削除（タスク/リスト削除） */
  taskDelete: {
    key: "taskDelete",
    role: "dataDelete",
    when: "タスク/リスト削除の確定",
    description: "データ削除のフィードバック",
  },
  /** キャンセル・閉じる（モーダルを閉じる、キャンセル） */
  taskCancel: {
    key: "taskCancel",
    role: "cancel",
    when: "モーダルを閉じる、キャンセルボタン",
    description: "キャンセル・閉じるのフィードバック",
  },
  /** 成功・完了（ログイン/ログアウト成功、パスワードリセット成功、タスク完了フォールバック時） */
  taskComplete: {
    key: "taskComplete",
    role: "completion",
    when: "ログイン/ログアウト成功、パスワードリセット成功",
    description: "成功・完了のフィードバック",
  },
  /** タイマー完了（フォーカス/休憩のカウントが 0 になったとき） */
  focusAlarm: {
    key: "focusAlarm",
    role: "completion",
    when: "フォーカスタイマー/休憩タイマーが完了したとき（アラーム）",
    description: "ピクセル調の少し長い完了アラーム",
  },
  /** ミニゲーム: Great（ご褒美） */
  perfectTimingGreat: {
    key: "perfectTimingGreat",
    role: "completion",
    when: "ミニゲームで Great のご褒美演出",
    description: "ミニゲームのご褒美サウンド",
  },
  /** 選択・トグル（タブ、チップ、サウンドトグル、その他汎用クリック） */
  buttonClick: {
    key: "buttonClick",
    role: "selection",
    when: "タブ切替、言語チップ、サウンドトグル、日付/繰り返しボタン、リストタブ、メニュー開閉など",
    description: "選択・トグルのフィードバック",
  },
  /** サブタスク完了・コンボビープ（vanilla: picoSound.playSubtaskCompleteSound） */
  subtaskComplete: {
    key: "subtaskComplete",
    role: "subtaskCompletion",
    when: "サブタスクを完了にしたとき",
    description: "サブタスク完了・コンボビープ",
  },
} as const;

/** playSound(key) に渡すキー型 */
export type SoundKey = keyof typeof sound;

/** キー文字列の配列（実装でループする場合など） */
export const soundKeys: readonly SoundKey[] = Object.keys(sound) as SoundKey[];

/** 役割ごとのグループ（ドキュメント・一覧用） */
export const soundByRole = {
  dataAdd: sound.taskAdd,
  editConfirm: sound.taskEdit,
  dataDelete: sound.taskDelete,
  cancel: sound.taskCancel,
  completion: sound.taskComplete,
  selection: sound.buttonClick,
  subtaskCompletion: sound.subtaskComplete,
} as const;
