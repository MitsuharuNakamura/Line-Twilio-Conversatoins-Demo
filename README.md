# LINE × Twilio Conversations 統合チャットプラットフォーム

LINE公式アカウントとTwilio Conversations APIを統合し、独自のWeb Chat UIでオペレーターがLINEユーザーとリアルタイムにメッセージのやり取りを行うプラットフォームです。

## 🚀 主な機能

- **双方向メッセージング**: LINEユーザー ↔ オペレーター間でリアルタイムチャット
- **Web Chat UI**: Next.js + Twilio Conversations SDKによるモダンなUI
- **サーバーレス**: Cloudflare Workersで高速・低コスト運用
- **TypeScript**: フルスタックTypeScriptで型安全な開発
- **モノレポ構成**: pnpm workspacesで効率的な管理

## 📋 前提条件

- Node.js 18以上
- pnpm 8以上
- Twilioアカウント（Conversations Service設定済み）
- LINE Developersアカウント（チャネル作成済み）
- Cloudflareアカウント（Workers利用可能）

## 🛠 セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd line-twilio-chat
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

#### ミドルウェア (Cloudflare Workers Secrets)

```bash
cd packages/middleware

# Twilio設定
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_API_KEY_SID
wrangler secret put TWILIO_API_KEY_SECRET
wrangler secret put TWILIO_CONVERSATIONS_SERVICE_SID

# LINE設定
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
wrangler secret put LINE_CHANNEL_SECRET
```

#### Web UI

```bash
cd packages/web-ui
cp .env.local.example .env.local
# .env.localを編集して以下を設定:
# - NEXT_PUBLIC_MIDDLEWARE_URL
# - TWILIO_ACCOUNT_SID
# - TWILIO_API_KEY_SID
# - TWILIO_API_KEY_SECRET
# - TWILIO_CONVERSATIONS_SERVICE_SID
```

### 4. Twilio Conversations Webhookの設定

Twilio Consoleで以下を設定:

1. Conversations Service → Configuration → Webhooks
2. **Post-Event URL**: `https://your-worker.workers.dev/webhook/conversations`
3. **Method**: POST
4. **Events**: `onMessageAdded`

### 5. LINE Webhook URLの設定

LINE Developers Consoleで以下を設定:

1. チャネル設定 → Messaging API設定
2. **Webhook URL**: `https://your-worker.workers.dev/webhook/line`
3. **Webhookの利用**: 有効化

### 6. デプロイ

#### ミドルウェアのデプロイ

```bash
cd packages/middleware
wrangler deploy
```

#### Web UIのデプロイ

```bash
cd packages/web-ui
pnpm build

# Vercelの場合
vercel deploy

# または他のホスティングサービスへデプロイ
```

## 🧪 開発

### ローカル開発サーバーの起動

```bash
# 全パッケージを同時に起動
pnpm dev

# または個別に起動
pnpm --filter middleware dev    # Cloudflare Workers (localhost:8787)
pnpm --filter web-ui dev        # Next.js (localhost:3000)
```

### 型チェック

```bash
pnpm typecheck
```

### ビルド

```bash
pnpm build
```

## 📁 プロジェクト構成

```
line-twilio-chat/
├── packages/
│   ├── shared/              # 共有型定義・ユーティリティ
│   ├── middleware/          # Cloudflare Workers (Hono)
│   │   ├── src/
│   │   │   ├── routes/      # APIルート
│   │   │   ├── services/    # LINE/Twilioクライアント
│   │   │   └── handlers/    # メッセージ変換ハンドラ
│   │   └── wrangler.toml
│   └── web-ui/              # Next.js App
│       ├── src/
│       │   ├── app/         # Next.js App Router
│       │   ├── components/  # Reactコンポーネント
│       │   ├── hooks/       # Twilio SDK hooks
│       │   └── lib/         # ユーティリティ
│       └── package.json
├── docs/                    # 設計ドキュメント
├── CLAUDE.md               # AI開発用ドキュメント
└── README.md               # このファイル
```

## 🔧 技術スタック

| 層 | 技術 |
|---|---|
| フロントエンド | Next.js 15, React, Tailwind CSS |
| バックエンド | Cloudflare Workers, Hono |
| リアルタイム通信 | Twilio Conversations JS SDK |
| メッセージング | LINE Messaging API |
| 言語 | TypeScript (strict mode) |
| パッケージ管理 | pnpm workspaces |

## 📊 アーキテクチャ

### メッセージフロー

#### LINE → Web UI
1. LINEユーザーがメッセージ送信
2. LINE → ミドルウェアのWebhook (`/webhook/line`)
3. ミドルウェア → Twilio Conversations API でメッセージ保存
4. Twilio SDK → Web UIにリアルタイム配信 (`messageAdded`イベント)

#### Web UI → LINE
1. オペレーターがWeb UIでメッセージ送信
2. Web UI → Twilio Conversations API でメッセージ保存
3. Twilio → ミドルウェアのWebhook (`/webhook/conversations`)
4. ミドルウェア → LINE Messaging API でメッセージ送信

## 🐛 トラブルシューティング

### メッセージが届かない

1. **Cloudflare Workersのログ確認**:
   ```bash
   wrangler tail <worker-name>
   ```

2. **Webhook設定の確認**:
   - Twilio Conversations Webhook URL
   - LINE Webhook URL

3. **環境変数の確認**:
   ```bash
   wrangler secret list
   ```

### 会話が表示されない

オペレーターがParticipantとして追加されているか確認:

```bash
curl -X GET \
  "https://conversations.twilio.com/v1/Services/{ServiceSid}/Conversations/{ConversationSid}/Participants" \
  -u "{AccountSid}:{AuthToken}"
```

Participantが空の場合、手動で追加:

```bash
curl -X POST \
  "https://conversations.twilio.com/v1/Services/{ServiceSid}/Conversations/{ConversationSid}/Participants" \
  -d "Identity=operator-001" \
  -u "{AccountSid}:{AuthToken}"
```

## 📝 重要な実装ノート

### Twilio Conversations Webhookの形式

Twilioのwebhookは`application/x-www-form-urlencoded`形式で送信されます:

```typescript
// ✅ 正しい
const formData = await c.req.formData();
const event = Object.fromEntries(formData);

// ❌ 間違い
const event = await c.req.json();
```

### Participant自動追加

`getSubscribedConversations()`はParticipantとして追加されている会話のみを返すため、以下の実装が必須:

- 新規Conversation作成時: `addParticipant(conversationSid, 'operator-001')`
- 既存Conversation取得時: 未追加なら`addParticipant()`

### リアルタイム会話検出

以下のイベントをリッスンして新しい会話を検出:

- `conversationAdded`: 新規作成
- `conversationJoined`: Participantとして追加された既存会話

## 📄 ライセンス

MIT

## 🤝 コントリビューション

開発に参加する場合は、`CLAUDE.md`と`docs/`配下のドキュメントを必ず確認してください。

## 📞 サポート

Issue や Pull Request をお待ちしています！
