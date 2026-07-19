# 旅行のしおり（trip-diary）

家族でNotionに入力した旅程・メモ・写真・動画URLをもとに、1ページの旅行記録・しおりサイトを自動生成してGitHub Pagesに公開する。

## 仕組み

1. 家族がNotionのデータベースに予定を入力する（下記スキーマ参照）
2. GitHub Actionsが定期実行（毎日朝6時JST）または手動実行でNotion APIからデータを取得
3. 写真をダウンロードして静的アセット化、動画・地図URLを埋め込み用URLに変換
4. 静的サイトとしてビルドし、GitHub Pagesにデプロイ
5. 家族はURLを開くだけで最新のしおりを閲覧できる

Notion APIキーはGitHub Actions上でのみ使用され、ブラウザ・公開サイトには一切露出しない。

## Notionデータベースのスキーマ

以下のプロパティ名でNotionデータベースを作成する（`scripts/fetch-notion.ts`の`PROPERTY_NAMES`と一致させること）。

| プロパティ名 | 型 | 用途 |
|---|---|---|
| タイトル | タイトル | 予定・場所の名前 |
| 日時 | 日付 | タイムライン順ソート用 |
| メモ | テキスト | 現地メモ・感想 |
| 場所 / マップ | URL | Google Mapsの共有リンク |
| 写真 | ファイル&メディア | 現地で撮った写真（Notionへ直接アップロード） |
| 動画URL | URL | Googleドライブ共有リンク or YouTube限定公開URL |

データベースの「タイトル」（データベース自体の名前）がサイトの旅行タイトルとして使われる。

## ローカル開発手順

1. Notionで内部インテグレーションを作成し、APIキーを取得
2. 対象データベースをそのインテグレーションと共有（データベースページ右上の「…」→「接続の追加」）
3. `.env.example` を `.env` にコピーし、`NOTION_API_KEY` / `NOTION_DATABASE_ID` を設定
4. 依存関係をインストール

   ```bash
   npm install
   ```

5. Notionからデータを取得（初回は必須。実行しないと`src/data/trip-data.json`がサンプルデータのままになる）

   ```bash
   npm run fetch-notion
   ```

6. 開発サーバー起動

   ```bash
   npm run dev
   ```

## 本番ビルド確認

```bash
npm run build
npm run preview
```

## GitHub Pagesへの公開手順（初回のみ）

1. GitHubに新規リポジトリを作成し、このフォルダをpush
2. リポジトリの `Settings → Secrets and variables → Actions` に `NOTION_API_KEY` と `NOTION_DATABASE_ID` を登録
3. `Settings → Pages → Source` を「GitHub Actions」に設定
4. `Actions` タブから `Deploy Trip Diary to GitHub Pages` を手動実行（`workflow_dispatch`）して公開を確認

以降は `main` へのpush・毎日の定期実行・手動実行のいずれかでNotionの最新内容が反映される。

60日間pushが無いとGitHubの仕様で`schedule`トリガーが自動停止するため、更新が滞っている場合は`Actions`タブから手動実行して復旧する。
