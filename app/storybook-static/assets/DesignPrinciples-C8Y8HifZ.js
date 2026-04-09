import{j as n}from"./iframe-DbiBQxMl.js";import{useMDXComponents as i}from"./index-NCH00_ay.js";import{M as l}from"./blocks-pUQiorwL.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DVmwhS5k.js";function e(r){const s={code:"code",h1:"h1",h2:"h2",hr:"hr",li:"li",p:"p",strong:"strong",ul:"ul",...i(),...r.components};return n.jsxs(n.Fragment,{children:[n.jsx(l,{title:"Foundations PXD/Design Principles"}),`
`,n.jsx(s.h1,{id:"design-principles",children:"Design Principles"}),`
`,n.jsxs(s.p,{children:["Pixdone のデザインシステムは ",n.jsx(s.strong,{children:"レトロなピクセル表現"})," と ",n.jsx(s.strong,{children:"モダンな使いやすさ"})," のバランスで設計されています。Foundations とコンポーネントの判断はこの原則に従います。"]}),`
`,n.jsx(s.hr,{}),`
`,n.jsx(s.h2,{id:"1-playful-but-clear遊び心と明確さ",children:"1. Playful but Clear（遊び心と明確さ）"}),`
`,n.jsxs(s.ul,{children:[`
`,n.jsxs(s.li,{children:[n.jsx(s.strong,{children:"Playful"}),": ピクセル風の形・太めのボーダー・ゲーム的なフィードバックで、楽しく報われる体験に。"]}),`
`,n.jsxs(s.li,{children:[n.jsx(s.strong,{children:"Clear"}),": 可読性と分かりやすさを損なわない。テキストは読みやすく、操作は明瞭に。遊びは理解を助け、邪魔しない。"]}),`
`]}),`
`,n.jsxs(s.p,{children:[n.jsx(s.strong,{children:"実装"}),": はっきりしたタイポ、十分なコントラスト、明確なラベル。ピクセルシャドウやリワードは「補強」であり、UI の代わりにはしない。"]}),`
`,n.jsx(s.hr,{}),`
`,n.jsx(s.h2,{id:"2-retro-but-usableレトロだが使える",children:"2. Retro but Usable（レトロだが使える）"}),`
`,n.jsxs(s.ul,{children:[`
`,n.jsxs(s.li,{children:[n.jsx(s.strong,{children:"Retro"}),": 角張ったコーナー、ブロック状のシャドウ、控えめな radius など、ピクセルアートを意識したビジュアル。"]}),`
`,n.jsxs(s.li,{children:[n.jsx(s.strong,{children:"Usable"}),": タップターゲット・余白・フォーカスなど、現代のインタラクション基準に合わせる。見た目はレトロ、振る舞いは現代的に。"]}),`
`]}),`
`,n.jsxs(s.p,{children:[n.jsx(s.strong,{children:"実装"}),": 可読性を損なうブラーやグラデーションは避ける。レトロな見た目は、Material レベルの使いやすさの上に載せる。"]}),`
`,n.jsx(s.hr,{}),`
`,n.jsx(s.h2,{id:"3-feedback-firstフィードバック最優先",children:"3. Feedback First（フィードバック最優先）"}),`
`,n.jsxs(s.ul,{children:[`
`,n.jsxs(s.li,{children:[n.jsx(s.strong,{children:"操作には必ず反応"}),": クリック・完了・エラー・リワードに、即座で一貫したフィードバック（視覚・必要に応じてモーション・音）。"]}),`
`,n.jsxs(s.li,{children:[n.jsx(s.strong,{children:"状態は常に分かる"}),": ローディング・成功・エラー・無効は、常に識別可能に。"]}),`
`]}),`
`,n.jsxs(s.p,{children:[n.jsx(s.strong,{children:"実装"}),": モーショントークン（smash feedback, reward animation）、セマンティックカラー（success, warning, danger）、一貫したパターンで「何が起きたか」を伝える。"]}),`
`,n.jsx(s.hr,{}),`
`,n.jsx(s.h2,{id:"4-accessibility-by-default最初からアクセシブル",children:"4. Accessibility by Default（最初からアクセシブル）"}),`
`,n.jsxs(s.ul,{children:[`
`,n.jsxs(s.li,{children:[n.jsx(s.strong,{children:"後付けではなく組み込み"}),": コントラスト・フォーカス・タッチターゲット・ reduced motion は、例外ではなく Foundation の一部。"]}),`
`,n.jsxs(s.li,{children:[n.jsx(s.strong,{children:"WCAG を意識"}),": 色のコントラスト、フォーカス表示、キーボード・スクリーンリーダー対応で WCAG 2.1 AA を目指す。"]}),`
`]}),`
`,n.jsxs(s.p,{children:[n.jsx(s.strong,{children:"実装"}),": 十分なコントラストのセマンティックカラー、明確なフォーカスリング、最小 44×44px のタップターゲット、",n.jsx(s.code,{children:"prefers-reduced-motion"})," の尊重。"]}),`
`,n.jsx(s.hr,{}),`
`,n.jsx(s.h2,{id:"5-small-ui-strong-identity少ない-ui強いアイデンティティ",children:"5. Small UI, Strong Identity（少ない UI、強いアイデンティティ）"}),`
`,n.jsxs(s.ul,{children:[`
`,n.jsxs(s.li,{children:[n.jsx(s.strong,{children:"ミニマルだが表現力"}),": ノイズを減らし、色・タイポ・余白・radius・シャドウなどの少ないプリミティブを一貫して使う。"]}),`
`,n.jsxs(s.li,{children:[n.jsx(s.strong,{children:"強いアイデンティティ"}),": 限られたパレットとピクセルスタイルで Pixdone らしさを出す。一貫性がアイデンティティを強くする。"]}),`
`]}),`
`,n.jsxs(s.p,{children:[n.jsx(s.strong,{children:"実装"}),": トークンセットを厳選して再利用。新しい UI は「仲間」に見えるようにし、別のビジュアル言語を増やさない。"]}),`
`,n.jsx(s.hr,{}),`
`,n.jsx(s.h2,{id:"まとめ",children:"まとめ"}),`
`,n.jsx(s.p,{children:`| 原則 | ポイント |
|------|----------|
| Playful but Clear | 楽しさ + 可読性、分かりやすい操作 |
| Retro but Usable | ピクセル見た目 + モダンな操作 |
| Feedback First | 即時・一貫した反応 |
| Accessibility by Default | コントラスト、フォーカス、ターゲット、reduced motion |
| Small UI, Strong Identity | 少ないトークン、一貫した適用 |`}),`
`,n.jsxs(s.p,{children:["これらの原則は ",n.jsx(s.strong,{children:"Foundation"}),"（トークン・タイポ・カラー・余白・モーション・アクセシビリティ）に反映され、その後の ",n.jsx(s.strong,{children:"Components"})," と ",n.jsx(s.strong,{children:"Patterns"})," の指針になります。"]})]})}function x(r={}){const{wrapper:s}={...i(),...r.components};return s?n.jsx(s,{...r,children:n.jsx(e,{...r})}):e(r)}export{x as default};
