# AI電話応対デモアプリ - 実装計画

## 概要
ブラウザ電話 + AIリアルタイム応対デモアプリをゼロから構築する。

## NPM パッケージ

**本番**: `next@14`, `react@18`, `react-dom@18`, `typescript`, `@twilio/voice-sdk`, `twilio`, `twilio-sync`, `openai`, `ws`
**開発**: `@types/node`, `@types/react`, `@types/react-dom`, `@types/ws`, `tailwindcss@3`, `postcss`, `autoprefixer`, `ts-node`, `eslint`, `eslint-config-next`

---

## Phase 0: プロジェクトスキャフォールディング

| # | ファイル | 内容 |
|---|---------|------|
| 1 | `package.json` | scripts: dev/build/build:server/start |
| 2 | `tsconfig.json` | strict: true, paths alias `@/*` |
| 3 | `tsconfig.server.json` | extends tsconfig, module: commonjs, outDir: dist |
| 4 | `next.config.js` | output: 'standalone' |
| 5 | `tailwind.config.ts` | content: src/**/*.{ts,tsx} |
| 6 | `postcss.config.js` | tailwind + autoprefixer |
| 7 | `.env.example` | 全環境変数のテンプレート |
| 8 | `.gitignore` | node_modules, .next, dist, .env* |

→ `npm install` 実行

## Phase 1: 型定義 + ライブラリ初期化 + API Routes

| # | ファイル | 依存 | 内容 |
|---|---------|------|------|
| 9 | `src/types/index.ts` | なし | CallStatus, TranscriptMessage, WS message types, Session, ApiResponse |
| 10 | `src/app/globals.css` | なし | Tailwind directives |
| 11 | `src/app/layout.tsx` | globals.css | HTML lang=ja, メタ情報 |
| 12 | `src/lib/twilio.ts` | twilio | Twilio REST client + syncService初期化, env var検証 |
| 13 | `src/lib/openai.ts` | openai | OpenAI client, BASE_SYSTEM_PROMPT, FALLBACK_RESPONSES, trimHistory() |
| 14 | `src/lib/prompt-store.ts` | なし | getPrompt()/setPrompt() インメモリストア |
| 15 | `src/app/api/health/route.ts` | なし | GET → { status: 'ok' } |
| 16 | `src/app/api/token/route.ts` | twilio.ts | AccessToken + VoiceGrant生成 |
| 17 | `src/app/api/sync-token/route.ts` | twilio.ts | AccessToken + SyncGrant生成 |
| 18 | `src/app/api/prompt/route.ts` | prompt-store.ts | GET/POST プロンプト保存・取得 |
| 19 | `src/app/api/voice/route.ts` | env var | POST → TwiML XML (ConversationRelay) |

## Phase 2: UIコンポーネント + Voice SDK Hook

| # | ファイル | 依存 | 内容 |
|---|---------|------|------|
| 20 | `src/hooks/useTwilioDevice.ts` | @twilio/voice-sdk, types | Device初期化, connect/disconnect/mute, callSid取得 |
| 21 | `src/components/StatusIndicator.tsx` | types | 通話状態ドット + ラベル表示 |
| 22 | `src/components/PhoneControl.tsx` | types | 通話/停止/ミュートボタン群 |
| 23 | `src/components/PromptEditor.tsx` | なし | textarea + 保存ボタン, /api/prompt連携 |
| 24 | `src/components/TranscriptView.tsx` | types | LINE風チャットバブルUI, 自動スクロール |
| 25 | `src/app/page.tsx` | 全components + hooks | メインページ, フック統合 |

## Phase 3: ConversationRelay WS + OpenAI連携

| # | ファイル | 依存 | 内容 |
|---|---------|------|------|
| 26 | `src/lib/conversation-relay-handler.ts` | twilio.ts, openai.ts, prompt-store.ts | setup→Sync List作成, prompt→OpenAI→WS応答+Sync書込 |
| 27 | `server/ws-server.ts` | next, ws, handler | HTTP+WSサーバー, path: /ws/conversation-relay |

## Phase 4: Twilio Sync連携 + リアルタイム文字起こし

| # | ファイル | 依存 | 内容 |
|---|---------|------|------|
| 28 | `src/hooks/useTwilioSync.ts` | twilio-sync | SyncClient初期化, トークン取得 |
| 29 | `src/hooks/useTranscript.ts` | types, twilio-sync | Sync Listサブスクライブ, messages状態管理 |
| 30 | `src/app/page.tsx` (更新) | Sync hooks | callSid連携でSync自動購読 |

## Phase 5: Cloud Runデプロイ設定

| # | ファイル | 内容 |
|---|---------|------|
| 31 | `Dockerfile` | マルチステージビルド (deps→builder→runner) |
| 32 | `.dockerignore` | node_modules, .next, dist, .env*, docs |

---

## 重要な技術判断

1. **カスタムサーバー必須**: Next.js API RoutesはWebSocket非対応 → `server/ws-server.ts`でHTTP+WS統合
2. **tsconfig.server.json**: `include`に`server/**/*`, `src/lib/**/*`, `src/types/**/*`を含める（WSサーバーがsrc/libをインポートするため）
3. **callSidブリッジ**: クライアント側`call.parameters.CallSid` = サーバー側Sync List名 `transcript-{callSid}`
4. **イミュータビリティ**: WSセッションは`let session`の再代入（ミューテーションではない）で更新
5. **ブラウザ専用パッケージ**: `@twilio/voice-sdk`, `twilio-sync`はクライアントコンポーネントでのみimport

## バグ修正: Sync文字起こしが表示されない

### 原因分析
Syncにデータは書き込まれている（Twilioコンソールで確認済み）がブラウザに表示されない。

### 修正対象ファイル（3ファイル）

#### 1. `src/hooks/useTwilioSync.ts`
- **問題**: `connectionStateChanged`イベントが発火する前にすでにconnectedの場合がある
- **修正**: イベント監視に加え、初期化直後にも`isReady`をチェック

#### 2. `src/hooks/useTranscript.ts`
- **問題1**: `subscribeToCall`が`useCallback`の依存で再生成されるたびuseEffectが再実行→競合
- **問題2**: `getItems`と`on('itemAdded')`の間にメッセージが届くと欠落する
- **修正**:
  - イベントリスナーを先に登録してからgetItemsで既存データを取得する（順序逆転）
  - `subscribeToCall`をuseRefで安定化し、useEffectの無限ループを防止

#### 3. `src/app/page.tsx`
- **問題**: `subscribeToCall`が依存配列にあるため不要な再実行が発生
- **修正**: `subscribeToCall`をrefベースに変更して依存から外す

### 修正後のデプロイ
`gcloud run deploy` で再デプロイ

### 検証方法
1. Cloud Runにデプロイ
2. ブラウザで通話開始
3. LINE風UIにリアルタイムで文字起こしが表示されること確認
4. ブラウザDevToolsのConsoleでエラーが出ていないことを確認
