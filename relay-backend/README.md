# SOKUJI Allo — Relay Backend

「API利用」モードで、エンドユーザーが自分でGemini APIキーを作らなくても使えるようにするためのリレーサーバー。設計の詳細は`docs/superpowers/specs/2026-07-17-allo-relay-backend-design.md`を参照。

拡張機能側(`src/services/clients/PantarheiGeminiRelayClient.ts`)がFirebase IDトークンを最初のメッセージとして送り、認証・許可リスト(`alloAllowlist`)・レート制限を通過すると、このサーバーがGemini Live APIとの間を中継する。

## ローカル開発

```bash
npm install
gcloud auth application-default login   # 初回のみ。firebase-adminがこの認証情報を使う
cp .env.example .env                    # GEMINI_API_KEYを設定
npm run dev
```

## Cloud Runへのデプロイ(プロジェクト`pantarhei-int-sandbox-prd`、リージョン`asia-northeast1`)

```bash
gcloud run deploy allo-relay-backend \
  --source . \
  --project pantarhei-int-sandbox-prd \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=<value>
```

- `--allow-unauthenticated`は初回デプロイ時に必須(拡張機能からの未認証WebSocket接続を受け付けるため)。2回目以降は`gcloud run services get-iam-policy allo-relay-backend --region asia-northeast1`で`allUsers`に`roles/run.invoker`が付いているか確認できる。
- `GEMINI_API_KEY`など環境変数は、2回目以降の`gcloud run deploy`では前回の値がそのまま引き継がれる(明示的に指定し直す必要はない)。
- 長時間セッションに対応するため、必要ならタイムアウトを延長する: `gcloud run services update allo-relay-backend --region asia-northeast1 --timeout=3600`

Cloud Runが動くサービスアカウントには以下が必要:
- `roles/firebaseauth.admin`(またはそれ相当)— IDトークン検証用
- Firestoreの読み書き権限 — `alloAllowlist`・`alloUsageLog`コレクション用

### デプロイでハマりやすい点

- **`gcloud run deploy --source .`がCloud Buildの権限エラーで失敗する**: `--source .`はCloud Build経由でコンテナをビルドするため、プロジェクトのデフォルトサービスアカウント(`{PROJECT_NUMBER}-compute@developer.gserviceaccount.com`)にビルド権限が必要(このプロジェクトでは`roles/editor`を付与済み)。`cloudbuild.googleapis.com`などAPIの有効化やIAMロールの付与直後は、反映まで数分かかることがある(権限は正しいはずなのにエラーが出る場合、少し待って再実行してみる)。
- **`gcloud auth login`(CLI自体のログイン)と`gcloud auth application-default login`(ADC、クライアントライブラリ用)は別物**。`firebase-admin`はADCを見るので、後者を通しておく必要がある。

## Firestore設定

`alloAllowlist`コレクションに、許可したいテスターのメールアドレスをドキュメントIDとしてドキュメントを作成する(中身は空でよい、存在するかどうかだけ見ている)。ドキュメントが無い = 使用不可。

Firestoreのデータベース名は実際には`(default)`ではなく文字列`default`(括弧なし)。`getFirestore()`を呼ぶ際は`getFirestore('default')`のように明示すること(`auth.ts`・`allowlist.ts`・`usageLog.ts`参照)。

## デプロイ後に必要な拡張機能(`extension/`)側の設定

このリポジトリの中で、relay-backendと拡張機能は別々にデプロイ/ビルドされる。**relay-backendを再デプロイしただけでは拡張機能には何も反映されない**ので、URLが変わった場合は以下も必ずセットで行う。

1. リポジトリルートの`.env`に以下を設定:
   ```
   VITE_PANTARHEI_BACKEND_URL=wss://<デプロイ先のCloud Run URL>
   VITE_ENABLE_PANTARHEI_GEMINI=true
   ```
   - `VITE_BACKEND_URL`(Kizuna本家のバックエンド用、Better Authが読む)とは別の変数。ここに間違って`wss://`のPantaRhei URLを入れると、拡張機能側で`BetterAuthError: Invalid base URL`が発生する。
2. `extension/manifest.json`の`content_security_policy.extension_pages`内、`connect-src`にデプロイ先のURL(`wss://...`)を追加する。**CSPで許可されていない接続はブラウザが黙ってブロックする**(コンソールにエラーは出るが、relay-backend側には接続要求すら届かず、サーバーログも一切残らない)。
3. `npm run extension:build`で再ビルド
4. `chrome://extensions`で拡張機能をリロード。**すでに開いているSokujiのサイドパネル/タブは自動では再読み込みされない**ので、一度完全に閉じてから開き直す。

## トラブルシューティング

| 症状 | よくある原因 |
|---|---|
| `WebSocket error connecting to PantaRhei relay`(詳細なし) | ブラウザの`WebSocket`はエラー詳細を返さない仕様。まずrelay-backend側のログ(`gcloud logging read`)を見て、そもそもリクエストが届いているか確認する |
| ↑ かつrelay-backend側のログに何も残っていない | CSPの`connect-src`にデプロイ先URLが無い(上記「デプロイ後に必要な拡張機能側の設定」参照)か、拡張機能が古いビルドのまま |
| `Uncaught BetterAuthError: Invalid base URL: wss://...` | `VITE_BACKEND_URL`(Kizuna用)に誤ってPantaRheiのURLを設定してしまっている。`VITE_PANTARHEI_BACKEND_URL`と混同していないか確認 |
| `verifyIdToken()`が`incorrect "aud" claim`で失敗 | `auth.ts`の`initializeApp()`に渡す`projectId`が、実際にwebappで使っているFirebaseプロジェクトと一致していない(ローカルの`gcloud`既定プロジェクトに引きずられている可能性) |
| Firestoreアクセスが`5 NOT_FOUND`で失敗 | `getFirestore()`にデータベースID`'default'`を明示的に渡していない(上記「Firestore設定」参照) |
