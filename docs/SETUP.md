# セットアップガイド

このガイドでは、LINE × Twilio Conversations統合チャットプラットフォームを初めてセットアップする手順を詳しく説明します。

## 📋 事前準備

以下のアカウントとツールを準備してください:

### 必要なアカウント

1. **Twilioアカウント**
   - https://www.twilio.com/try-twilio でサインアップ
   - クレジットカード登録が必要（無料トライアルあり）

2. **LINE Developersアカウント**
   - https://developers.line.biz/ でサインアップ
   - LINE公式アカウントを作成

3. **Cloudflareアカウント**
   - https://dash.cloudflare.com/sign-up でサインアップ
   - Workers無料プランで開始可能

### 必要なツール

```bash
# Node.js 18以上
node --version  # v18.0.0以上

# pnpm 8以上
pnpm --version  # 8.0.0以上

# pnpmがインストールされていない場合
npm install -g pnpm

# Wrangler CLI (Cloudflare Workers)
pnpm install -g wrangler
wrangler login
```

## 🔧 Step 1: Twilioの設定

### 1.1 Conversations Serviceの作成

1. Twilio Console → https://console.twilio.com/
2. 左メニュー → **Conversations** → **Services**
3. **Create new Service** をクリック
4. Friendly Nameを入力（例: `LINE Chat Service`）
5. Service SIDをメモ（`IS...`で始まる文字列）

### 1.2 API Keyの作成

1. Twilio Console → **Account** → **API keys & tokens**
2. **Create API key** をクリック
3. Friendly Nameを入力（例: `LINE Chat API Key`）
4. **Standard** を選択
5. 生成された**SID**と**Secret**をメモ（Secretは一度しか表示されません）

### 1.3 Account SIDとAuth Tokenの取得

1. Twilio Console → **Dashboard**
2. **Account Info**セクションから以下をメモ:
   - Account SID (`AC...`)
   - Auth Token (目のアイコンをクリックして表示)

### 1.4 Webhookの設定（後で実施）

ミドルウェアのデプロイ後に設定します。

## 📱 Step 2: LINEの設定

### 2.1 Messaging API チャネルの作成

1. LINE Developers Console → https://developers.line.biz/console/
2. **新規プロバイダー作成** または既存のプロバイダーを選択
3. **新規チャネル作成** → **Messaging API** を選択
4. 必要事項を入力:
   - チャネル名（例: `カスタマーサポート`）
   - チャネル説明
   - 業種、大業種
5. 作成完了

### 2.2 Channel Access Tokenの発行

1. 作成したチャネルを開く
2. **Messaging API設定** タブ
3. **チャネルアクセストークン（長期）**セクション
4. **発行** ボタンをクリック
5. トークンをメモ

### 2.3 Channel Secretの取得

1. **チャネル基本設定** タブ
2. **Channel Secret** をメモ

### 2.4 Webhookの設定（後で実施）

ミドルウェアのデプロイ後に設定します。

## 💻 Step 3: プロジェクトのセットアップ

### 3.1 リポジトリのクローン

```bash
git clone <repository-url>
cd line-twilio-chat
```

### 3.2 依存関係のインストール

```bash
pnpm install
```

### 3.3 環境変数の設定

#### ミドルウェア用（Cloudflare Workers Secrets）

```bash
cd packages/middleware

# .dev.varsファイルをコピー（ローカル開発用）
cp .dev.vars.example .dev.vars

# .dev.varsを編集して以下を設定
# - TWILIO_ACCOUNT_SID
# - TWILIO_AUTH_TOKEN
# - TWILIO_API_KEY_SID
# - TWILIO_API_KEY_SECRET
# - TWILIO_CONVERSATIONS_SERVICE_SID
# - LINE_CHANNEL_ACCESS_TOKEN
# - LINE_CHANNEL_SECRET
```

#### Web UI用

```bash
cd ../web-ui

# .env.localファイルをコピー
cp .env.example .env.local

# .env.localを編集して以下を設定
# NEXT_PUBLIC_MIDDLEWARE_URL は後で設定
# - TWILIO_ACCOUNT_SID
# - TWILIO_API_KEY
# - TWILIO_API_KEY_SECRET
# - TWILIO_CONVERSATIONS_SERVICE_SID
```

## 🚀 Step 4: ミドルウェアのデプロイ

### 4.1 本番環境用のSecretsを設定

```bash
cd packages/middleware

wrangler secret put TWILIO_ACCOUNT_SID
# プロンプトでAccount SIDを入力

wrangler secret put TWILIO_AUTH_TOKEN
# プロンプトでAuth Tokenを入力

wrangler secret put TWILIO_API_KEY_SID
# プロンプトでAPI Key SIDを入力

wrangler secret put TWILIO_API_KEY_SECRET
# プロンプトでAPI Key Secretを入力

wrangler secret put TWILIO_CONVERSATIONS_SERVICE_SID
# プロンプトでConversations Service SIDを入力

wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
# プロンプトでLINE Channel Access Tokenを入力

wrangler secret put LINE_CHANNEL_SECRET
# プロンプトでLINE Channel Secretを入力
```

### 4.2 デプロイ

```bash
wrangler deploy
```

デプロイ完了後、表示されるURLをメモ（例: `https://line-twilio-chat-middleware.your-account.workers.dev`）

### 4.3 動作確認

```bash
# ヘルスチェック
curl https://your-middleware.workers.dev/

# レスポンス例
# {"message":"LINE × Twilio Conversations Middleware"}
```

## 🔗 Step 5: Webhook URLの設定

### 5.1 Twilio Conversations Webhookの設定

1. Twilio Console → **Conversations** → **Services**
2. 作成したServiceを選択
3. **Webhooks** タブ
4. 以下を設定:
   - **Post-Event URL**: `https://your-middleware.workers.dev/webhook/conversations`
   - **Method**: POST
   - **Filters**: `onMessageAdded` にチェック
5. **Save** をクリック

### 5.2 LINE Webhook URLの設定

1. LINE Developers Console → 作成したチャネル
2. **Messaging API設定** タブ
3. **Webhook設定**セクション:
   - **Webhook URL**: `https://your-middleware.workers.dev/webhook/line`
   - **Webhookの利用**: ONに設定
4. **検証** ボタンをクリックして接続確認
5. 成功したら **更新** をクリック

### 5.3 LINE応答メッセージの無効化（重要）

1. 同じ **Messaging API設定** タブ
2. **LINE公式アカウント機能**セクション
3. **応答メッセージ**: OFF
4. **あいさつメッセージ**: OFF（お好みで）

これをしないと、LINEの自動応答とミドルウェアの両方が反応してしまいます。

## 🖥 Step 6: Web UIのデプロイ

### 6.1 環境変数の更新

```bash
cd packages/web-ui

# .env.localを編集
# NEXT_PUBLIC_MIDDLEWARE_URL=https://your-middleware.workers.dev
```

### 6.2 ビルド

```bash
pnpm build
```

### 6.3 デプロイ（Vercelの場合）

```bash
# Vercel CLIをインストール
pnpm install -g vercel

# ログイン
vercel login

# デプロイ
vercel deploy --prod

# 環境変数を設定
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_API_KEY
vercel env add TWILIO_API_KEY_SECRET
vercel env add TWILIO_CONVERSATIONS_SERVICE_SID
vercel env add NEXT_PUBLIC_MIDDLEWARE_URL
```

### 6.4 その他のホスティング

- **Netlify**: `pnpm build` → `out/`ディレクトリをデプロイ
- **AWS Amplify**: GitHub連携でCI/CDセットアップ
- **自前サーバー**: `pnpm build` → Node.jsで`next start`

## ✅ Step 7: 動作確認

### 7.1 LINEからメッセージ送信

1. LINE公式アカウントをLINEアプリで友だち追加
2. メッセージを送信（例: `こんにちは`）

### 7.2 Web UIで確認

1. Web UIにアクセス（デプロイしたURL）
2. 会話一覧に新しい会話が表示されることを確認
3. 送信したメッセージが表示されることを確認

### 7.3 Web UIから返信

1. 会話を選択
2. メッセージを入力して送信
3. LINEアプリで返信が届くことを確認

## 🐛 トラブルシューティング

### メッセージが届かない場合

#### 1. Cloudflare Workersのログを確認

```bash
wrangler tail line-twilio-chat-middleware --format pretty
```

LINEからメッセージを送信して、ログが出力されるか確認。

#### 2. LINE Webhookの設定を確認

- Webhook URLが正しいか
- Webhookの利用がONになっているか
- 検証ボタンで接続確認できるか

#### 3. Twilio Webhookの設定を確認

- Post-Event URLが正しいか
- Filtersに`onMessageAdded`が含まれているか

### 会話が表示されない場合

#### Participantが追加されているか確認

```bash
curl -X GET \
  "https://conversations.twilio.com/v1/Services/{YOUR_SERVICE_SID}/Conversations" \
  -u "{YOUR_ACCOUNT_SID}:{YOUR_AUTH_TOKEN}"
```

会話SIDを取得したら、Participantを確認:

```bash
curl -X GET \
  "https://conversations.twilio.com/v1/Services/{SERVICE_SID}/Conversations/{CONVERSATION_SID}/Participants" \
  -u "{ACCOUNT_SID}:{AUTH_TOKEN}"
```

Participantが空の場合、手動で追加:

```bash
curl -X POST \
  "https://conversations.twilio.com/v1/Services/{SERVICE_SID}/Conversations/{CONVERSATION_SID}/Participants" \
  -d "Identity=operator-001" \
  -u "{ACCOUNT_SID}:{AUTH_TOKEN}"
```

### 環境変数が設定されているか確認

```bash
# Cloudflare Workers
cd packages/middleware
wrangler secret list

# Web UI（.env.localをチェック）
cd packages/web-ui
cat .env.local
```

## 📚 次のステップ

セットアップが完了したら:

1. `CLAUDE.md` を読んで実装の詳細を理解
2. `docs/architecture/` で設計ドキュメントを確認
3. 機能追加や改善に取り組む

Happy coding! 🎉
