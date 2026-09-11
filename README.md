# どうぶつ ばあ！

タップすると動物が「ばあ！」。1歳前後のお子さまと保護者のための、小さなタッチ絵本です。文字やルールを理解しなくても、触るだけで遊べます。

ソースコード：[wakasakiAkihiro/doubutsu-baa](https://github.com/wakasakiAkihiro/doubutsu-baa)

本番で遊ぶ：[どうぶつ ばあ！](https://doubutsu-baa.vercel.app)

Vercelの専用プロジェクト `doubutsu-baa` に公開済みです。本番URLでも8環境のゲーム操作・画像読み込みを検証しています。詳細は [QA記録](docs/QA.md) を参照してください。

## 遊び方

1. 保護者が「あそぼう」または中央の動物を1回タップします。
2. 草むら・箱・雲・葉っぱ・水面をタップすると動物が登場します。見た目より広い中央エリア全体が反応します。
3. 動物をタップすると、跳ねる・揺れる・ふわっと浮くなどの短い反応と、控えめなオリジナル効果音が出ます。
4. 「つぎは だあれ？」をタップするか、操作せずに7秒待つと次の隠れ場所になります。動物をタップするたびに待ち時間はリセットされます。

正解・不正解、スコア、制限時間、ゲームオーバーはありません。30種類を一巡するまで重複せず、一巡の境目でも同じ動物が続きません。右上の大きな音ボタンで消音できます。音声が使えない環境でも遊べます。

## 30種類の動物

いぬ、ねこ、うさぎ、くま、ぱんだ、ぞう、きりん、さる、らいおん、とら、ひつじ、うし、ぶた、うま、りす、きつね、たぬき、こあら、かば、さい、ぺんぎん、あひる、ひよこ、にわとり、ふくろう、いるか、あざらし、くじら、かえる、かめ。

一覧は `src/data/animals.ts`、重複しない選択処理は `src/game/shuffleBag.ts` にあります。

## 技術構成

React / TypeScript / Vite / CSS / Vitest / Testing Library / Playwright / npm。
静的なWebアプリで、バックエンド、DB、APIキー、環境変数は不要です。

開発時はNode.js 24 LTSを使用しています。依存関係は `package-lock.json` で固定しています。

## ローカル起動

```sh
npm ci
npm run dev
```

ターミナルに表示されるURLを開いてください。同じWi-Fiのスマートフォンで試す場合は `npm run dev -- --host 0.0.0.0` とし、PCのローカルIPアドレスへ接続します。

## テスト・品質チェック

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

`npm run check` は型・lint・整形・unit/UIテスト・本番ビルドをまとめて実行します。
`npm run format` で整形できます。E2Eはビルド後の `dist` を実際に配信してテストします。

E2Eの対象は390×844、412×915、768×1024、1440×900、高さの低いPC1258×622、小型320×568、横向き844×390、およびWebKitのスマートフォン相当です。開始、登場、反応、次のターン、連打、音声失敗、動きの軽減、キーボード、全30種×2周を検証します。

HTMLレポートは `playwright-report/index.html`、スクリーンショットは `artifacts/qa/` に出力します。これらはGit対象外です。

実施済みの検証結果と実機確認の範囲は [QA記録](docs/QA.md) にまとめています。

## 本番ビルド

```sh
npm run build
npm run preview
```

配信用ファイルは `dist/` に生成されます。

## Vercelデプロイ

GitHubのこのリポジトリをVercelの「New Project」から新しいプロジェクトとしてImportし、Framework PresetをVite、Build Commandを `npm run build`、Output Directoryを `dist` にしてDeployします。設定は `vercel.json` にも記載しています。

認証済みCLIの場合：

```sh
npx vercel link
npx vercel deploy --prod
```

必ずこのリポジトリ専用の新規プロジェクトに接続してください。既存の別プロジェクトにリンクしないでください。`.vercel` と認証情報はGit対象外です。

本番に対するE2Eは `BASE_URL` 環境変数を設定して実行できます。

```powershell
$env:BASE_URL = 'https://your-project.vercel.app'
npm run test:e2e
Remove-Item Env:BASE_URL
```

## 画像・音・フォント

- 動物画像：Codex内蔵の画像生成機能で、共通の子犬画像を画風の参照にして1種類ずつ制作したオリジナル画像です。透明背景の600×600 WebPとして `public/animals/` に保存します。
- 画風：柔らかなガッシュ、水彩絵本の質感、丸い形、温かいパステル色。画像に文字、ロゴ、有名キャラクターは含めません。
- 隠れ場所・花・背景：このプロジェクト用に作成したSVGとCSSです。
- 音：「いないいない」「ばあ」の合成音声2点（VOICEVOX:四国めたん）と、Web Audio APIで作る短いチャイム4種類です。声の再生と動物の登場・跳ねる動きを同期させています。生成方法・利用条件は [音声素材](docs/AUDIO.md) に記録し、アプリにもクレジットを表記しています。
- フォント：Zen Maru Gothic（SIL Open Font License 1.1）。必要な文字をプロジェクト内に保存し、ブラウザからGoogle Fontsへ通信しません。ライセンスは `public/fonts/OFL.txt` です。
- 画像の再最適化用スクリプトは `scripts/optimize-assets.mjs`、フォントの準備は `scripts/prepare-font.mjs` です。通常の起動やビルドにこれらの実行は不要です。

画面に必要な動物と次の動物を先読みし、全30枚の一括読み込みを避けます。画像ロードが失敗した場合は、ローカルの絵を表示して遊びを継続します。

生成時のプロンプトは [image-prompts.json](docs/image-prompts.json) に保存しています。30枚の合計は約1.77 MB、最大の画像は約75 KBです。りすは初回画像の背景を再生成で修正し、最終版30枚すべての透明背景を確認しています。

## プライバシーと刺激への配慮

広告、課金、ログイン、アクセス解析、トラッキングCookie、個人情報の保存、カメラ、マイク、位置情報は使いません。効果音は小さな音量に制限し、連打時の同時発音数も制限します。ブラウザを離れると音と進行を停止し、`prefers-reduced-motion` が有効ならアニメーションを省きます。デバイス側の音量は保護者が調整してください。

実機のSafariやChromeは、端末の消音設定や自動再生制限により音が出ないことがあります。その場合も画面操作は継続します。
