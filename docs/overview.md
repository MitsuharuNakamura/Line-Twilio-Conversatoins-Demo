# 全体アーキテクチャ

## システム構成図

```
LINE ユーザー
     │
     │ LINE Messaging API (Webhook / Push API)
     │
     ▼
┌────────────────────────────────────────┐
│     ミドルウェア (Cloudflare Workers)    │
│                                        │
│  - LINE Webhook 受信 / 署名検証         │
│  - Conversation 作成・メッセージ追加     │
│  - LINE Push API 送信                  │
│  - Access Token 生成                   │
│  - Flex Message / リッチメニュー制御     │
└────────────────────────────────────────┘
     │
     │ Twilio Conversations API
     │
     ▼
┌────────────────────────────────────────┐
│     Twilio Conversations Service        │
│                                        │
│  - Conversation (ユーザーごと)          │
│  - Message 履歴                        │
│  - Participant 管理                    │
│  - Webhook (onMessageAdded)            │
└────────────────────────────────────────┘
     │
     │ Conversations JS SDK (WebSocket)
     │
     ▼
┌────────────────────────────────────────┐
│     独自 Web Chat UI (Next.js)          │
│                                        │
│  - 受信トレイ（会話一覧）               │
│  - チャット画面                        │
│  - LINEリッチコンテンツ表示             │
│  - テンプレート送信・リッチメニュー管理   │
└────────────────────────────────────────┘
```

## 役割分担の原則

### Twilio Conversations の責務

- オペレーター側のチャット基盤
- メッセージ履歴の永続化
- JS SDK経由のリアルタイム配信（WebSocket）
- ユーザーごとのConversation管理

### LINE Messaging API の責務

- LINEユーザーへのメッセージ送受信
- リッチ機能（スタンプ、Flex Message、リッチメニュー等）の制御
- **Twilioを経由せずミドルウェアから直接呼び出す**

### ミドルウェアの責務

- LINE ↔ Twilio 間のブリッジ
- LINE Webhookの受信・署名検証
- メッセージタイプの変換・保存
- LINE Push APIでのメッセージ送信
- Conversations Access Tokenの生成
- LINEリッチ機能のAPI呼び出し

### Web Chat UIの責務

- オペレーター向けチャットインターフェース
- Conversations JS SDKによるリアルタイムメッセージ受信
- メッセージタイプ別のレンダリング
- LINEリッチ機能の送信UI（テンプレートピッカー等）

## 通信プロトコル

| 経路 | プロトコル | 認証 |
|---|---|---|
| LINE → ミドルウェア | HTTPS (Webhook POST) | X-Line-Signature (HMAC-SHA256) |
| ミドルウェア → LINE | HTTPS (REST API) | Bearer Token (Channel Access Token) |
| ミドルウェア → Twilio | HTTPS (REST API) | Basic Auth (Account SID + Auth Token) |
| Twilio → ミドルウェア | HTTPS (Webhook POST) | Twilio Request Validation |
| Web UI → Twilio | WebSocket (JS SDK) | Access Token (JWT) |
| Web UI → ミドルウェア | HTTPS (REST API) | JWT or API Key |
