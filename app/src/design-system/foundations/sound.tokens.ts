/**
 * Pixdone sound tokens.
 * どの操作にどの音を割り当てるかを定義。playSound(key) の key と対応。
 * 実再生は services/sound.ts / ComicEffectsManager に委譲。
 */

/** サウンドトークン: key は playSound に渡す値。when は鳴らすタイミングの説明。 */
export const sound = {
  /** データ追加の確定（タスク・リスト・サブタスク追加、作成） */
  taskAdd: {
    key: "taskAdd",
    role: "dataAdd",
    when: "Save new task, add list, create list, add subtask (confirm)",
    description: "ポジティブな確定フィードバック",
  },
  /** 編集開始・編集の確定（タスク編集を開く、保存、リスト名変更） */
  taskEdit: {
    key: "taskEdit",
    role: "editConfirm",
    when: "Open task/subtask edit, save existing task, rename list",
    description: "編集・確定のフィードバック",
  },
  /** データ削除の確定（タスク・リスト・アカウント削除の確認後） */
  taskDelete: {
    key: "taskDelete",
    role: "dataDelete",
    when: "Confirm delete task, list, or account",
    description: "削除の確定（破壊的アクション）",
  },
  /** キャンセル・閉じる（シート・フォーム・モーダルを閉じる、キャンセルボタン） */
  taskCancel: {
    key: "taskCancel",
    role: "cancel",
    when: "Close sheet, cancel form, close modal, cancel delete",
    description: "軽いキャンセル・閉じる",
  },
  /** タスク完了（完了エフェクト後やフォールバック時。ログイン/ログアウト成功なども） */
  taskComplete: {
    key: "taskComplete",
    role: "completion",
    when: "Task marked complete (after effect), login/logout success, password reset success",
    description: "祝い・完了のフィードバック",
  },
  /** 汎用ボタン・選択・トグル（タブ、チップ、日付ボタン、サウンドON時など） */
  buttonClick: {
    key: "buttonClick",
    role: "selection",
    when: "Tab switch, language chip, sound toggle, date button, empty state, list tab, auth close",
    description: "中立なクリック・選択",
  },
  /** サブタスクを完了にしたとき（picoSound ビープ、コンボでピッチ可） */
  subtaskComplete: {
    key: "subtaskComplete",
    role: "subtaskCompletion",
    when: "Subtask toggled to done",
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
