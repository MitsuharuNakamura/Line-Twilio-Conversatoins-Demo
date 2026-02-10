# メッセージフロー詳細

## インバウンドフロー（LINE → Web Chat）

```
LINE ユーザー
     │ メッセージ送信
     ▼
LINE Platform
     │ Webhook POST
     ▼
ミドルウェア: /webhook/line
     │
     ├─ 1. X-Line-Signature 検証
     ├─ 2. イベントタイプ判定
     ├─ 3. getOrCreateConversation(lineUserId)
     ├─ 4. メッセージタイプ別変換
     │     ├─ text    → body に保存
     │     ├─ sticker → attributes に stickerId, URL
     │     ├─ image   → LINE API でバイナリ取得 → media 添付 or URL
     │     ├─ video   → 同上
     │     ├─ audio   → 同上
     │     ├─ location→ attributes に lat/lng
     │     ├─ file    → LINE API でバイナリ取得 → media 添付
     │     └─ postback→ attributes に data
     ├─ 5. Conversations API でメッセージ追加
     └─ 6. 200 OK 返却（LINE への応答）
              │
              ▼
     Twilio Conversations Service
              │ WebSocket 通知
              ▼
     Web Chat UI (JS SDK)
              │ onMessageAdded イベント
              ▼
     メッセージレンダラーが attributes.type で分岐表示
```

### 重要: LINE バイナリコンテンツの取得

画像・動画・音声・ファイルのバイナリデータはLINE Webhookには含まれない。messageIdを使ってLINE APIから別途取得する必要がある。

```typescript
// LINE Content API でバイナリ取得
const contentResponse = await fetch(
  `https://api-data.line.me/v2/bot/message/${messageId}/content`,
  { headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` } }
);
const blob = await contentResponse.blob();
```

**注意**: バイナリコンテンツは受信後一定期間で失効する。Webhook受信時に即座に取得・保存すること。

## アウトバウンドフロー（Web Chat → LINE）

### テキストメッセージ

```
オペレーター
     │ メッセージ入力 → 送信ボタン
     ▼
Web Chat UI
     │ conversation.sendMessage(body)
     ▼
Twilio Conversations Service
     │ メッセージ保存 + onMessageAdded Webhook 発火
     ▼
ミドルウェア: /webhook/conversations
     │
     ├─ 1. author 判定（LINEユーザーならスキップ）
     ├─ 2. Conversation Attributes から lineUserId 取得
     ├─ 3. LINE Push API でテキスト送信
     └─ 4. 200 OK 返却
              │
              ▼
LINE Platform
              │
              ▼
LINE ユーザーのトーク画面にメッセージ表示
```

### Flex Message / スタンプ等のリッチメッセージ

リッチメッセージはConversations JS SDK経由ではなく、独自APIを経由する。

```
オペレーター
     │ テンプレート選択 → 送信
     ▼
Web Chat UI
     │ POST /api/send/flex (or /api/send/sticker)
     ▼
ミドルウェア
     │
     ├─ 1. LINE Push API で Flex Message / スタンプ送信
     ├─ 2. Conversations API で送信記録をメッセージとして追加
     │     （attributes に type: 'flex_message' 等を保存）
     └─ 3. 200 OK 返却
              │
              ├─→ LINE ユーザーに Flex Message 表示
              └─→ Web UI に送信記録がリアルタイム反映
```

## author 判定ロジック

onMessageAdded Webhookでは全メッセージが通知されるため、LINEユーザーからのメッセージ（ミドルウェアが追加したもの）をLINEに再送しないよう判定が必要。

```typescript
// Conversations Webhook ハンドラ
async function handleConversationsWebhook(event: ConversationsWebhookEvent) {
  const { author, conversationSid, body, attributes } = event;

  // LINEユーザーからのメッセージはスキップ（ミドルウェアが追加したもの）
  // author が "line_" で始まるか、または LINE userId 形式かで判定
  if (isLineUser(author)) {
    return; // LINEへの再送は不要
  }

  // オペレーターからのメッセージのみ LINE に転送
  const conversation = await twilioClient.conversations.v1
    .conversations(conversationSid)
    .fetch();

  const attrs: ConversationAttributes = JSON.parse(conversation.attributes);
  const lineUserId = attrs.lineUserId;

  await sendToLine(lineUserId, body);
}
```

## エラーハンドリング

| エラーケース | 対応 |
|---|---|
| LINE署名検証失敗 | 401を返却、処理中断 |
| Conversation取得失敗 (404以外) | ログ出力、500を返却 |
| LINE Push API失敗 | リトライ (最大3回)、失敗時はConversationにエラーメッセージを追加 |
| バイナリコンテンツ取得失敗 | 代替テキストメッセージとしてConversationに追加 |
| Conversations API失敗 | ログ出力、LINEユーザーには影響なし |
