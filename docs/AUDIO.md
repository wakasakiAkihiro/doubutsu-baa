# いないいないばあの音声

## 配信する素材

| ファイル                     | 台詞               | 長さ     | 形式                           |
| ---------------------------- | ------------------ | -------- | ------------------------------ |
| `public/audio/inai-inai.wav` | いない、いなーい。 | 1.768 秒 | 24 kHz / 16-bit / mono PCM WAV |
| `public/audio/baa.wav`       | ばあー！           | 0.534 秒 | 24 kHz / 16-bit / mono PCM WAV |

2点合計110,574 bytes。VOICEVOX:四国めたん（あまあま、style ID 0）で、このアプリ用の台詞を合成。速度・音高・抑揚を調整し、冒頭と末尾の無音を切り、ピークを0.72に揃え、5 msのフェードを付けています。実在人物の声のクローンや録音の流用はありません。

## 利用条件とクレジット

2026-09-11に次の公式規約を確認しました。商用・非商用のアプリ利用が認められています。公開画面のフッターに **合成音声：VOICEVOX:四国めたん** と常時表記します。

- [VOICEVOXの利用規約](https://voicevox.hiroshiba.jp/term/)
- [四国めたんの音源利用規約と共通規約](https://zunko.jp/con_ongen_kiyaku.html)
- [VOICEVOX音声モデルの規約](https://github.com/VOICEVOX/voicevox_vvm)

音声を再利用・再配布する際も、VOICEVOXおよび音声ライブラリの規約、クレジット表記、共通規約の禁止事項に従ってください。さらに他者へ利用を許諾する場合も、これらの条件を遵守するよう義務付けてください。音声素材をCC0などの無条件利用素材として扱うことはできません。モデルや生成ツールは配信・Git管理に含めません。

## 再生成

生成スクリプトは `scripts/generate-voices.py`。調整後の合成クエリを `docs/inai-inai.query.json` と `docs/baa.query.json` に保存しています。通常のビルドにPythonや音声生成環境は不要です。

1. [VOICEVOX CORE公式リリース](https://github.com/VOICEVOX/voicevox_core/releases/tag/0.17.0) のWindows x64 downloaderとPython wheelを取得。
2. downloaderで `--exclude c-api --models-pattern 0.vvm --output <作業ディレクトリ>` を実行し、規約を確認して準備。今回のモデルは0.16.4、VOICEVOX ONNX Runtimeは1.17.3、辞書はOpen JTalk 1.11。
3. Pythonに公式wheelとNumPyを用意。`VOICEVOX_CORE_DIR` に作業ディレクトリを設定し、`python scripts/generate-voices.py` を実行。
4. 古いMSVC RuntimeでDLL初期化エラーが出る場合、`VOICEVOX_MSVC_DIR` にインストール済みの新しいMicrosoft C++ Runtimeの場所を指定できます。生成プロセス内で先に読み込み、OSのDLLを置換しません。

## 再生と同期

- 最初の画面で2ファイルを同一オリジンから先読み。最初のタップでAudioContextを有効化し、デコード済みバッファを再利用します。
- 隠れる各ターンで「いないいない」、タップで「ばあ」。途中でタップした場合は前の声を停止し、声を重ねません。
- 「ばあ」のBufferSourceの開始と同時に登場状態へ移行。動物は720 msで少し拡大し、跳ねて着地します。登場中の連打で最初の動きを中断しません。
- 読込・再開の待ち時間は最大450 ms。失敗・遅延時は無音で遊びを続け、遅れて届いた音声を再生しません。
- 消音は再生中・準備中の声にも即時反映。非表示タブでは音声と進行を停止。発話中はチャイムを重ねません。
- `prefers-reduced-motion` では動物のアニメーションを省略します。
- ブラウザから外部音声APIへの通信、マイク利用、個人情報送信はありません。
