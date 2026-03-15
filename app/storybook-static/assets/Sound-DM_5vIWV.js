import{j as n}from"./iframe-DbiBQxMl.js";import{useMDXComponents as l}from"./index-NCH00_ay.js";import{M as d}from"./blocks-pUQiorwL.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DVmwhS5k.js";const s={taskAdd:{role:"dataAdd",when:"Save new task, add list, create list, add subtask (confirm)",description:"ポジティブな確定フィードバック"},taskEdit:{role:"editConfirm",when:"Open task/subtask edit, save existing task, rename list",description:"編集・確定のフィードバック"},taskDelete:{role:"dataDelete",when:"Confirm delete task, list, or account",description:"削除の確定（破壊的アクション）"},taskCancel:{role:"cancel",when:"Close sheet, cancel form, close modal, cancel delete",description:"軽いキャンセル・閉じる"},taskComplete:{role:"completion",when:"Task marked complete (after effect), login/logout success, password reset success",description:"祝い・完了のフィードバック"},buttonClick:{role:"selection",when:"Tab switch, language chip, sound toggle, date button, empty state, list tab, auth close",description:"中立なクリック・選択"},subtaskComplete:{role:"subtaskCompletion",when:"Subtask toggled to done",description:"サブタスク完了・コンボビープ"}};function i(t){const e={br:"br",code:"code",h1:"h1",h2:"h2",hr:"hr",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...l(),...t.components};return n.jsxs(n.Fragment,{children:[n.jsx(d,{title:"Foundations PXD/Sound"}),`
`,n.jsx(e.h1,{id:"sound",children:"Sound"}),`
`,n.jsxs(e.p,{children:["Pixdone では ",n.jsx(e.strong,{children:"すべての操作"})," に選択音・フィードバック音を割り振り、レトロで遊びのある体験にしています。ここではサウンドの原則と、",n.jsx(e.strong,{children:"いつ・どのトークン"}),"を鳴らすかを整理します。"]}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"原則",children:"原則"}),`
`,n.jsxs(e.ol,{children:[`
`,n.jsxs(e.li,{children:[`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"すべての操作に音を割り当てる"}),n.jsx(e.br,{}),`
`,"タスク追加・編集・削除・完了・キャンセル・ボタンクリック・ドラッグ並び替えなど、ユーザーが行う操作には必ず ",n.jsx(e.code,{children:"playSound(token)"})," またはそれに相当する効果音を付ける。"]}),`
`]}),`
`,n.jsxs(e.li,{children:[`
`,n.jsx(e.p,{children:n.jsx(e.strong,{children:"重要度・意味に応じてトークンを選ぶ"})}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:["データの ",n.jsx(e.strong,{children:"追加確定"})," → ",n.jsx(e.code,{children:"taskAdd"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"編集開始・保存"})," → ",n.jsx(e.code,{children:"taskEdit"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"削除確定"})," → ",n.jsx(e.code,{children:"taskDelete"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"キャンセル・閉じる"})," → ",n.jsx(e.code,{children:"taskCancel"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"完了・成功"})," → ",n.jsx(e.code,{children:"taskComplete"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"選択・トグル・汎用クリック"})," → ",n.jsx(e.code,{children:"buttonClick"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"サブタスク完了"})," → ",n.jsx(e.code,{children:"subtaskComplete"}),"（picoSound ビープなど）"]}),`
`]}),`
`]}),`
`,n.jsxs(e.li,{children:[`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"同時再生は避ける"}),n.jsx(e.br,{}),`
`,"1 度に 1 つの UI サウンド。連打にはデバウンスする。"]}),`
`]}),`
`,n.jsxs(e.li,{children:[`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"ミュートを常に提供する"}),n.jsx(e.br,{}),`
`,"ユーザーが音をオフにできるようにする。ヘッダーのドロップダウンなどでミュート切り替えを用意する。"]}),`
`]}),`
`,n.jsxs(e.li,{children:[`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"重要な情報を音だけに頼らない"}),n.jsx(e.br,{}),`
`,"エラーや成功など、意味のある情報は視覚（テキスト・アイコン・状態）でも伝える。音は補助。"]}),`
`]}),`
`]}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"トークン一覧いつ何を鳴らすか",children:"トークン一覧（いつ・何を鳴らすか）"}),`
`,n.jsxs(e.p,{children:[`| トークン | 役割 | 鳴らすタイミング | 説明 |
|----------|------|------------------|------|
| `,n.jsx(e.strong,{children:"taskAdd"})," | ",s.taskAdd.role," | ",s.taskAdd.when," | ",s.taskAdd.description,` |
| `,n.jsx(e.strong,{children:"taskEdit"})," | ",s.taskEdit.role," | ",s.taskEdit.when," | ",s.taskEdit.description,` |
| `,n.jsx(e.strong,{children:"taskDelete"})," | ",s.taskDelete.role," | ",s.taskDelete.when," | ",s.taskDelete.description,` |
| `,n.jsx(e.strong,{children:"taskCancel"})," | ",s.taskCancel.role," | ",s.taskCancel.when," | ",s.taskCancel.description,` |
| `,n.jsx(e.strong,{children:"taskComplete"})," | ",s.taskComplete.role," | ",s.taskComplete.when," | ",s.taskComplete.description,` |
| `,n.jsx(e.strong,{children:"buttonClick"})," | ",s.buttonClick.role," | ",s.buttonClick.when," | ",s.buttonClick.description,` |
| `,n.jsx(e.strong,{children:"subtaskComplete"})," | ",s.subtaskComplete.role," | ",s.subtaskComplete.when," | ",s.subtaskComplete.description," |"]}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"使用例コード",children:"使用例（コード）"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-ts",children:`import { playSound } from '../services/sound';
import { sound } from '../design-system';

// タスク追加確定時
playSound(sound.taskAdd.key);  // 'taskAdd'

// モーダルを閉じた時
playSound(sound.taskCancel.key);  // 'taskCancel'

// 言語チップ・タブなど
playSound(sound.buttonClick.key);  // 'buttonClick'
`})}),`
`,n.jsxs(e.p,{children:[n.jsx(e.code,{children:"services/sound.ts"})," の ",n.jsx(e.code,{children:"playSound(key: SoundKey)"})," に、上記の ",n.jsx(e.code,{children:"sound.*.key"})," を渡す。ミュート時は内部で再生しない。"]}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"役割別の対応表実装チェック用",children:"役割別の対応表（実装チェック用）"}),`
`,n.jsx(e.p,{children:`| 役割 | トークン | 主な使用箇所 |
|------|----------|--------------|
| データ追加 | taskAdd | タスク保存、リスト作成、サブタスク追加確定 |
| 編集・確定 | taskEdit | 編集シートを開く、タスク/リスト保存、リスト名変更 |
| データ削除 | taskDelete | 削除確認ダイアログで「削除する」 |
| キャンセル | taskCancel | シート閉じる、キャンセルボタン、モーダル閉じる |
| 完了・成功 | taskComplete | タスク完了、ログイン/ログアウト成功 |
| 選択・トグル | buttonClick | タブ、チップ、トグル、日付ボタン、その他汎用ボタン |
| サブタスク完了 | subtaskComplete | サブタスクのチェックをオンにしたとき（picoSound） |`}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"ミニゲーム拡張任意",children:"ミニゲーム・拡張（任意）"}),`
`,n.jsx(e.p,{children:"Perfect Timing などのミニゲームでは、次のようなキーを別途実装で扱うことがある。"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.code,{children:"perfectTimingMiss"})," / ",n.jsx(e.code,{children:"Good"})," / ",n.jsx(e.code,{children:"Great"})," / ",n.jsx(e.code,{children:"Perfect"})]}),`
`,n.jsx(e.li,{children:n.jsx(e.code,{children:"perfectTimingGaugeTick"})}),`
`]}),`
`,n.jsxs(e.p,{children:["これらは必要に応じて ",n.jsx(e.code,{children:"sound.tokens.ts"})," や実装側で拡張する。"]}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"アクセシビリティ",children:"アクセシビリティ"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"ミュート"})," – 常にオフにできること。設定またはヘッダードロップダウンのサウンドトグルで提供。"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"音だけに依存しない"})," – エラー・成功・状態変化は、テキストやアイコンでも伝える。"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"自動再生"})," – ユーザー操作に紐づけて鳴らし、意図しない自動再生は避ける。"]}),`
`]})]})}function x(t={}){const{wrapper:e}={...l(),...t.components};return e?n.jsx(e,{...t,children:n.jsx(i,{...t})}):i(t)}export{x as default};
