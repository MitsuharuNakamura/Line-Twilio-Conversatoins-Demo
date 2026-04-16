# LINE × Twilio Conversations 連携チャット基盤の作り方

LINE公式アカウントに届いたメッセージを、Twilio Conversationsを会話基盤にして独自Web UIでリアルタイムに返信できるプラットフォームを作りました。テキストだけでなく、スタンプ・画像・動画にも対応しています。

本記事では **LINEとTwilioをどう繋ぐか**、**LINEスタンプをWebにどう表示するか**、**画像と動画をどう橋渡しするか** の3点に絞って解説します。

---

## 1. LINEとTwilio Conversationsの連携

### アーキテクチャの全体像

```
┌──────────┐     Webhook (JSON)     ┌──────────────┐    REST API    ┌──────────────────────┐
│ LINE     │ ──────────────────────→│ Middleware    │──────────────→│ Twilio Conversations │
│ Platform │                        │ (Hono)       │               │                      │
│          │←──────────────────────│              │←──────────────│                      │
└──────────┘   LINE Messaging API   └──────────────┘   Webhook     └──────────────────────┘
                                                    (form-urlencoded)        ↕ SDK
                                                                    ┌──────────────────────┐
                                                                    │ Web UI (Next.js 15)  │
                                                                    └──────────────────────┘
```

ポイントは、LINEとTwilioの間にHonoで作ったミドルウェアを挟み、双方向のWebhookを相互変換していることです。

### 受信フロー: LINE → Twilio Conversations

LINEユーザーがメッセージを送ると、LINE PlatformがWebhookでミドルウェアを叩きます。ミドルウェアはそのメッセージをTwilio Conversations APIに書き込みます。

Webhookルートの実装:

```typescript
// packages/middleware/src/routes/line-webhook.ts
app.post('/webhook/line', async (c) => {
  const body = await c.req.text();
  const webhookBody: LineWebhookRequestBody = JSON.parse(body);

  const lineClient = new LineClient(c.env.LINE_CHANNEL_ACCESS_TOKEN);
  const twilioClient = new TwilioClient(
    c.env.TWILIO_ACCOUNT_SID,
    c.env.TWILIO_AUTH_TOKEN,
    c.env.TWILIO_CONVERSATIONS_SERVICE_SID
  );

  // 複数イベントを並列処理
  const results = await Promise.allSettled(
    webhookBody.events.map(async (event) => {
      switch (event.type) {
        case 'message':
          await handleLineMessageEvent(event, lineClient, twilioClient);
          return { type: 'message', success: true };
        case 'postback':
          await handleLinePostbackEvent(event, lineClient, twilioClient);
          return { type: 'postback', success: true };
      }
    })
  );
  return c.json({ ok: true });
});
```

LINEのWebhookは1リクエストに複数イベントが入ることがあります。`Promise.allSettled` で並列処理し、1つのイベントが失敗しても他に影響しないようにしています。

### Conversation管理: LINE UserごとにConversationを1つ

LINE UserごとにTwilio Conversationを1つ紐づけます。`uniqueName` に `line_{lineUserId}` を使い、初回は作成、2回目以降は取得するパターンです。

```typescript
// packages/middleware/src/services/conversation-manager.ts
export async function getOrCreateConversation(
  twilioClient: TwilioClient,
  lineUserId: string,
  lineProfile: LineProfile
): Promise<TwilioConversation> {
  const uniqueName = `line_${lineUserId}`;
  const defaultOperator = 'operator-001';

  try {
    // 既存のConversationを取得
    const conversation = await twilioClient.getConversation(uniqueName);

    // 属性を更新（プロフィール画像の変更、タイムスタンプ等）
    const attrs: ConversationAttributes = JSON.parse(conversation.attributes);
    attrs.lastLineMessageAt = new Date().toISOString();
    if (attrs.status === 'closed') {
      attrs.status = 'open'; // クローズ済みなら再オープン
    }
    attrs.lineDisplayName = lineProfile.displayName;
    attrs.lineProfilePictureUrl = lineProfile.pictureUrl ?? null;

    // オペレーターをParticipantに追加（409は無視）
    try {
      await twilioClient.addParticipant(conversation.sid, defaultOperator);
    } catch (err) {
      if (err instanceof Error && !err.message.includes('already exists')) {
        console.warn('Failed to add operator as participant:', err);
      }
    }

    return await twilioClient.updateConversation(conversation.sid, {
      Attributes: JSON.stringify(attrs),
      FriendlyName: lineProfile.displayName,
    });
  } catch (error) {
    // 404の場合は新規作成
    if (error instanceof Error && error.message.includes('not found')) {
      const attrs: ConversationAttributes = {
        channel: 'line',
        lineUserId,
        lineDisplayName: lineProfile.displayName,
        lineProfilePictureUrl: lineProfile.pictureUrl ?? null,
        status: 'open',
        assignedOperator: null,
        tags: [],
        createdAt: new Date().toISOString(),
        lastLineMessageAt: new Date().toISOString(),
      };

      const conversation = await twilioClient.createConversation({
        UniqueName: uniqueName,
        FriendlyName: lineProfile.displayName,
        Attributes: JSON.stringify(attrs),
      });

      await twilioClient.addParticipant(conversation.sid, defaultOperator);
      return conversation;
    }
    throw error;
  }
}
```

ここで重要なのが **Participantの自動追加** です。Twilio Conversations JS SDKの `getSubscribedConversations()` は、自分がParticipantとして追加されている会話しか返しません。オペレーターを毎回追加しておかないと、Web UIに会話が表示されません。既に追加済みの場合は409エラーが返りますが、それは正常系として握り潰します。

### 送信フロー: Twilio Conversations → LINE

Web UIからオペレーターがメッセージを送ると、Twilio Conversations SDKが直接メッセージを書き込みます。するとTwilio側から `onMessageAdded` Webhookがミドルウェアに飛んできます。

ここで注意が必要なのが **Webhookのデータ形式** です。LINEのWebhookはJSON形式ですが、Twilio Conversationsは **form-urlencoded形式** で送ってきます。

```typescript
// packages/middleware/src/routes/conversations-webhook.ts
app.post('/webhook/conversations', async (c) => {
  // ❌ c.req.json() では取れない
  // ✅ form-urlencoded形式でパース
  const formData = await c.req.formData();
  const event: ConversationsWebhookEvent = Object.fromEntries(formData) as any;

  if (event.EventType !== 'onMessageAdded') {
    return c.json({ ok: true });
  }

  await handleConversationsMessageAdded(event, lineClient, twilioClient);
  return c.json({ ok: true });
});
```

### 無限ループの防止

双方向ブリッジの最大の罠がメッセージの無限ループです。

1. LINEユーザーがメッセージ送信
2. ミドルウェアがTwilio Conversationsに書き込む
3. Twilio `onMessageAdded` Webhookが発火
4. ミドルウェアがLINEにメッセージ送信 ← ここが問題
5. 1に戻って無限ループ

解決策として、メッセージのAuthorがLINE User IDのパターン（`U` + 32文字の16進数 = 33文字）に一致する場合はスキップします。

```typescript
// packages/middleware/src/services/conversation-manager.ts
export function isLineUserId(author: string): boolean {
  return author.startsWith('U') && author.length === 33;
}

// packages/middleware/src/handlers/outbound.ts
export async function handleConversationsMessageAdded(
  event: ConversationsWebhookEvent,
  lineClient: LineClient,
  twilioClient: TwilioClient
): Promise<void> {
  // LINEユーザーからのメッセージはスキップ
  if (isLineUserId(event.Author)) {
    return;
  }

  if (!event.Body) return;

  const conversation = await twilioClient.getConversationBySid(event.ConversationSid);
  const attrs: ConversationAttributes = JSON.parse(conversation.attributes);

  if (attrs.channel !== 'line') return;

  // オペレーターのメッセージだけLINEに転送
  await lineClient.pushMessage(attrs.lineUserId, [
    { type: 'text', text: event.Body },
  ]);
}
```

Twilio Conversations側のAuthorには、受信時にLINE User IDをそのまま設定しているため、この判定が可能になります。

---

## 2. LINEスタンプをWeb UIに表示する

LINEのスタンプは、テキストでもなく画像添付でもない独自のメッセージタイプです。Twilio Conversationsにはスタンプという概念がないため、独自の仕組みでWeb UIに表示します。

### ミドルウェア: スタンプ情報の保存

LINEのWebhookで受信したスタンプメッセージには `stickerId` と `packageId` が含まれます。これをTwilio Conversationsの **message attributes** に格納します。

```typescript
// packages/middleware/src/handlers/inbound.ts
async function handleStickerMessage(
  message: LineStickerMessage,
  conversationSid: string,
  twilioClient: TwilioClient,
  lineUserId: string
): Promise<void> {
  // LINEスタンプの画像URLを生成
  const stickerUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${message.stickerId}/android/sticker.png`;

  const attrs: StickerMessageAttributes = {
    type: 'sticker',
    stickerId: message.stickerId,
    packageId: message.packageId,
    stickerUrl,
  };

  await twilioClient.createMessage(conversationSid, {
    Author: lineUserId,
    Body: `[Sticker: ${message.packageId}/${message.stickerId}]`,
    Attributes: JSON.stringify(attrs),
  });
}
```

ポイントは2つあります。

**1. LINE CDNのスタンプ画像URL**

LINEの公式スタンプ画像は以下のパターンのURLで取得できます:

```
https://stickershop.line-scdn.net/stickershop/v1/sticker/{stickerId}/android/sticker.png
```

このURLは認証不要で、ブラウザから直接アクセスできます。LINE Content APIのようにアクセストークンが必要なメディアとは異なり、CDNへの直リンクで済むのがスタンプのシンプルな点です。

**2. Attributes活用によるメッセージタイプの拡張**

Twilio Conversationsのメッセージには `Body`（テキスト）と `Attributes`（任意のJSONメタデータ）があります。Attributesに `type: 'sticker'` とスタンプ情報を入れることで、Web UI側でメッセージの種類を判別し、表示を切り替えられます。

型定義は共有パッケージで管理:

```typescript
// packages/shared/src/types/message.ts
export type MessageAttributes =
  | TextMessageAttributes
  | StickerMessageAttributes
  | ImageMessageAttributes
  | VideoMessageAttributes
  | ...;

export interface StickerMessageAttributes {
  type: 'sticker';
  stickerId: string;
  packageId: string;
  stickerUrl: string;
}
```

### Web UI: スタンプの表示コンポーネント

メッセージの `attributes.type` でコンポーネントを切り替える `MessageRenderer` を用意し、スタンプの場合は `StickerBubble` を表示します。

```typescript
// packages/web-ui/src/components/messages/MessageRenderer.tsx
const MessageRenderer: React.FC<MessageRendererProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as MessageAttributes | undefined;
  const messageType = attributes?.type || 'text';

  switch (messageType) {
    case 'text':
      return <TextBubble message={message} isOwnMessage={isOwnMessage} />;
    case 'sticker':
      return <StickerBubble message={message} isOwnMessage={isOwnMessage} />;
    case 'image':
      return <ImageBubble message={message} isOwnMessage={isOwnMessage} />;
    case 'video':
      return <VideoBubble message={message} isOwnMessage={isOwnMessage} />;
    // ...
  }
};
```

`StickerBubble` コンポーネントでは、CDN URLから画像を表示し、読み込みに失敗した場合のフォールバックUIを用意しています。カスタムスタンプなどCDNパターンに合わないものへの対策です。

```tsx
// packages/web-ui/src/components/messages/StickerBubble.tsx
const StickerBubble: React.FC<StickerBubbleProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as StickerMessageAttributes;
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div className="w-32 h-32 relative">
          {!imageError ? (
            <img
              src={attributes.stickerUrl}
              alt={`Sticker ${attributes.stickerId}`}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            // 読み込み失敗時のフォールバック
            <div className="w-full h-full bg-gray-100 border border-gray-300 rounded-lg
                            flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🎨</div>
                <p className="text-xs text-gray-500">LINE Sticker</p>
                <p className="text-xs text-gray-400 mt-1">
                  {attributes.packageId}/{attributes.stickerId}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

`onError` でスタンプ画像のロード失敗を検知し、packageIdとstickerIdを表示するフォールバックに切り替えます。公式スタンプはほぼ問題ありませんが、クリエイターズスタンプやアニメーションスタンプではこのCDN URLが効かないケースがあります。

---

## 3. 画像・動画をTwilio MCS経由でWeb UIに表示する

テキストやスタンプと違い、画像と動画の橋渡しは一筋縄ではいきません。LINEの画像・動画はLINE Content APIで取得しますが、このAPIは認証が必要で、URLをそのままブラウザに渡すことができません。

解決策として **Twilio MCS (Media Content Service)** を中継ストレージとして使います。

### 処理の流れ

```
LINE Content API  ──(バイナリ)──→  Twilio MCS  ──(Media SID)──→  Conversationメッセージ
                                                                         │
                                                      署名付き一時URL ←──┘
                                                           │
                                                      Web UIで表示
```

### ミドルウェア: MCSへのアップロード

Step 1としてLINE Content APIからバイナリデータを取得し、Step 2としてTwilio MCSにアップロードします。

まずLINEクライアントの `getContent` メソッド:

```typescript
// packages/middleware/src/services/line.ts
async getContent(messageId: string): Promise<ArrayBuffer> {
  const response = await fetch(
    `${this.dataApiBaseUrl}/message/${messageId}/content`,
    {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    }
  );
  return response.arrayBuffer();
}
```

LINE Content APIのベースURLは通常のAPIとは異なり、`https://api-data.line.me/v2/bot` です。レスポンスをそのまま `ArrayBuffer` として取得します。

次にTwilioクライアントのMCSアップロード:

```typescript
// packages/middleware/src/services/twilio.ts
async uploadMediaToMCS(
  contentType: string,
  mediaData: ArrayBuffer
): Promise<string> {
  const mcsUrl = `https://mcs.us1.twilio.com/v1/Services/${this.serviceSid}/Media`;

  const response = await fetch(mcsUrl, {
    method: 'POST',
    headers: {
      Authorization: this.authHeader,  // Basic認証
      'Content-Type': contentType,
      'X-Twilio-Webhook-Enabled': 'true',
    },
    body: mediaData,
  });

  const result: any = await response.json();
  return result.sid; // Media SID (MExxxx形式)
}
```

MCSのエンドポイントは `https://mcs.us1.twilio.com/v1/Services/{ServiceSid}/Media` です。ここにバイナリデータを直接POSTすると、`MExxxx` 形式のMedia SIDが返ってきます。

そしてMedia SIDをConversationメッセージに添付:

```typescript
// packages/middleware/src/services/twilio.ts
async createMediaMessage(
  conversationSid: string,
  mediaSid: string,
  author: string,
  body: string,
  attributes?: string
): Promise<TwilioMessage> {
  const bodyParams = new URLSearchParams();
  bodyParams.append('Author', author);
  bodyParams.append('Body', body);
  bodyParams.append('MediaSid', mediaSid);  // ← これがキー
  if (attributes) bodyParams.append('Attributes', attributes);

  const response = await fetch(
    `${this.baseUrl}/Conversations/${conversationSid}/Messages`,
    {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    }
  );
  return response.json() as Promise<TwilioMessage>;
}
```

通常の `createMessage` と異なり、`MediaSid` パラメータを追加するだけでメディア付きメッセージになります。

### Inboundハンドラでの画像・動画処理

実際のハンドラでは、上記の2ステップを組み合わせます:

```typescript
// packages/middleware/src/handlers/inbound.ts
async function handleImageMessage(
  message: LineImageMessage,
  conversationSid: string,
  twilioClient: TwilioClient,
  lineClient: LineClient,
  lineUserId: string
): Promise<void> {
  // Step 1: LINE Content APIから画像データを取得
  const imageData = await lineClient.getContent(message.id);

  // Step 2: MCSにアップロード
  const mediaSid = await twilioClient.uploadMediaToMCS('image/jpeg', imageData);

  const attrs: ImageMessageAttributes = {
    type: 'image',
    mediaUrl: `https://mcs.us1.twilio.com/v1/Services/${twilioClient.serviceSid}/Media/${mediaSid}`,
  };

  // Step 3: メディア付きメッセージを作成
  await twilioClient.createMediaMessage(
    conversationSid,
    mediaSid,
    lineUserId,
    '[Image]',
    JSON.stringify(attrs)
  );
}
```

動画も同じパターンで、Content-Typeを `video/mp4` に変えるだけです:

```typescript
async function handleVideoMessage(
  message: LineVideoMessage,
  conversationSid: string,
  twilioClient: TwilioClient,
  lineClient: LineClient,
  lineUserId: string
): Promise<void> {
  const videoData = await lineClient.getContent(message.id);
  const mediaSid = await twilioClient.uploadMediaToMCS('video/mp4', videoData);

  const attrs: VideoMessageAttributes = {
    type: 'video',
    mediaUrl: `https://mcs.us1.twilio.com/v1/Services/${twilioClient.serviceSid}/Media/${mediaSid}`,
  };

  await twilioClient.createMediaMessage(
    conversationSid, mediaSid, lineUserId, '[Video]', JSON.stringify(attrs)
  );
}
```

### Web UI: 署名付き一時URLで表示

MCSに保存した画像・動画をWeb UIで表示する際に最も重要なのが、**MCSのURLを直接叩いてはいけない** という点です。`https://mcs.us1.twilio.com/...` をブラウザで開いても認証エラーになります。

代わりに、Twilio Conversations JS SDKの `attachedMedia` から署名付きの一時URLを取得します:

```tsx
// packages/web-ui/src/components/messages/ImageBubble.tsx
const ImageBubble: React.FC<ImageBubbleProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as ImageMessageAttributes;
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadImageUrl = async () => {
      try {
        const media = message.attachedMedia;
        if (media && media.length > 0) {
          // ← ここが核心。SDKが署名付き一時URLを生成してくれる
          const tempUrl = await media[0].getContentTemporaryUrl();
          setImageUrl(tempUrl);
        } else {
          setImageUrl(attributes.mediaUrl || null);
        }
      } catch (error) {
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadImageUrl();
  }, [message, attributes.mediaUrl]);

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
      <div className="max-w-xs rounded-lg overflow-hidden shadow-md bg-gray-100">
        {!imageError && imageUrl ? (
          <>
            {isLoading && (
              <div className="w-64 h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500" />
              </div>
            )}
            <img
              src={imageUrl}
              alt="Image"
              className={`max-w-full h-auto ${isLoading ? 'hidden' : 'block'}`}
              onLoad={() => setIsLoading(false)}
              onError={() => { setImageError(true); setIsLoading(false); }}
            />
          </>
        ) : (
          <div className="w-64 h-48 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-2">🖼️</div>
              <p className="text-sm text-gray-500">
                {isLoading ? '読み込み中...' : '画像を読み込めません'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

動画も同じアプローチで、`<img>` を `<video controls>` に置き換え、`onLoad` を `onLoadedData` に変えるだけです:

```tsx
// packages/web-ui/src/components/messages/VideoBubble.tsx（差分のみ）
<video
  src={videoUrl}
  controls
  className={`max-w-full h-auto ${isLoading ? 'hidden' : 'block'}`}
  onLoadedData={() => setIsLoading(false)}
  onError={() => { setVideoError(true); setIsLoading(false); }}
/>
```

### なぜMCSを経由するのか

代替案として、画像をBase64でattributesに埋め込む方法や、Cloud Storageに保存する方法も考えられますが:

- **Base64埋め込み**: attributesのサイズ上限に引っかかる。動画は論外
- **Cloud Storage**: インフラ管理が増える。署名付きURL生成を自前で実装する必要がある
- **Twilio MCS**: Conversationsと同じ認証基盤。SDKが署名付きURLを自動生成。追加インフラ不要

MCSの一時URLには有効期限があるため、長時間放置したタブでは画像が切れます。ただし、会話を再度開けばURLが再生成されるため、実用上は問題ありません。

---

## まとめ

3つの連携ポイントをまとめます:

| テーマ | 仕組み |
|---|---|
| LINE↔Twilio連携 | Webhookの双方向変換 + Author判定による無限ループ防止 |
| スタンプ表示 | LINE CDN URL + message attributesに `type: 'sticker'` で識別 |
| 画像・動画表示 | LINE Content API → Twilio MCS → `getContentTemporaryUrl()` で署名付きURL取得 |

Twilio Conversationsの `Attributes` フィールドが汎用的なJSON格納庫として機能するため、LINEのスタンプ・画像・動画といったTwilio側にない概念をうまく乗せることができました。メッセージのbodyはフォールバック用のテキスト（`[Sticker]`, `[Image]`等）を入れ、実際の表示ロジックはattributesの `type` フィールドで分岐させる設計です。

### 技術スタック

| コンポーネント | 技術 |
|---|---|
| ミドルウェア | Hono (Node.js) / Google Cloud Run |
| Web Chat UI | Next.js 15 (App Router) / Vercel |
| 会話基盤 | Twilio Conversations API + JS SDK |
| メッセージング | LINE Messaging API |
| メディア管理 | Twilio MCS (Media Content Service) |
| 言語 | TypeScript (全コンポーネント共通) |
| モノレポ | pnpm workspaces |
