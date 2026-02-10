# ミドルウェア仕様

## 概要

Cloudflare Workers + Hono で構築するミドルウェア。LINE Messaging APIとTwilio Conversations APIの橋渡しを行う。

## エンドポイント一覧

| エンドポイント | メソッド | 認証 | 説明 |
|---|---|---|---|
| `/webhook/line` | POST | X-Line-Signature | LINE Webhook受信 |
| `/webhook/conversations` | POST | Twilio Signature | Conversations onMessageAdded |
| `/api/token` | POST | JWT | Conversations Access Token生成 |
| `/api/send/flex` | POST | JWT | Flex Message送信 |
| `/api/send/sticker` | POST | JWT | LINEスタンプ送信 |
| `/api/send/template` | POST | JWT | テンプレートメッセージ送信 |
| `/api/richmenu/switch` | POST | JWT | リッチメニュー切り替え |
| `/api/templates` | GET | JWT | Flex Messageテンプレート一覧 |
| `/health` | GET | なし | ヘルスチェック |

## LINE Webhook ハンドラ

### エントリポイント: `POST /webhook/line`

```typescript
// routes/line-webhook.ts
import { Hono } from 'hono';
import { verifyLineSignature } from '../utils/line-signature';

const app = new Hono();

app.post('/webhook/line', async (c) => {
  // 1. 署名検証
  const signature = c.req.header('X-Line-Signature');
  const body = await c.req.text();
  if (!verifyLineSignature(body, signature, c.env.LINE_CHANNEL_SECRET)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // 2. イベント処理
  const { events } = JSON.parse(body);
  await Promise.all(events.map(event => handleLineEvent(event, c.env)));

  return c.json({ ok: true });
});
```

### LINE イベントタイプ別処理

```typescript
async function handleLineEvent(event: LineWebhookEvent, env: Env) {
  switch (event.type) {
    case 'message':
      await handleMessage(event, env);
      break;
    case 'postback':
      await handlePostback(event, env);
      break;
    case 'follow':
      // フォロー時: ウェルカムメッセージ送信など
      await handleFollow(event, env);
      break;
    case 'unfollow':
      // ブロック時: Conversation をクローズ
      await handleUnfollow(event, env);
      break;
  }
}
```

### 署名検証の実装

```typescript
// utils/line-signature.ts
import { createHmac } from 'node:crypto';

export function verifyLineSignature(
  body: string,
  signature: string | undefined,
  channelSecret: string
): boolean {
  if (!signature) return false;
  const hash = createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}
```

**注意**: Cloudflare Workers では `node:crypto` の代わりに Web Crypto API を使用する:

```typescript
export async function verifyLineSignature(
  body: string,
  signature: string | undefined,
  channelSecret: string
): Promise<boolean> {
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hash = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return hash === signature;
}
```

## Conversations Webhook ハンドラ

### エントリポイント: `POST /webhook/conversations`

```typescript
// routes/conversations-webhook.ts
app.post('/webhook/conversations', async (c) => {
  const event = await c.req.json();

  // onMessageAdded イベントのみ処理
  if (event.EventType !== 'onMessageAdded') {
    return c.json({ ok: true });
  }

  const { Author, ConversationSid, Body, Attributes } = event;

  // LINEユーザーからのメッセージはスキップ
  if (Author.startsWith('U') && Author.length === 33) {
    return c.json({ ok: true });
  }

  // Conversation Attributes から lineUserId を取得
  const conversation = await fetchConversation(ConversationSid, c.env);
  const attrs = JSON.parse(conversation.attributes);

  // LINE Push API で送信
  await sendLineMessage(attrs.lineUserId, Body, c.env);

  return c.json({ ok: true });
});
```

## Access Token 生成

```typescript
// routes/token.ts
import { jwt } from 'twilio';

app.post('/api/token', async (c) => {
  const { identity } = await c.req.json();

  // Twilio Access Token 生成
  const token = new jwt.AccessToken(
    c.env.TWILIO_ACCOUNT_SID,
    c.env.TWILIO_API_KEY_SID,
    c.env.TWILIO_API_KEY_SECRET,
    { identity, ttl: 3600 }
  );

  // Conversations Grant 追加
  const grant = new jwt.AccessToken.ChatGrant({
    serviceSid: c.env.TWILIO_CONVERSATIONS_SERVICE_SID,
  });
  token.addGrant(grant);

  return c.json({ token: token.toJwt() });
});
```

**注意**: Cloudflare Workers では twilio ライブラリの JWT 生成部分が動かない場合がある。その場合は `jose` ライブラリで手動生成する。

## Twilio クライアント

```typescript
// services/twilio.ts
// Cloudflare Workers では Twilio Node.js SDK が使えないため REST API を直接叩く

export class TwilioClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(accountSid: string, authToken: string) {
    this.baseUrl = `https://conversations.twilio.com/v1`;
    this.authHeader = 'Basic ' + btoa(`${accountSid}:${authToken}`);
  }

  async getConversation(uniqueName: string) {
    const res = await fetch(`${this.baseUrl}/Conversations/${uniqueName}`, {
      headers: { Authorization: this.authHeader },
    });
    if (!res.ok) throw new Error(`Conversation not found: ${res.status}`);
    return res.json();
  }

  async createConversation(params: CreateConversationParams) {
    const res = await fetch(`${this.baseUrl}/Conversations`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params as any),
    });
    return res.json();
  }

  async addMessage(conversationSid: string, params: AddMessageParams) {
    const res = await fetch(
      `${this.baseUrl}/Conversations/${conversationSid}/Messages`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params as any),
      }
    );
    return res.json();
  }
}
```

## LINE クライアント

```typescript
// services/line.ts
export class LineClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async pushMessage(to: string, messages: LineMessage[]) {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ to, messages }),
    });
  }

  async getProfile(userId: string): Promise<LineProfile> {
    const res = await fetch(
      `https://api.line.me/v2/bot/profile/${userId}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    return res.json();
  }

  async getContent(messageId: string): Promise<ArrayBuffer> {
    const res = await fetch(
      `https://api-data.line.me/v2/bot/message/${messageId}/content`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    return res.arrayBuffer();
  }
}
```

## Cloudflare Workers 固有の注意事項

- `twilio` npm パッケージは Node.js 依存が多いため使用不可。REST API を直接叩く
- JWT 生成は `jose` ライブラリを使用
- `node:crypto` の代わりに Web Crypto API を使用
- wrangler.toml で `compatibility_flags = ["nodejs_compat"]` を設定
- Secrets は `wrangler secret put` で登録
