# SOKUJI Allo の使い方

「SOKUJI Allo」は、Webアプリでログイン・翻訳方式を選んだあと、Sokuji Chrome拡張機能に設定を引き継いで使う仕組みです。試す人向けの手順をまとめます。

## 1. Sokuji拡張機能をインストールする

> **注意**: このリポジトリ(`PantaRhei-Developer/PROJ-SOKUJI`)はKizuna AI Labの[Sokuji](https://github.com/kizuna-ai-lab/sokuji)のフォークです。Chromeウェブストアで公開されている版・upstreamのreleasesで配布されている版は、どちらもKizuna側が公開しているオリジナルで、SOKUJI Allo(「API利用」でPantaRheiのリレーサーバーを使う機能)には対応していません。**現時点では、このリポジトリから自分でビルドしてインストールする必要があります。**

1. このリポジトリをclone(または既にある場合はpull)し、SOKUJI Allo対応のブランチ(`fix/pantarhei-gemini-language-config`、`feat/local-inference-onboarding`など、まだ`dev`にマージされていないもの)をcheckoutする(どのブランチを使えばいいか不明な場合は担当者に確認してください)
2. リポジトリルートで`npm install`
3. リポジトリルートに`.env`を用意し、`VITE_PANTARHEI_BACKEND_URL`・`VITE_ENABLE_PANTARHEI_GEMINI=true`を設定する(詳細は`relay-backend/README.md`の「デプロイ後に必要な拡張機能側の設定」を参照)
4. `npm run extension:build`
5. Chromeで`chrome://extensions/`を開き、右上の「デベロッパーモード」を有効化
6. 「パッケージ化されていない拡張機能を読み込む」から`extension/dist`フォルダを選択

(SOKUJI Alloの対応が`dev`/`main`にマージされ、正式なChromeウェブストア版に取り込まれれば、この手順は不要になります。)

## 2. Webアプリを開いてログインする

以下のURLにアクセスし、Googleアカウントでログインします。

https://pantarhei-int-sandbox-prd.web.app

## 3. 翻訳方式を選ぶ

ログイン後、「翻訳方式を選んでください」画面で2つから選びます。

- **ローカルモデル**: 無料。初回のみモデルのダウンロード(数GB)が必要。ブラウザ上で処理するため、レスポンス速度は使っている端末の性能に左右される。
- **API利用**: ダウンロード不要ですぐ使える。裏側でPantaRhei自身のリレーサーバーを経由してGeminiに接続する(自分でAPIキーを用意する必要はない)。

  > **注意**: 「API利用」は現状、事前に許可されたメールアドレスのみ使用可能なデモ段階の機能です。「使えない」場合は、社内の担当者にFirestoreの許可リスト(`alloAllowlist`)への追加を依頼してください。

選んだら「次へ」を押すと、拡張機能に設定が渡されます。

## 4. 拡張機能を開いて使う

「次へ」を押すと拡張機能が自動で開きます(開かない場合は、インストール済みのSokuji拡張機能を手動で開いてください)。あとは通常のSokujiと同じ操作で、マイク/スピーカーを選んで開始できます。

## うまくいかないとき

- 拡張機能がインストールされていない場合、Webアプリ側に「見つかりませんでした」という案内とインストールリンクが表示されます。
- 「API利用」を選んだのにセッションが開始できない場合は、上記の許可リストの登録有無を確認してください。
- それ以外の不具合(接続エラーなど)は、開発側で`relay-backend/README.md`のトラブルシューティングを参照して調査します。
