# 素材のライセンス一覧（App Store「コンテンツ配信権」の裏付け）

PixDone が使っているフォント・アイコン・画像・音声の出どころとライセンスをまとめた一覧です。
App Store Connect の「コンテンツ配信権」に「はい（サードパーティのコンテンツを含む）＋必要な権利を持っている」と答える根拠として使います。

- 調査日: 2026-11-06（リポジトリの `main` 時点）
- 「要確認」は、リポジトリや履歴から出どころを確定できなかったものです。推測では埋めていません。
- アプリ（iOS / Android）は `app/public/` 以下をまるごと同梱するので、`public/` にあるファイルは「アプリ同梱」に当たります。Google Fonts のように CDN から読み込むものは同梱されません。
- npm のライブラリ（React、Firebase、Capacitor など）はプログラムでありコンテンツではないため対象外です。いずれも MIT / Apache-2.0 などの商用利用できるライセンスです。

## 1. フォント

| 素材 | ファイル / 読み込み元 | 出どころ | ライセンス | 商用 | アプリ同梱 | クレジット要否 | 根拠 |
|---|---|---|---|---|---|---|---|
| Inter | `index.html`（Google Fonts の CDN） | Google Fonts / The Inter Project Authors | SIL OFL 1.1 | 可 | なし（CDN 読み込み） | 不要 | https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt |
| VT323 | `index.html`（CDN）と `app/public/fonts/vt323-latin*.woff2`（自前ホスト） | Google Fonts / The VT323 Project Authors | SIL OFL 1.1 | 可 | **あり**（woff2 を同梱） | 表示は不要。ただしライセンス文の同梱が必要（下記） | https://raw.githubusercontent.com/google/fonts/main/ofl/vt323/OFL.txt |
| Handjet | `app/public/fonts/handjet-latin*.woff2`（自前ホスト） | Google Fonts / The Handjet Project Authors（Rosetta Type） | SIL OFL 1.1 | 可 | **あり**（woff2 を同梱） | 表示は不要。ただしライセンス文の同梱が必要（下記） | https://raw.githubusercontent.com/google/fonts/main/ofl/handjet/OFL.txt |
| Press Start 2P | `index.html`（CDN） | Google Fonts / CodeMan38 | SIL OFL 1.1（予約フォント名あり） | 可 | なし | 不要 | https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/OFL.txt |
| DotGothic16 | `index.html`（CDN） | Google Fonts / Fontworks | SIL OFL 1.1 | 可 | なし | 不要 | https://raw.githubusercontent.com/google/fonts/main/ofl/dotgothic16/OFL.txt |
| Orbitron | `synthwave.theme.ts` の `fontImportUrl`（CDN） | Google Fonts / The League of Moveable Type | SIL OFL 1.1（予約フォント名あり） | 可 | なし | 不要 | https://raw.githubusercontent.com/google/fonts/main/ofl/orbitron/OFL.txt |
| Share Tech Mono | `synthwave.theme.ts` の `fontImportUrl`（CDN） | Google Fonts / Carrois Type Design | SIL OFL 1.1（予約フォント名あり） | 可 | なし | 不要 | https://raw.githubusercontent.com/google/fonts/main/ofl/sharetechmono/OFL.txt |
| PixelMplus10 | `index.html`・`tokens.ts`・`pixel.css`・`LandingPage.css` で指定 | — | — | — | なし | — | **実際には読み込まれていない**。Google Fonts に存在しないファミリーで、単独で問い合わせると HTTP 400 になる（まとめた URL では無視されて 200 が返る）。ファイルも同梱していないため、ライセンス上の問題はない |
| Courier New / Comic Sans MS | CSS の `font-family` | 端末に入っているシステムフォント | — | — | なし | 不要 | フォントを配布していないため対象外 |

**OFL の注意点**: OFL のフォントは、ファイルを配布する場合に著作権表示とライセンス文を一緒に含める必要があります（OFL 第2条）。`app/public/fonts/` の Handjet と VT323 はアプリに同梱して配布しているので、`OFL.txt` を同じフォルダに置いておくのが確実です（末尾の提案を参照）。CDN から読み込むフォントは配布に当たらないため不要です。

## 2. アイコン

| 素材 | ファイル | 出どころ | ライセンス | 商用 | アプリ同梱 | クレジット要否 | 根拠 |
|---|---|---|---|---|---|---|---|
| pixelarticons 2.1.0 | npm の `pixelarticons`（`PixelIcon` コンポーネントと `taskAnimations.ts` が SVG を読み込む。ビルド時に JS に組み込まれる） | Gerrit Halfmann | MIT | 可 | あり（ビルド後の JS に含まれる） | 画面への表示は不要。ライセンス文を配布物に含める必要あり（MIT の条件） | `app/node_modules/pixelarticons/LICENSE`（"MIT License, Copyright (c) 2019 Gerrit Halfmann"） |

## 3. 画像

### 3-1. 自作（自分で作ったもの）

| 素材 | ファイル | 出どころ | 根拠 |
|---|---|---|---|
| ロゴ・アプリアイコン・ファビコン | `app/public/pixdone-*.svg`、`PixDone.svg`、`Pixdone-white.svg`、`app-icon.svg`、`favicon.png`、`icon-192.png`、`icon-512.png`、iOS / Android のアイコンとスプラッシュ | 自作 | `app/scripts/generate-app-icons.mjs` で `pixdone-symbol` から一括生成 |
| LP・OGP 画像 | `app/public/lp-screenshots.png`、`og-image.png` | 自作（アプリの画面写真） | アプリ自身のスクリーンショット |
| エフェクトのスクリーンショット | `app/public/effect-shots/` | 自作（アプリの画面写真） | `app/scripts/capture-effect-shots.mjs` で撮影 |
| エフェクトの動画フレーム | `app/public/effect-video/`（未コミット） | 自作（アプリの画面写真） | `app/scripts/capture-effect-video.mjs` で撮影 |
| エフェクトの模様（ノイズ・スキャンライン） | `app/public/animations.js` 内の SVG データ URI | 自作（コードで生成） | `feTurbulence` などをコードで記述 |
| `vite.svg`、`app/src/assets/react.svg` | — | Vite のテンプレートに入っていたファイル | Vite / React はいずれも MIT。使っていなければ削除してよい |

### 3-2. PixelLab で生成したと推定されるもの（要確認）

PixelLab（https://pixellab.ai ）のアカウントの生成ギャラリーに、名前・サイズ・作成日が対応する生成履歴があります。ただし、ファイルにメタデータが残っておらず、リポジトリ側で 1 対 1 の対応までは確認できていません。**「PixelLab で作ったものか」「手で修正したか」をユーザーが確認してください。**

| 素材 | ファイル | 推定される出どころ | 対応しそうな生成履歴（PixelLab ギャラリー） |
|---|---|---|---|
| 木（小・大） | `app/public/world/forestbit/sprites/tree-small.png`（32×32）、`tree-large.png`（32×64） | PixelLab | 2026-04-06「pixel art, massive ancient tree…」（32×32 と 32×64 あり） |
| アーケード筐体 | `app/public/world/arcade/sprites/cabinet.png`（96×96） | PixelLab（推定） | 2026-04-06〜14「pixel art arcade cabinet…」（32〜128px）。96×96 と同じサイズの履歴はないので、加工した可能性あり |
| T.A.S.K. Agent | `app/public/world/arcade/sprites/agent-arcade-0001〜0004.png`（32×32） | PixelLab（推定） | 2026-04-16「Pixel art secret agent character…」「small cute ghost-like creature…」。追加コミット 3a64308 と同じ日 |
| Forest 版 Agent | `app/public/world/forestbit/sprites/agent-forest-bit-0001〜0004.png` | 上の Agent を色替えしたもの | `app/scripts/recolor-forest-agents.mjs` で生成（コミット e251d97 に記載） |
| 爆弾 | `app/public/sprites/weapons/bomb.png`（32×32） | PixelLab（推定） | 2026-04-06「pixel art black bomb object」（32×32） |
| 剣 | `app/public/sprites/weapons/sword.png`（32×32） | PixelLab（推定） | 2026-04-13「Pixel art sword cursor…」（32×32） |
| ドローン | `app/public/sprites/weapons/drone.png`（64×64） | PixelLab（推定） | 2026-04-10「A small hovering drone with propellers.」（32×32）。XMP に 192×192 の記録があり、拡大や書き出しをした可能性あり |
| スキャンドローン（アニメ） | `app/public/sprites/scan-drone.gif` | PixelLab（推定） | 2026-04-10「Animate this drone sprite…」（9 フレーム） |

**PixelLab の利用規約（Last Updated: 2026-10-30）**: https://pixellab.ai/termsofservice
- 第1.3条・第3.3条: 生成物の著作権はユーザーにあり、商用・非商用を問わず許可なく使える。出力は目的を問わず使用・改変・配布できる。
- クレジット表記の義務は書かれていない。
- 禁止されているのは、生成物を他の AI モデルの学習に使うこと（第1.2条）と、PixelLab のソフトウェア自体を配布すること（第3.2条）。生成した画像をアプリに同梱することは制限されていない。
- 無料プランと有料プランで扱いが違うという記載は、規約にはない（料金ページは未確認）。
- 生成物が第三者の権利を侵害しないことについては、ユーザーが責任を負う（第3.3条）。

| まとめ | ライセンス | 商用 | アプリ同梱 | クレジット要否 |
|---|---|---|---|---|
| PixelLab の生成物 | 生成したユーザーが著作権を持つ（PixelLab 規約） | 可 | 可 | 不要 |

### 3-3. 出どころが分からないもの（要確認）

| 素材 | ファイル | 分かっていること | ユーザーに確認したいこと |
|---|---|---|---|
| ペンギン（freeze エフェクト） | `app/public/assets/penguin.svg` | Figma から書き出した形式の SVG。2026-02-11 の「secret penguin」コミット（6687e5e）で追加 | 自分で描いたものか、素材サイトのものか |
| アーケードのゲーム画面アイコン（6 種） | `app/public/world/arcade/sprites/arcade-{fight,maze,mystery,platformer,racing,shooter}.svg` | Figma から書き出した形式の SVG（`clip0_19_555` という ID が残っている）。コミット 3a64308 で追加 | 自分で描いたものか。既存のゲームの画面写真やキャラクターを元にしていないか |

## 4. 音声

| 素材 | ファイル | 出どころ | ライセンス | 商用 | アプリ同梱 | クレジット要否 | 根拠 |
|---|---|---|---|---|---|---|---|
| フォーカス BGM（retro / synthwave / chill / rain / nightCity） | `app/src/services/bgm.ts`（Web Audio でリアルタイムに合成）、iOS 用に書き出した `app/public/bgm/*.caf` | 自作（コードで合成） | 自作のため不要 | 可 | あり（`.caf`） | 不要 | `bgm.ts` の冒頭に「Web Audio API, no external files」とある。`.caf` は `app/scripts/render-bgm.mjs` が同じ曲を書き出したもの（コミット 63781e5） |
| 効果音（タスク追加・完了・Smash など） | `app/src/services/soundEngine.ts`、`app/public/animations.js`（`AudioContext`） | 自作（コードで合成） | 自作のため不要 | 可 | なし（音声ファイルは使っていない） | 不要 | 音声ファイルを読み込む処理がなく、オシレーターで音を作っている |

**念のため確認**: BGM の旋律は `bgm.ts` に音符として書かれています。既存の曲のメロディをなぞっていないかだけ、ユーザーが確認してください。オリジナルであれば、権利上の問題はありません。

## 5. 結論と、クレジット表記の提案

- **コンテンツ配信権の回答**: 「はい（サードパーティのコンテンツを含む）」＋「必要な権利を持っている」で問題ありません。サードパーティのものはすべて商用利用でき、アプリに同梱できるライセンスです（OFL・MIT・PixelLab 規約）。ただし 3-2 と 3-3 の「要確認」がすべて「自作」か「PixelLab で生成」であることが前提です。
- **画面へのクレジット表記が必須のものはありません**。OFL・MIT・PixelLab のいずれも、アプリの画面にクレジットを出すことは求めていません。
- **ライセンス文の同梱は必要です**。次の2点を入れると条件を満たせます。
  1. `app/public/fonts/` に `OFL.txt` を置く。Handjet と VT323 は著作権者が違うので、`OFL-Handjet.txt` と `OFL-VT323.txt` の 2 ファイルに分ける。
  2. アプリ内に「ライセンス」ページを作り、OFL のフォント名と pixelarticons の MIT ライセンス文を載せる。アカウントページの規約・プライバシーポリシーのリンクの近くに置くのが自然です。npm ライブラリのライセンスもまとめて載せる場合は、ビルド時に一覧を作るツール（`rollup-plugin-license` など）を使う方法もあります。
- **確認が終わったら**、3-2・3-3 の「要確認」を「自作」または「PixelLab で生成（ギャラリーの ID）」に書き換え、この一覧を確定版にしてください。
