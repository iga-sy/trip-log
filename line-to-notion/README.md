# line-to-notion

LINE公式アカウント（Bot）宛に1:1チャットで送ったテキスト・写真を、自動でNotionのデータベースに追加するWebhookサーバー。Vercel Functions上で動作する。判定・抽出はすべて文字列処理のみで行い、Claude APIなどの有料AI機能は一切使用しない（完全無料で運用できる構成）。

`那須旅行_202409/trip-diary/` とは独立したプロジェクト（依存関係・デプロイ設定は別）。

## 仕組み

1. LINE公式アカウントにメッセージ・写真を送る
2. LINEプラットフォームが `api/webhook.ts` にWebhookを送信
3. `x-line-signature` ヘッダーで送信元を検証（Channel Secretを使ったHMAC-SHA256）
4. テキストはそのまま、画像はLINE Content APIから取得しNotion File Upload APIでアップロード
5. メッセージ本文の1行目が「予定」であれば「予定」データベースへ、そうでなければ「全体感想」データベースへ新規行として追加（判定ロジックは下記「予定フォーマット」参照）

同一Webhookリクエスト内（`events`配列）にまとまっている同一ユーザーのイベントは1行にまとめる。リクエストをまたぐ場合はまとめず別行になる（外部の状態保存を持たないため）。

過去にLINEで送信済みのメッセージは取得できない。今後の投稿のみが対象。

対象は1:1チャットのみ。グループトークでの発言は無視する。

## 予定フォーマット

メッセージの1行目が「予定」という文字列そのものであれば、以降の行を `ラベル: 値` として解析し、「予定」データベースに新規行を作成する。

```
予定
タイトル: 那須どうぶつ王国
日時: 2024-09-15 09:30
リンク: https://example.com
```

- ラベルは「タイトル」「日時」「リンク」の3種類（全角・半角コロン両対応、順不同、リンクは省略可）
- 「日時」は `YYYY-MM-DD HH:mm` または `YYYY-MM-DD` のプレーンテキスト形式
- **「タイトル」と「日時」の両方が揃って初めて「予定」として作成される。** どちらか欠けている、または日時の形式が不正な場合は、安全側としてメッセージ全文がそのまま「全体感想」データベースに投稿として保存される（予定は作られない）
- 「予定」データベース側の「メモ」「コメント(修/美/悠/紗)」欄はLINEからは書き込まれず、常に空欄で作成される。感想やコメントは、これまで通りNotion上でその予定を開いて各自が直接入力する

## Notion側の事前準備

1. 「全体感想」データベースに **files型プロパティ「写真」を追加**
2. Notion Integrationを新規発行し、「Insert content」権限を付与
3. **「全体感想」データベースと「予定」データベースの両方**をそのIntegrationと接続（各データベースページ右上「•••」→「コネクト」）

## 環境変数

`.env.example` を参照。ローカル開発時は `.env` を作成（`.gitignore`済み）。本番はVercel Dashboard → Project Settings → Environment Variables に設定する。

| 変数名 | 取得元 |
|---|---|
| `LINE_CHANNEL_SECRET` | LINE Developersコンソール（Messaging APIチャネルの基本設定） |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Developersコンソール（長期トークン発行） |
| `NOTION_API_KEY` | Notion Integrations（上記で新規発行したもの。trip-diary用の読み取り専用キーとは別にする） |
| `NOTION_COMMENTS_DATABASE_ID` | 「全体感想」データベースのURLに含まれるID（trip-diaryの`.env`と同じ値） |
| `NOTION_DATABASE_ID` | 「予定」データベースのURLに含まれるID（trip-diaryの`.env`と同じ値） |

## LINE公式アカウントのセットアップ

1. LINE Official Account Managerで公式アカウントを作成
2. 「Messaging API」を有効化（LINE Developersコンソールにチャネルが自動反映される）
3. LINE Official Account Manager側「応答設定」で「応答メッセージ」をOFFにする（Webhookのみで処理するため）
4. LINE Developersコンソールの「Messaging API設定」タブで「Webhookの利用」をON
5. Channel Secret・Channel Access Token（長期）を発行して控える
6. デプロイ後、Webhook URLに `https://<デプロイ先ドメイン>/api/webhook` を設定し「検証」ボタンで200が返ることを確認

## ローカル開発

```bash
npm install
npm test         # 単体テスト（署名検証・予定フォーマット判定・プロパティ組み立てロジック。外部通信なし）
npm run typecheck
```

実機Webhookのローカル検証には `vercel dev` ＋ ngrok等のトンネリングツールが必要（LINEプラットフォームからローカル環境に到達させるため）。

## デプロイ

VercelでこのGitHubリポジトリを連携し、**Root Directoryを `line-to-notion` に設定**してインポートする。`vercel.json`は不要（`api/`ディレクトリ規約と Web Standard `fetch` エクスポート形式で自動認識される）。mainブランチへのpushで自動デプロイされる。

## 制約・既知の注意点

- Notion File Upload APIでアップロードしたファイルは、**1時間以内にページへ紐付けないと失効する**（本実装は取得後すぐ紐付けるため通常は問題にならない）
- 無料（Hobby）ワークスペースはNotionファイル1つあたり5MiBまで
- Notion書き込み失敗時はログのみでLINE側には常に200を返す（LINEプラットフォームは非200が続くとWebhookを無効化しうるため）
- LINEのWebhook再送により、同一メッセージが重複してNotionに書き込まれる可能性がある（重複排除は実装していない。手動削除で対応）
