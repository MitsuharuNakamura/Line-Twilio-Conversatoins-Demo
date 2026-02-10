# LINE × Twilio Conversations 統合チャットプラットフォーム

## プロジェクト概要

LINE公式アカウントとTwilio Conversations APIを統合し、独自Web Chat UIでオペレーターがLINEユーザーとメッセージのやり取りを行うプラットフォーム。

## 技術スタック

| コンポーネント | 技術 |
|---|---|
| Web Chat UI | Next.js 15 (App Router) + React + Tailwind CSS |
| ミドルウェア | Cloudflare Workers (Hono) |
| 会話基盤 | Twilio Conversations API + JS SDK |
| メッセージング | LINE Messaging API |
| 言語 | TypeScript (全コンポーネント共通) |
| パッケージマネージャ | pnpm |
| モノレポ | pnpm workspaces |

## リポジトリ構造

```
/
├── CLAUDE.md                    # このファイル
├── pnpm-workspace.yaml
├── package.json
├── docs/                        # 設計ドキュメント
│   ├── architecture/
│   │   ├── overview.md          # 全体アーキテクチャ
│   │   ├── data-model.md        # Conversationデータモデル
│   │   └── message-flow.md      # メッセージフロー詳細
│   ├── features/
│   │   ├── middleware.md         # ミドルウェア仕様
│   │   ├── web-ui.md            # Web Chat UI仕様
│   │   ├── line-rich.md         # LINEリッチ機能仕様
│   │   └── message-types.md     # メッセージタイプ対応仕様
│   └── agents/
│       └── orchestration.md     # マルチエージェント開発ガイド
├── packages/
│   ├── shared/                  # 共有型定義・ユーティリティ
│   │   ├── src/
│   │   │   ├── types/           # 共有型定義
│   │   │   │   ├── conversation.ts
│   │   │   │   ├── message.ts
│   │   │   │   └── line.ts
│   │   │   └── constants/       # 共有定数
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── middleware/               # Cloudflare Workers
│   │   ├── src/
│   │   │   ├── index.ts         # エントリポイント (Hono)
│   │   │   ├── routes/
│   │   │   │   ├── line-webhook.ts
│   │   │   │   ├── conversations-webhook.ts
│   │   │   │   ├── token.ts
│   │   │   │   ├── send-flex.ts
│   │   │   │   ├── send-sticker.ts
│   │   │   │   ├── richmenu.ts
│   │   │   │   └── templates.ts
│   │   │   ├── services/
│   │   │   │   ├── line.ts       # LINE API クライアント
│   │   │   │   ├── twilio.ts     # Twilio API クライアント
│   │   │   │   └── conversation-manager.ts
│   │   │   ├── handlers/
│   │   │   │   ├── inbound.ts    # LINE→Conversations 変換
│   │   │   │   └── outbound.ts   # Conversations→LINE 変換
│   │   │   └── utils/
│   │   │       ├── line-signature.ts
│   │   │       └── token-generator.ts
│   │   ├── wrangler.toml
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web-ui/                  # Next.js アプリ
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx      # メインチャット画面
│       │   │   └── api/
│       │   │       └── token/route.ts  # トークンプロキシ
│       │   ├── components/
│       │   │   ├── chat/
│       │   │   │   ├── ConversationList.tsx
│       │   │   │   ├── ChatArea.tsx
│       │   │   │   ├── MessageInput.tsx
│       │   │   │   └── UserInfoPanel.tsx
│       │   │   ├── messages/
│       │   │   │   ├── MessageRenderer.tsx
│       │   │   │   ├── TextBubble.tsx
│       │   │   │   ├── StickerBubble.tsx
│       │   │   │   ├── ImageBubble.tsx
│       │   │   │   ├── VideoBubble.tsx
│       │   │   │   ├── MapBubble.tsx
│       │   │   │   └── FlexMessagePreview.tsx
│       │   │   └── rich/
│       │   │       ├── TemplatePicker.tsx
│       │   │       └── StickerPicker.tsx
│       │   ├── hooks/
│       │   │   ├── useConversations.ts
│       │   │   ├── useMessages.ts
│       │   │   └── useLineActions.ts
│       │   ├── lib/
│       │   │   ├── twilio-client.ts
│       │   │   └── api-client.ts
│       │   └── types/
│       ├── package.json
│       ├── tailwind.config.ts
│       ├── next.config.ts
│       └── tsconfig.json
```

## 環境変数

### ミドルウェア (Cloudflare Workers Secrets)

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CONVERSATIONS_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Web UI (.env.local)

```
NEXT_PUBLIC_MIDDLEWARE_URL=https://middleware.your-domain.workers.dev
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CONVERSATIONS_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 開発コマンド

```bash
# 依存関係インストール
pnpm install

# 全パッケージ開発サーバー起動
pnpm dev

# 個別起動
pnpm --filter middleware dev     # Cloudflare Workers (wrangler dev)
pnpm --filter web-ui dev        # Next.js (next dev)

# ビルド
pnpm build

# 型チェック
pnpm typecheck

# デプロイ
pnpm --filter middleware deploy  # Cloudflare Workers
pnpm --filter web-ui build      # Vercel / その他
```

## コーディング規約

- TypeScript strict mode 必須
- 共有型定義は必ず `packages/shared` に定義し各パッケージから参照する
- エラーハンドリングは全てのAPI呼び出しで行う
- LINE Webhookの署名検証は必ず実装する（セキュリティ上必須）
- 環境変数は直接参照せず、型付きのconfig経由でアクセスする
- コンポーネントはServer Components優先、インタラクションが必要な箇所のみClient Components
- 日本語コメント推奨

## ドキュメント参照ガイド

各機能の実装前に対応するドキュメントを必ず確認すること:

| 実装対象 | 参照ドキュメント |
|---|---|
| 全体設計の把握 | `docs/architecture/overview.md` |
| Conversationの設計 | `docs/architecture/data-model.md` |
| メッセージ送受信の流れ | `docs/architecture/message-flow.md` |
| ミドルウェア実装 | `docs/features/middleware.md` |
| Web UI実装 | `docs/features/web-ui.md` |
| スタンプ・画像等の対応 | `docs/features/message-types.md` |
| Flex Message等の実装 | `docs/features/line-rich.md` |
| マルチエージェント開発 | `docs/agents/orchestration.md` |

## マルチエージェント開発

本プロジェクトは3つの独立したAgent（ワーカー）で並行開発可能な設計。
詳細は `docs/agents/orchestration.md` を参照。

```
Orchestrator (メイン)
├── Agent A: packages/shared + packages/middleware
├── Agent B: packages/web-ui (components/chat + hooks)
└── Agent C: packages/web-ui (components/messages + components/rich)
```

**重要**: 各Agentは作業開始前に `docs/agents/orchestration.md` を読み、自分の担当範囲と依存関係を把握すること。

## 実装済み機能

### Phase 1: 基本的なメッセージング機能

#### 1. LINE → Twilio Conversations → Web UI (受信フロー)
- ✅ LINE Webhookでメッセージ受信
- ✅ LINE User ProfileからConversation作成/取得
- ✅ Conversationに自動的にoperator-001をParticipantとして追加
- ✅ LINEメッセージをTwilio Conversationsに保存
- ✅ Web UIでリアルタイムメッセージ表示
  - `conversationJoined`イベントで新規会話を検出
  - `messageAdded`イベントでメッセージをリアルタイム受信

#### 2. Web UI → Twilio Conversations → LINE (送信フロー)
- ✅ Web UIからメッセージ送信
- ✅ Twilio Conversations Webhookで`onMessageAdded`イベント受信
- ✅ form-urlencoded形式のwebhookデータをパース
- ✅ LINEユーザーからのメッセージは転送しない（無限ループ防止）
- ✅ オペレーターメッセージのみLINE Messaging APIで送信

#### 3. Web UI実装
- ✅ Twilio Conversations JS SDK統合
- ✅ Access Token生成（サーバーサイド `/api/token`）
- ✅ 会話一覧表示（ConversationList）
- ✅ メッセージ表示（ChatArea）
- ✅ メッセージ送信（MessageInput）
- ✅ リアルタイム更新（SDK Events）

#### 4. ミドルウェア実装
- ✅ Cloudflare Workers + Hono
- ✅ LINE Webhook署名検証
- ✅ Twilio REST API クライアント
- ✅ LINE Messaging API クライアント
- ✅ Conversation管理（getOrCreateConversation）
  - 新規作成時: operator-001を自動追加
  - 既存取得時: operator-001が未追加なら自動追加

## 重要な実装ノート

### Twilio Conversations Webhookの形式
Twilio Conversationsのwebhookは**application/x-www-form-urlencoded形式**で送信されるため、`c.req.json()`ではなく`c.req.formData()`を使用すること。

```typescript
// ❌ 間違い
const event = await c.req.json();

// ✅ 正しい
const formData = await c.req.formData();
const event = Object.fromEntries(formData);
```

### Participant自動追加の重要性
Twilio Conversations SDKで会話を取得するには、ユーザーがParticipantとして追加されている必要がある。`getSubscribedConversations()`は**Participantとして追加されている会話のみ**を返す。

そのため、以下の実装が必須:
1. 新規Conversation作成時: `addParticipant(conversationSid, 'operator-001')`
2. 既存Conversation取得時: Participantチェック＆未追加なら`addParticipant()`

### リアルタイム会話検出
Web UI側でリアルタイムに新しい会話を検出するために、以下のイベントをリッスン:
- `conversationAdded`: 新規作成された会話
- `conversationJoined`: Participantとして追加された会話（既存会話に後から追加された場合）

### デフォルトオペレーター
現在は`operator-001`をハードコードしているが、本番環境では以下を検討:
- 環境変数で設定可能にする
- 複数オペレーターをサポート
- 動的なアサイン機能

## セットアップ手順

### 1. Twilio設定
1. Twilio Conversations Serviceを作成
2. Webhookを設定:
   - URL: `https://your-middleware.workers.dev/webhook/conversations`
   - Method: POST
   - Filters: `onMessageAdded`

### 2. LINE設定
1. LINE Developers Consoleでチャネル作成
2. Webhook URLを設定:
   - `https://your-middleware.workers.dev/webhook/line`
3. Channel Access TokenとChannel Secretを取得

### 3. ミドルウェアデプロイ
```bash
cd packages/middleware
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_CONVERSATIONS_SERVICE_SID
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
wrangler secret put LINE_CHANNEL_SECRET
wrangler deploy
```

### 4. Web UIデプロイ
```bash
cd packages/web-ui
# .env.local を作成
pnpm build
# Vercelなどにデプロイ
```

## トラブルシューティング

### メッセージが届かない場合
1. Cloudflare Workersのログを確認: `wrangler tail <worker-name>`
2. Twilio Conversationsのwebhook設定を確認
3. LINE WebhookのURL設定を確認
4. 環境変数が正しく設定されているか確認

### 会話が表示されない場合
1. オペレーターがParticipantとして追加されているか確認:
```bash
curl -X GET "https://conversations.twilio.com/v1/Services/{ServiceSid}/Conversations/{ConversationSid}/Participants" \
  -u "{AccountSid}:{AuthToken}"
```
2. 手動でParticipantを追加:
```bash
curl -X POST "https://conversations.twilio.com/v1/Services/{ServiceSid}/Conversations/{ConversationSid}/Participants" \
  -d "Identity=operator-001" \
  -u "{AccountSid}:{AuthToken}"
```
