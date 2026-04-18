# 仕様書：タスク編集の自動保存（Close-to-Save）

**ステータス:** Draft
**作成日:** 2026-04-09
**対象:** 既存タスクの編集のみ（新規作成は対象外）

---

## 背景と課題

現状、タスク編集中にモーダル/フォームを閉じると変更が**警告なく破棄**される。
一般的なtodoアプリ（Todoist、Apple Reminders、Google Tasks）は「変更＝即保存」が主流であり、
特にモバイルのBottomSheetをスワイプ/バックドロップタップで閉じた際に変更が消えるのはフラストレーションが大きい。

## 方針

**閉じたら保存、キャンセルボタンを押した時だけ破棄。**

- 既存タスクの編集フォームを「閉じる」操作で変更を自動保存する
- 明示的な「キャンセル」ボタンを押した場合のみ変更を破棄する
- 新規タスク作成は従来通り明示的な保存ボタンが必要（空タスク防止）
- Undo機能は設けない

## スコープ

| 項目 | 対象 |
|------|------|
| 既存タスクの編集 | ✅ |
| 新規タスク作成 | ❌（従来通り） |
| Undo | ❌（不要） |

---

## 動作仕様

### 1. 既存タスク編集時の「閉じる」操作 → 保存

以下の操作はすべて**変更を保存してからフォームを閉じる**：

| 操作 | プラットフォーム | 現状の挙動 | 変更後 |
|------|-----------------|-----------|--------|
| BottomSheet バックドロップタップ | Mobile | 破棄 | **保存** |
| BottomSheet 閉じるボタン（×） | Mobile | 破棄 | **保存** |
| Escape キー | Both | 破棄 | **保存** |
| 別のタスクをタップして切り替え | Both | 破棄 | **保存** |

### 2. 明示的キャンセル → 破棄

以下の操作のみ変更を**破棄**する：

| 操作 | 説明 |
|------|------|
| 「キャンセル」ボタン押下 | TaskForm内のキャンセルボタン |

### 3. 保存ボタン → 従来通り保存

保存ボタンの挙動は変更しない。引き続き明示的な保存も可能。

### 4. 新規タスク作成 → 従来通り

新規タスク作成フォームの挙動は一切変更しない。保存ボタンを押さずに閉じた場合は入力内容を破棄する。

---

## 保存条件（バリデーション）

閉じる操作でのauto-saveは、以下の条件を**すべて**満たす場合のみ実行する：

1. **タイトルが空でない**（trimして空文字列でない）
2. **変更がある**（dirty check — 元のタスクとフォーム値に差分がある）

条件を満たさない場合は保存せずにそのまま閉じる（＝実質的に破棄と同じ）。

### Dirty Check の比較対象

以下のフィールドを元タスクの値と比較し、1つでも差分があればdirtyとみなす：

| フィールド | 比較方法 |
|-----------|---------|
| `title` | `trim()` して文字列比較 |
| `details` | `trim()` して文字列比較（空文字とundefinedは同値扱い） |
| `dueDate` | 厳密等価（`===`）、`null` 同士は一致 |
| `repeat` | JSON.stringify で深い比較（CustomRepeat対応） |
| `subtasks` | JSON.stringify で深い比較（id, text, done） |

---

## 実装方針

### 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `app/src/components/TaskForm.tsx` | dirty check ロジック追加、`onClose`（保存して閉じる）コールバック追加 |
| `app/src/App.tsx` | `handleTaskFormClose` ハンドラー追加、BottomSheet/Escape/切り替え時のハンドラー差し替え |
| `app/src/design-system/components/BottomSheet/BottomSheet.tsx` | 編集モード時の `onClose` を保存付きに変更（Props経由） |

### TaskForm の変更

#### 新しいProps

```typescript
interface TaskFormProps {
  lang: 'en' | 'ja';
  listId: string;
  task?: Task;
  onSave: (fields: Partial<Task> & { title: string }) => void;
  onCancel: () => void;       // 明示的キャンセル（変更破棄）
  onClose?: () => void;       // 新規追加：フォームを閉じる（編集時は保存して閉じる）
  onDelete?: () => void;
}
```

#### dirty check フック

```typescript
const isDirty = useMemo(() => {
  if (!task) return false; // 新規作成時はdirty checkしない
  return (
    title.trim() !== (task.title ?? '') ||
    (details.trim() || '') !== (task.details ?? '') ||
    dueDate !== (task.dueDate ?? null) ||
    JSON.stringify(repeat) !== JSON.stringify(task.repeat ?? 'none') ||
    JSON.stringify(subtasks) !== JSON.stringify(task.subtasks ?? [])
  );
}, [title, details, dueDate, repeat, subtasks, task]);
```

#### 保存して閉じるロジック

```typescript
// TaskForm内部に追加
const handleClose = useCallback(() => {
  if (task && isDirty && title.trim()) {
    // 編集中 + 変更あり + タイトル非空 → 保存して閉じる
    onSave({
      title: title.trim(),
      details: details.trim() || undefined,
      dueDate,
      repeat,
      subtasks,
    });
  } else {
    // 新規 or 変更なし or タイトル空 → そのまま閉じる
    onClose?.() ?? onCancel();
  }
}, [task, isDirty, title, details, dueDate, repeat, subtasks, onSave, onClose, onCancel]);
```

### App.tsx の変更

```typescript
// 新しいハンドラー：保存せずに閉じるだけ（TaskFormのhandleCloseから呼ばれる）
const handleTaskFormClose = useCallback(() => {
  setTaskFormMode(null);
  setMobileSheetOpen(false);
  setMobileEditTaskId(null);
}, []);
```

現在 `handleTaskFormCancel` が使われている箇所のうち、**BottomSheet の onClose** と **Escape キー** を `handleClose`（TaskForm内の保存判定付き関数）に差し替える。

TaskFormの `onCancel` prop は引き続きキャンセルボタンのみが呼び出す。

### BottomSheet の変更

BottomSheetコンポーネント自体は変更不要。App.tsx側で `onClose` に渡すハンドラーを変えるだけで対応可能。

ただし、現在BottomSheet内で `playSound('taskCancel')` をハードコードしている箇所がある：
- バックドロップタップ時（Line 125）
- 閉じるボタン時（IconButton soundKey）

これらは「閉じる＝保存」になるため、サウンドの扱いを見直す必要がある：

| 操作 | 変更前のサウンド | 変更後のサウンド |
|------|----------------|----------------|
| バックドロップタップ（編集時） | `taskCancel` | サウンドなし（保存時は `taskAdd` が `onSave` 経由で鳴る） |
| ×ボタン（編集時） | `taskCancel` | 同上 |
| キャンセルボタン | `taskCancel` | `taskCancel`（変更なし） |

→ BottomSheetのバックドロップ・×ボタンの `playSound` を除去し、サウンド再生の責務をApp.tsx側のハンドラーに移す。あるいはBottomSheetに `soundOnClose` propを追加して制御する。

---

## サウンド設計

| 操作 | サウンド |
|------|---------|
| 閉じる → auto-save実行 | `taskAdd`（既存の保存ボタンと同じ） |
| 閉じる → 変更なしでそのまま閉じる | サウンドなし |
| キャンセルボタン → 変更破棄 | `taskCancel` |
| 保存ボタン → 明示的保存 | `taskAdd`（変更なし） |

---

## エッジケース

| ケース | 挙動 |
|-------|------|
| タイトルを空にして閉じる | 保存しない。元のタイトルが残る |
| 何も変更せず閉じる | dirty=false なので保存APIを呼ばない（無駄なwrite防止） |
| サブタスク編集中に閉じる | 編集中のサブタスクはフォームstate上の値で保存される |
| 別タスクをタップして編集切替 | 現在の編集を保存 → 新しいタスクの編集を開く |
| Smash Listのタスク編集 | 同じ挙動（updateTaskがFirestore skipを判断する） |
| オフライン時 | Optimistic UIで即反映。Firestoreは後でsync（既存挙動と同じ） |

---

## 影響範囲

- **既存の保存ボタン**：挙動変更なし。引き続き使用可能
- **新規タスク作成**：挙動変更なし
- **タスク削除ボタン**：挙動変更なし
- **UX変更**：キャンセルボタンの意味が「変更を元に戻す」に明確化される

---

## テスト観点

1. 【Mobile】BottomSheetのバックドロップタップで編集内容が保存されること
2. 【Mobile】BottomSheetの×ボタンで編集内容が保存されること
3. 【Both】Escapeキーで編集内容が保存されること
4. 【Both】キャンセルボタンで編集内容が破棄されること
5. 【Both】タイトルを空にして閉じた場合、保存されないこと
6. 【Both】何も変更せず閉じた場合、updateTaskが呼ばれないこと
7. 【Both】新規作成フォームの挙動が従来通りであること
8. 【Desktop】別タスクタップ時に現在の編集が保存されてから切り替わること
9. 【Sound】auto-save時に `taskAdd`、キャンセル時に `taskCancel` が鳴ること
10. 【Sound】変更なしで閉じた時にサウンドが鳴らないこと
