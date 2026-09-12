# ParallelText

[English](README.en.md) | [中文](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

シンプルでオープンソースな[バイリンガル対照翻訳拡張機能](https://github.com/xiaochenstarboys/paralleltext)です。

## ライセンスと出典

本プロジェクトは [fishjar](https://github.com/fishjar) 氏による [kiss-translator](https://github.com/fishjar/kiss-translator) の二次創作であり、上流ライセンスに従い [GNU General Public License v3.0](LICENSE) で公開しています。全文は `LICENSE` ファイルをご覧ください。原作者のオープンソースの貢献に感謝します。

本リポジトリは上流に由来する拡張機能のコア部分を公開するものであり、自社の公式サイト・会員・決済サービス等は公開範囲に含みません。

## 特徴

- [x] シンプルさを保つ
- [x] オープンソース
- [x] 主要ブラウザに対応
  - [x] Chrome/Edge
  - [x] Firefox
- [x] 複数の翻訳サービスに対応
  - [x] Google
  - [x] DeepSeek/Qwen/OpenAI
  - [x] カスタム API
- [x] 一般的な翻訳シーンをカバー
  - [x] ウェブページのバイリンガル対照翻訳
  - [x] 入力ボックス翻訳
    - ショートカットで入力中のテキストを即時翻訳
  - [x] 選択テキスト翻訳
    - [x] 任意のページで翻訳ボックスを開き、複数の翻訳サービスを切り替えて使用
    - [x] 英語辞書
    - [x] 単語の收藏
  - [x] マウスホバー翻訳
- [x] 多様な翻訳表示
  - [x] 自動テキスト認識と手動ルールの2つのモード
    - 自動認識モードでは、ほとんどのサイトでルールを書かずに完全翻訳
    - 手動ルールモードで特定サイトを最適化
  - [x] カラフルな文ごとの対照読み（原文と訳文を同色で対応）
  - [x] 訳文スタイルのカスタマイズ
  - [x] リッチテキスト翻訳（リンクやテキストスタイルを保持）
  - [x] 訳文のみ表示（原文を非表示）
- [x] 翻訳 API の高度な機能
  - [x] カスタム API で理論上あらゆる翻訳 API に対応
  - [x] 翻訳テキストの集約バッチ送信
  - [x] ストリーミング転送でリアルタイム表示
  - [x] カスタム AI 用語辞書
  - [x] すべての API で Hook とカスタムパラメータに対応
- [x] デバイス間データ同期
  - [x] アカウントで收藏・単語帳・翻訳履歴をクラウド同期
- [x] カスタム翻訳ルール
  - [x] ルール購読
  - [x] カスタム専門用語
- [x] カスタムショートカット
  - `Alt+Q` ページ翻訳を切替
  - `Alt+K` 拡張ポップアップを開く/閉じる
  - `Alt+S` 翻訳ボックスを開く
  - `Alt+D` 独立した翻訳ウィンドウを開く
  - `Alt+C` 訳文スタイル切替
  - `Alt+O` 設定ページを開く
  - その他のショートカットはブラウザの拡張機能ショートカットページと設定ページでカスタマイズできます

## インストール

- 公式サイトからダウンロード：[https://www.braintiktok.com](https://www.braintiktok.com)
- Chrome / Edge / Firefox の拡張機能ストアで順次公開予定

## 関連プロジェクト

- コミュニティ購読ルール: [https://github.com/fishjar/kiss-rules](https://github.com/fishjar/kiss-rules)
  - コミュニティが管理する購読ルール一覧（本プロジェクトは公開データソースを利用、ルール形式互換）。

## よくある質問（FAQ）

### ショートカットキーの設定方法

拡張機能の管理ページで設定します。例： 

- chrome [chrome://extensions/shortcuts](chrome://extensions/shortcuts)
- firefox [about:addons](about:addons)

### ルール設定の優先順位は？

個人ルール > 購読ルール > グローバルルール

グローバルルールの優先順位は最も低いですが、フォールバックルールとして非常に重要です。

### API（Ollamaなど）のテストに失敗する

APIテストの失敗には、一般的に以下の原因が考えられます：

- アドレスが間違っている：
  - 例えば `Ollama` にはネイティブAPIアドレスと `Openai` 互換のアドレスがありますが、本プラグインは現在、`Openai` 互換アドレスをサポートしており、`Ollama` ネイティブAPIアドレスはサポートしていません
- 一部のAIモデルが統合翻訳をサポートしていない：
  - この場合、カスタムAPI（Hook）で個別に適配できます。詳細は[カスタムAPIサンプルドキュメント](custom-api_v2.md)を参照してください
- サーバーのクロスドメイン制限によりアクセスが拒否され、403エラーが返される：
  - 例えば `Ollama` を起動する際に、環境変数 `OLLAMA_ORIGINS=*` を追加する必要があります。

### カスタムAPIのhook関数の設定方法

カスタムAPI機能は非常に強力で柔軟性があり、理論的にはどんな翻訳APIにも接続できます。

サンプル参照： [custom-api_v2.md](custom-api_v2.md)

## 今後の計画 

 本プロジェクトは余暇開発のため厳密なスケジュールはありません。コミュニティの参加を歓迎します。初期の構想：

- [x] **テキストの集約送信**：リクエスト戦略を最適化し、API 呼び出し回数を削減。
- [x] **リッチテキスト翻訳の強化**：複雑なページ構造とリッチテキストの正確な翻訳。
- [x] **カスタム/AI API の強化**：ストリーミング転送などの高度な AI 機能。
- [ ] **ルール共建メカニズムの強化**：より柔軟なルール共有・バージョン管理・コミュニティレビュー。

 興味のある方向があれば、本リポジトリの [Issues](https://github.com/xiaochenstarboys/paralleltext/issues) で議論、または PR をお送りください！

## 開発ガイド

```sh
git clone https://github.com/xiaochenstarboys/paralleltext.git
cd paralleltext
pnpm install       # pnpm 9 が必要（.pnpm-version 参照）
pnpm build:chrome  # Chrome 拡張をビルド；Firefox は pnpm build:firefox
```

### 外部トリガーの例

```js
// `toggle_translate`   翻訳を切り替え
// `toggle_styles`      スタイルを切り替え
// `toggle_popup`       コントロールパネルを開く／閉じる
// `toggle_transbox`    翻訳ポップアップを開く／閉じる
// `toggle_hover_node`  マウスオーバー中の段落を翻訳
// `input_translate`    入力欄を翻訳
window.dispatchEvent(new CustomEvent("kiss_translator", {detail: { action: "toggle_translate" }}));
```

## コミュニケーション

- 公式サイト：[https://www.braintiktok.com](https://www.braintiktok.com)
- お問い合わせ：公式サイトの「サポートセンター」よりチケットをご提出ください
