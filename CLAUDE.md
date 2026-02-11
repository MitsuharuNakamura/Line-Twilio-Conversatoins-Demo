# LINE × Twilio Conversations 統合チャットプラットフォーム

## プロジェクト概要

LINE公式アカウントとTwilio Conversations APIを統合し、独自Web Chat UIでオペレーターがLINEユーザーとメッセージのやり取りを行うプラットフォーム。

## 技術スタック

| コンポーネント | 技術 |
|---|---|
| Web Chat UI | Next.js 15 (App Router) + React + Tailwind CSS |
| ミドルウェア | Hono (Node.js) |
| コンテナ | Google Cloud Run, Docker |
| 会話基盤 | Twilio Conversations API + JS SDK |
| メッセージング | LINE Messaging API |
| メディアストレージ | Twilio Media Content Service (MCS) |
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
│   ├── middleware/               # ミドルウェア (Hono)
│   │   ├── src/
│   │   │   ├── index.ts         # メインアプリケーション
│   │   │   ├── server.ts        # Node.js HTTPサーバー
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
│   │   │   │   ├── twilio.ts     # Twilio API クライアント (MCS対応)
│   │   │   │   └── conversation-manager.ts
│   │   │   ├── handlers/
│   │   │   │   ├── inbound.ts    # LINE→Conversations 変換 (画像/動画対応)
│   │   │   │   └── outbound.ts   # Conversations→LINE 変換
│   │   │   └── utils/
│   │   │       ├── line-signature.ts
│   │   │       └── token-generator.ts
│   │   ├── Dockerfile           # Cloud Run用
│   │   ├── .dev.vars            # 開発用環境変数
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web-ui/                  # Next.js アプリ
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx      # メインチャット画面
│       │   │   ├── login/
│       │   │   │   └── page.tsx  # ログインページ
│       │   │   └── api/
│       │   │       ├── token/route.ts  # トークンプロキシ
│       │   │       └── auth/
│       │   │           ├── login/route.ts   # ログインAPI
│       │   │           └── logout/route.ts  # ログアウトAPI
│       │   ├── middleware.ts     # 認証ミドルウェア
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

### ミドルウェア

`.dev.vars`ファイルを作成:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CONVERSATIONS_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

デプロイ時に環境変数を指定:

```bash
gcloud run deploy line-twilio-chat-middleware \
  --set-env-vars="LINE_CHANNEL_ACCESS_TOKEN=xxx,LINE_CHANNEL_SECRET=xxx,..."
```

### Web UI (.env.local)

```
# Cloud RunのURL
NEXT_PUBLIC_MIDDLEWARE_URL=https://your-service.run.app
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CONVERSATIONS_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 認証用のシークレット（本番環境では強力なランダム文字列を使用）
AUTH_SECRET=your-secret-key-change-in-production
```

## 開発コマンド

```bash
# 依存関係インストール
pnpm install

# 全パッケージ開発サーバー起動
pnpm dev

# 個別起動
pnpm --filter middleware dev     # Node.js版 (localhost:8080)
pnpm --filter web-ui dev        # Next.js (next dev)

# ビルド
pnpm build
pnpm --filter middleware build        # TypeScriptコンパイル (dist/生成)

# 型チェック
pnpm typecheck
```

## デプロイ

**重要**: デプロイ方法の詳細は [`docs/deployment/environment-variables.md`](docs/deployment/environment-variables.md) を参照してください。

### Vercel（Web UI）

```bash
# プロジェクトルートから
vercel --prod

# 環境変数はVercelダッシュボードで設定（推奨）
```

### Google Cloud Run（ミドルウェア - ソースコードデプロイ）

```bash
# プロジェクトルートから
gcloud builds submit --config cloudbuild.yaml

# 環境変数を設定
gcloud run services update line-twilio-chat-middleware \
  --region asia-northeast1 \
  --env-vars-file env.yaml
```

## コーディング規約

- TypeScript strict mode 必須
- 共有型定義は必ず `packages/shared` に定義し各パッケージから参照する
- エラーハンドリングは全てのAPI呼び出しで行う
- LINE Webhookの署名検証は必ず実装する（セキュリティ上必須）
- 環境変数は直接参照せず、型付きのconfig経由でアクセスする
- コンポーネントはServer Components優先、インタラクションが必要な箇所のみClient Components
- **ES Modules対応**: Node.js環境で実行する場合、相対importに`.js`拡張子が必須
  ```typescript
  // ✅ 正しい
  import { LineClient } from '../services/line.js';

  // ❌ 間違い
  import { LineClient } from '../services/line';
  ```
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
| **環境変数とデプロイ** | **`docs/deployment/environment-variables.md`** |

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
- ✅ 自動スクロール
  - 新規メッセージ受信時に最下部へスクロール
  - 画像/動画/スタンプの読み込み待機（遅延リトライ）
  - 会話切り替え時に最新メッセージへスクロール
- ✅ オペレーター認証機能
  - JWT認証（jose library使用）
  - ログインページ（LINE QRコード表示）
  - Next.js middlewareによるルート保護
  - セッション管理（HTTPOnly Cookie）
  - ログアウト機能

#### 4. ミドルウェア実装
- ✅ Hono (Cloudflare Workers / Google Cloud Run対応)
- ✅ LINE Webhook署名検証
- ✅ Twilio REST API クライアント
- ✅ LINE Messaging API クライアント
- ✅ Conversation管理（getOrCreateConversation）
  - 新規作成時: operator-001を自動追加
  - 既存取得時: operator-001が未追加なら自動追加
- ✅ Google Cloud Runデプロイ
  - Node.js HTTPサーバー (`server.ts`)
  - 環境変数のprocess.env対応 (`index-node.ts`)
  - Docker multi-stage build
  - ES Modules完全対応

### Phase 2: メッセージタイプの拡張

#### 1. LINEスタンプ対応
- ✅ LINEスタンプメッセージの受信処理
- ✅ スタンプID/パッケージIDの保存
- ✅ スタンプ画像URLの生成（LINE CDN）
- ✅ Web UIでスタンプ画像表示
- ✅ 画像読み込み失敗時のフォールバック表示

#### 2. 画像メッセージ対応
- ✅ LINE画像メッセージの受信処理
- ✅ LINE Content APIから画像データをダウンロード
- ✅ Twilio MCS (Media Content Service)へアップロード
- ✅ Media SIDをConversationメッセージに添付
- ✅ Web UIで署名付きURLから画像表示
  - `attachedMedia[0].getContentTemporaryUrl()`で署名付きURL取得
  - 読み込み中スピナー表示
  - エラー時のフォールバック表示

#### 3. 動画メッセージ対応
- ✅ LINE動画メッセージの受信処理
- ✅ LINE Content APIから動画データをダウンロード
- ✅ Twilio MCSへアップロード
- ✅ Media SIDをConversationメッセージに添付
- ✅ Web UIで署名付きURLから動画再生
  - HTML5 `<video>`要素で再生
  - コントロール表示
  - 読み込み中とエラー処理

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

### LINEスタンプ画像URL
LINEの公式スタンプ画像はLINE CDNから取得可能:
```
https://stickershop.line-scdn.net/stickershop/v1/sticker/{stickerId}/android/sticker.png
```

**注意点:**
- スタンプIDとパッケージIDは両方保存すること（将来の拡張のため）
- 画像読み込み失敗時のフォールバック表示を実装すること
- カスタムスタンプは異なるURLを使用する可能性がある
- Next.jsで外部画像を表示する場合、`next.config.ts`の`images.remotePatterns`設定は不要（`<img>`タグを使用しているため）

### Twilio MCS (Media Content Service)による画像/動画処理

画像・動画メッセージはTwilio MCSを使用した2ステップ処理:

1. **MCSへのアップロード**
   ```typescript
   const mediaSid = await twilioClient.uploadMediaToMCS('image/jpeg', imageData);
   ```
   - LINE Content APIからバイナリデータを取得
   - Twilio MCS APIにPOST (`https://mcs.us1.twilio.com/v1/Services/{ServiceSid}/Media`)
   - Content-Typeヘッダーを正確に設定
   - レスポンスからMedia SID (`MExxxx`)を取得

2. **Conversationメッセージに添付**
   ```typescript
   await twilioClient.createMediaMessage(conversationSid, mediaSid, author, body, attributes);
   ```
   - `MediaSid`パラメータでMedia SIDを指定
   - メッセージのattributesにメタデータ保存

3. **Web UIでの表示**
   ```typescript
   const tempUrl = await message.attachedMedia[0].getContentTemporaryUrl();
   ```
   - Twilio SDK経由で署名付き一時URLを取得
   - 直接MCS URLは認証エラーになるため使用不可
   - 一時URLには有効期限あり（数時間）

**重要な注意点:**
- MCS URLは認証が必要なため、`attachedMedia`から署名付きURLを取得すること
- Google Cloud Runは大きなメディアファイルのアップロードに十分なタイムアウト（最大60分）とCPU/メモリリソースを持つ

### ES Modules対応の実装詳細

Node.js環境でES Modulesを使用する場合の必須要件:

1. **相対importに`.js`拡張子を追加**
   ```bash
   # 全ての相対importを一括変換
   find packages/middleware/src -name "*.ts" -type f \
     -exec sed -i '' -E "s|from '(\.\./[^']+)'|from '\1.js'|g" {} \;
   ```

2. **tsconfig.json設定**
   ```json
   {
     "compilerOptions": {
       "module": "ES2022",
       "moduleResolution": "node",
       "target": "ES2020",
       "noEmit": false,  // 重要: 出力ファイル生成を有効化
       "outDir": "./dist"
     }
   }
   ```

3. **package.json設定**
   ```json
   {
     "type": "module",  // ES Modulesを使用
     "scripts": {
       "build": "tsc",
       "dev:node": "tsx watch src/server.ts"
     }
   }
   ```

**注意**: Node.jsのES Modulesでは`.js`拡張子が必須。

## セットアップ手順

### 1. Twilio設定
1. Twilio Conversations Serviceを作成
2. Webhookを設定:
   - URL: `https://your-middleware.run.app/webhook/conversations`
   - Method: POST
   - Filters: `onMessageAdded`

### 2. LINE設定
1. LINE Developers Consoleでチャネル作成
2. Webhook URLを設定:
   - `https://your-middleware.run.app/webhook/line`
3. Channel Access TokenとChannel Secretを取得

### 3. Google Cloud Runへミドルウェアデプロイ

```bash
# プロジェクトルートから実行

# 1. 必要なAPIを有効化
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 2. Artifact Registryリポジトリを作成（初回のみ）
gcloud artifacts repositories create line-twilio-chat \
  --repository-format=docker \
  --location=asia-northeast1

# 3. Docker imageをビルド＆プッシュ
gcloud builds submit --tag asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/line-twilio-chat/middleware:latest .

# 4. Cloud Runにデプロイ
gcloud run deploy line-twilio-chat-middleware \
  --image asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/line-twilio-chat/middleware:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars="LINE_CHANNEL_ACCESS_TOKEN=xxx,LINE_CHANNEL_SECRET=xxx,TWILIO_ACCOUNT_SID=xxx,TWILIO_AUTH_TOKEN=xxx,TWILIO_API_KEY_SID=xxx,TWILIO_API_KEY_SECRET=xxx,TWILIO_CONVERSATIONS_SERVICE_SID=xxx"
```

### 4. Web UIデプロイ (Vercel)

```bash
# プロジェクトルートから実行
vercel --prod

# 環境変数をVercelに設定
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_API_KEY
vercel env add TWILIO_API_KEY_SECRET
vercel env add TWILIO_CONVERSATIONS_SERVICE_SID
vercel env add NEXT_PUBLIC_MIDDLEWARE_URL
vercel env add AUTH_SECRET
```

**重要**: 環境変数に改行文字が含まれないよう注意すること。Vercelダッシュボードでの手動設定を推奨。

**デフォルト認証情報**:
- ユーザーID: `twilioroot`
- パスワード: `twilio123`

**LINE QRコード**: `/packages/web-ui/public/line-qr.png` に配置してデプロイ

## トラブルシューティング

### メッセージが届かない場合

1. **ミドルウェアのログ確認**:

   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=line-twilio-chat-middleware" --limit 50
   # リアルタイムログ
   gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=line-twilio-chat-middleware"
   ```

2. **Webhook設定の確認**:
   - Twilio Conversations Webhook URL
   - LINE Webhook URL

3. **環境変数の確認**:

   ```bash
   gcloud run services describe line-twilio-chat-middleware --region asia-northeast1
   ```

### 画像/動画が表示されない場合

1. **Twilio MCSへのアップロード確認**:
   ログに`MCS Response status: 201`と`Media SID: MExxxx`が表示されているか確認

2. **Web UIでの署名付きURL取得確認**:
   ブラウザコンソールで`Failed to load image/video URL`エラーがないか確認

3. **一時URLの期限**:
   Twilioの署名付きURLは一定時間で期限切れになります。ページを再読み込みしてください。

4. **ローカル開発環境での確認**:
   `.dev.vars`ファイルが正しく設定されているか確認してください。

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

### Cloud Runデプロイエラー

1. **Docker buildエラー - dist directory not found**:
   - 原因: `tsconfig.json`で`noEmit: true`が設定されている
   - 解決策: middleware/tsconfig.jsonで`"noEmit": false`を追加

2. **Container failed to start - ES modules error**:
   - 原因: 相対importに`.js`拡張子がない
   - 解決策: 以下のコマンドで一括追加
     ```bash
     find packages/middleware/src -name "*.ts" -type f -exec sed -i '' -E "s|from '(\.\./[^']+)'|from '\1.js'|g" {} \;
     ```

3. **環境変数が認識されない**:
   - 原因: デプロイ時に`--set-env-vars`で指定していない
   - 解決策: `gcloud run services update`で環境変数を設定
