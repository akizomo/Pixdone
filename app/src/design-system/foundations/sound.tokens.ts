/**
 * Pixdone sound tokens.
 * vanilla (public/script.js + .cursor/rules/pixdone-sounds.mdc) と同一の割り当てルール。
 * key は playSound に渡す値。実再生は services/sound.ts / ComicEffectsManager に委譲。
 *
 * テーマ別サウンド:
 * - サウンドの「割り当て（どの操作でどのkeyを鳴らすか）」は key で固定
 * - 音色/フレーズなどの実体は VisualTheme.soundPackKey によりテーマごとに差し替える
 *   (ThemeProvider → window.__pixdoneSetSoundPack → services/soundEngine.ts)
 */

/** サウンドトークン: key は playSound に渡す値。when は鳴らすタイミング（vanilla ルール準拠）。 */
export const sound = {
  /** データ追加（タスク/リスト/サブタスク追加・確定、エフェクトをアクティブにするトグルON） */
  taskAdd: {
    key: "taskAdd",
    role: "dataAdd",
    when: "タスク/リスト/サブタスク追加・確定、Toggle ONアクション（何かを有効化する）",
    description: "データ追加・有効化のフィードバック",
  },
  /** 編集・モード開始（タスク編集を開く、サブタスク編集） */
  taskEdit: {
    key: "taskEdit",
    role: "editConfirm",
    when: "タスク編集を開く、サブタスク編集",
    description: "編集・モード開始のフィードバック",
  },
  /** データ削除（タスク/リスト削除、エフェクトをアクティブから外すトグルOFF） */
  taskDelete: {
    key: "taskDelete",
    role: "dataDelete",
    when: "タスク/リスト削除の確定、Toggle OFFアクション（何かを無効化する）",
    description: "データ削除・無効化のフィードバック",
  },
  /** キャンセル・閉じる・戻る（モーダルを閉じる、キャンセル、下層ページの戻るボタン） */
  taskCancel: {
    key: "taskCancel",
    role: "cancel",
    when: "モーダルを閉じる、キャンセルボタン、下層ページ（DetailView等）の戻るボタン",
    description: "キャンセル・閉じる・戻るのフィードバック",
  },
  /** 成功・完了（ログイン/ログアウト成功、パスワードリセット成功、テーマ変更確定） */
  taskComplete: {
    key: "taskComplete",
    role: "completion",
    when: "ログイン/ログアウト成功、パスワードリセット成功、テーマをアクティブにする",
    description: "成功・完了のフィードバック",
  },
  /** タイマー完了（フォーカス/休憩のカウントが 0 になったとき） */
  focusAlarm: {
    key: "focusAlarm",
    role: "completion",
    when: "フォーカスタイマー/休憩タイマーが完了したとき（アラーム）",
    description: "ピクセル調の少し長い完了アラーム",
  },
  /** Pomodoro 完了（集中が終わったとき） */
  focusPomodoroComplete: {
    key: "focusPomodoroComplete",
    role: "completion",
    when: "Pomodoro が完了したとき（達成）",
    description: "ポジティブ寄りの達成ファンファーレ",
  },
  /** Break 完了（休憩が終わったとき） */
  focusBreakComplete: {
    key: "focusBreakComplete",
    role: "completion",
    when: "休憩（Short/Long break）が完了したとき（復帰）",
    description: "復帰の合図（軽めのポジティブサイン）",
  },
  /** ミニゲーム: Great（ご褒美） */
  perfectTimingGreat: {
    key: "perfectTimingGreat",
    role: "completion",
    when: "ミニゲームで Great のご褒美演出",
    description: "ミニゲームのご褒美サウンド",
  },
  /** 選択・トグル・ナビゲーション（タブ、チップ、サウンドトグル、その他汎用クリック） */
  buttonClick: {
    key: "buttonClick",
    role: "selection",
    when: "タブ切替、言語チップ、サウンドトグル、日付/繰り返しボタン、リストタブ、メニュー開閉、コレクションのリスト選択・フィルターチップ・前後ナビ・ロック解除CTA、戻るボタン以外のキャンセル系ナビ",
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
