# マルチエージェント開発ガイド

## 概要

本プロジェクトは3つの独立したClaude Code Agent（ワーカー）で並行開発する。Orchestrator（メインAgent）が全体を統括し、各Agentにタスクを割り振る。

## Agent 構成

```
┌─────────────────────────────────────────────────────────┐
│                   Orchestrator (メイン)                   │
│                                                         │
│  - 全体進捗管理                                          │
│  - packages/shared の型定義を最初に作成                    │
│  - Agent間の依存関係の解決                                │
│  - 結合テスト                                            │
│  - pnpm-workspace.yaml / ルート package.json 管理        │
└─────────┬───────────────┬───────────────┬───────────────┘
          │               │               │
          ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│  Agent A     │ │  Agent B     │ │  Agent C         │
│  Backend     │ │  UI Core     │ │  UI Components   │
│              │ │              │ │                   │
│  担当:       │ │  担当:       │ │  担当:            │
│  - shared/   │ │  - web-ui/   │ │  - messages/     │
│  - middleware │ │   app/       │ │    各Bubble       │
│              │ │   chat/      │ │  - rich/          │
│              │ │   hooks/     │ │    TemplatePicker │
│              │ │   lib/       │ │    StickerPicker  │
└─────────────┘ └─────────────┘ └─────────────────┘
```

## 開発フェーズとAgent別タスク

### Phase 0: 初期セットアップ（Orchestrator が実行）

Orchestratorが最初に以下を完了させてからAgentを起動する。

```bash
# 1. モノレポ初期化
pnpm init
# pnpm-workspace.yaml 作成
# ルート package.json 作成
# ルート tsconfig.json 作成

# 2. 各パッケージの初期化
mkdir -p packages/{shared,middleware,web-ui}
# 各 package.json, tsconfig.json 作成

# 3. shared パッケージの型定義を作成（最重要）
# → Agent A, B, C 全員がこの型に依存する
```

**shared パッケージの型定義は全Agentの作業開始前に完成させること。**

### Phase 1: MVP（並行開発）

#### Agent A: Backend（shared + middleware）

参照ドキュメント:
- `docs/architecture/data-model.md`
- `docs/architecture/message-flow.md`
- `docs/features/middleware.md`

タスク:

1. **`packages/shared/src/types/`** の型定義を完成
   - `conversation.ts`: ConversationAttributes
   - `message.ts`: MessageAttributes (全タイプ)
   - `line.ts`: LINE Webhook イベント型
   - `api.ts`: ミドルウェアAPI のリクエスト/レスポンス型

2. **`packages/middleware/`** の実装
   - `src/index.ts`: Hono アプリのエントリポイント
   - `src/utils/line-signature.ts`: 署名検証 (Web Crypto API)
   - `src/services/line.ts`: LINE API クライアント
   - `src/services/twilio.ts`: Twilio REST API クライアント
   - `src/services/conversation-manager.ts`: getOrCreateConversation
   - `src/routes/line-webhook.ts`: LINE Webhook ハンドラ
   - `src/routes/conversations-webhook.ts`: Conversations Webhook ハンドラ
   - `src/routes/token.ts`: Access Token 生成
   - `src/handlers/inbound.ts`: メッセージタイプ別変換（text のみ Phase 1）
   - `wrangler.toml`: Workers 設定

完了条件:
- [ ] LINE からテキストメッセージを送ると Conversation にメッセージが追加される
- [ ] Conversation にメッセージを追加すると LINE にテキストが届く
- [ ] Access Token が生成できる

#### Agent B: UI Core（チャットレイアウト + Hooks）

参照ドキュメント:
- `docs/features/web-ui.md`
- `docs/architecture/data-model.md`

タスク:

1. **Next.js プロジェクト初期化**
   - `next.config.ts`, `tailwind.config.ts`
   - `src/app/layout.tsx`, `src/app/page.tsx`

2. **Hooks 実装**
   - `src/hooks/useConversations.ts`: SDK初期化、会話一覧管理
   - `src/hooks/useMessages.ts`: メッセージ取得・リアルタイム受信
   - `src/lib/twilio-client.ts`: Token管理
   - `src/lib/api-client.ts`: ミドルウェアAPIクライアント

3. **チャットコアコンポーネント**
   - `src/components/chat/ConversationList.tsx`: 受信トレイ
   - `src/components/chat/ChatArea.tsx`: チャット画面
   - `src/components/chat/MessageInput.tsx`: 入力エリア
   - `src/app/api/token/route.ts`: Token プロキシ

完了条件:
- [ ] Conversations一覧が表示される
- [ ] 会話を選択するとメッセージ履歴が表示される
- [ ] テキストメッセージをリアルタイムで送受信できる

#### Agent C: UI Components（メッセージレンダラー）

参照ドキュメント:
- `docs/features/message-types.md`
- `docs/features/web-ui.md`

タスク:

1. **MessageRenderer 統合コンポーネント**
   - `src/components/messages/MessageRenderer.tsx`

2. **個別Bubbleコンポーネント**（Phase 1 は TextBubble のみ、残りはスタブ）
   - `src/components/messages/TextBubble.tsx`
   - `src/components/messages/StickerBubble.tsx` (スタブ)
   - `src/components/messages/ImageBubble.tsx` (スタブ)
   - `src/components/messages/VideoBubble.tsx` (スタブ)
   - `src/components/messages/MapBubble.tsx` (スタブ)
   - `src/components/messages/FlexMessagePreview.tsx` (スタブ)

3. **UserInfoPanel**
   - `src/components/chat/UserInfoPanel.tsx`

完了条件:
- [ ] MessageRenderer がattributes.typeで分岐する
- [ ] TextBubble がLINE風のバブルで表示される
- [ ] 他のBubbleはスタブ（プレースホルダ表示）が実装されている

### Phase 2: リッチコンテンツ（並行開発）

#### Agent A
- `handlers/inbound.ts` にスタンプ・画像・動画・位置情報の変換ロジック追加
- R2へのメディアアップロード実装
- `/api/send/sticker` エンドポイント追加

#### Agent B
- `useLineActions` Hook 実装
- スタンプピッカーUI (`StickerPicker.tsx`)

#### Agent C
- 各Bubbleコンポーネントの本実装
  - StickerBubble, ImageBubble, VideoBubble, MapBubble, AudioBubble, FileBubble

### Phase 3: LINEリッチ機能（並行開発）

#### Agent A
- `/api/send/flex` エンドポイント
- `/api/richmenu/switch` エンドポイント
- `/api/templates` エンドポイント
- Flex Message テンプレートシステム

#### Agent B
- TemplatePicker コンポーネント
- リッチメニュー管理UI

#### Agent C
- FlexMessagePreview の本実装
- PostbackBubble の実装

## 依存関係とインターフェース契約

### Agent 間の境界

```
shared/types/ ←── Agent A が定義、Agent B・C が参照
     │
     ├── ConversationAttributes   (Agent B: ConversationList で使用)
     ├── MessageAttributes        (Agent C: MessageRenderer で使用)
     ├── LineWebhookEvent         (Agent A: middleware で使用)
     └── API Request/Response     (Agent B: hooks で使用)
```

### 重要なインターフェース

#### 1. Message Attributes の型（Agent A → Agent C）

Agent A が定義する `MessageAttributes` 型を Agent C の `MessageRenderer` が参照する。
型が変わった場合は Orchestrator が両Agentに通知する。

#### 2. ミドルウェア API（Agent A → Agent B）

Agent A が実装するAPIのリクエスト/レスポンス型を Agent B の `api-client.ts` が参照する。

```typescript
// shared/src/types/api.ts（Agent A が定義）
export interface TokenRequest {
  identity: string;
}
export interface TokenResponse {
  token: string;
}

export interface SendFlexRequest {
  lineUserId: string;
  template: string;
  templateData: Record<string, unknown>;
  altText: string;
}
```

#### 3. MessageRenderer のProps（Agent B → Agent C）

Agent B の `ChatArea` が Agent C の `MessageRenderer` を呼び出す。Props は Twilio SDK の `Message` オブジェクトをそのまま渡す。

```typescript
// Agent C が export するコンポーネント
export function MessageRenderer({ message }: { message: Message }) { ... }
```

## Orchestrator の運用ルール

### タスク起動時

```bash
# Agent A を起動（バックエンド）
claude --task "docs/agents/orchestration.md を読み、Agent A (Backend) の Phase 1 タスクを実行してください。参照ドキュメント: docs/architecture/data-model.md, docs/architecture/message-flow.md, docs/features/middleware.md"

# Agent B を起動（UI Core）
claude --task "docs/agents/orchestration.md を読み、Agent B (UI Core) の Phase 1 タスクを実行してください。参照ドキュメント: docs/features/web-ui.md"

# Agent C を起動（UI Components）
claude --task "docs/agents/orchestration.md を読み、Agent C (UI Components) の Phase 1 タスクを実行してください。参照ドキュメント: docs/features/message-types.md, docs/features/web-ui.md"
```

### 同期ポイント

各Phase完了時にOrchestratorが以下を確認:

1. `pnpm typecheck` が全パッケージで通る
2. 各Agentの完了条件が満たされている
3. パッケージ間のインポートが正しく解決される
4. 結合テスト（LINE → ミドルウェア → Conversations → Web UI の一連の流れ）

### コンフリクト防止

- 各Agentは自分の担当パッケージ/ディレクトリのみ編集する
- `packages/shared/` は Phase 0 で Orchestrator が作成、以降は Agent A が管理
- 型の変更が必要な場合は Agent A が行い、他のAgentはそれに合わせる
- `pnpm-workspace.yaml` と ルートの `package.json` は Orchestrator のみが編集

## ファイル所有権マトリクス

| ファイル/ディレクトリ | 所有者 | 他のAgentの権限 |
|---|---|---|
| `CLAUDE.md` | Orchestrator | 読み取りのみ |
| `docs/` | Orchestrator | 読み取りのみ |
| `pnpm-workspace.yaml` | Orchestrator | 読み取りのみ |
| `packages/shared/` | Agent A | 読み取りのみ |
| `packages/middleware/` | Agent A | アクセス不要 |
| `packages/web-ui/src/app/` | Agent B | 読み取りのみ |
| `packages/web-ui/src/hooks/` | Agent B | 読み取りのみ |
| `packages/web-ui/src/lib/` | Agent B | 読み取りのみ |
| `packages/web-ui/src/components/chat/` | Agent B | 読み取りのみ |
| `packages/web-ui/src/components/messages/` | Agent C | Agent B は import のみ |
| `packages/web-ui/src/components/rich/` | Agent C | Agent B は import のみ |
