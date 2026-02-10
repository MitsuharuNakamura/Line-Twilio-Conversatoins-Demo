# LINEリッチ機能仕様

## 概要

LINE Messaging APIのリッチ機能はTwilio Conversationsを経由せず、ミドルウェアからLINE Messaging APIを直接呼び出す。送信後はConversationsに履歴として記録を残す。

```
Web UI → ミドルウェア独自API → LINE Messaging API → LINEユーザー
                  │
                  └→ Conversations API に送信記録を追加
```

## リッチメニュー

### 概要

画面下部に常時表示されるメニュー。ユーザーごとに動的に切り替え可能。

### 事前準備（LINE Developers Console or API）

1. リッチメニュー画像の作成（2500×1686 or 2500×843 px）
2. LINE Messaging APIでリッチメニューを登録
3. タップ領域とアクションを定義

### APIエンドポイント

```
POST /api/richmenu/switch
Body: { lineUserId: string, richMenuId: string }
```

### 実装

```typescript
// ミドルウェア: routes/richmenu.ts
app.post('/api/richmenu/switch', authMiddleware, async (c) => {
  const { lineUserId, richMenuId } = await c.req.json();

  // ユーザーにリッチメニューをリンク
  await fetch(
    `https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${richMenuId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.env.LINE_CHANNEL_ACCESS_TOKEN}` },
    }
  );

  // Conversationsに記録
  const conversation = await getConversationByLineUserId(lineUserId, c.env);
  await twilioClient.addMessage(conversation.sid, {
    Author: 'system',
    Body: `[リッチメニュー切替] ${richMenuId}`,
    Attributes: JSON.stringify({
      type: 'rich_menu_action',
      action: 'switch',
      data: richMenuId,
    }),
  });

  return c.json({ ok: true });
});
```

## Flex Message

### 概要

JSON定義でカスタムレイアウトのカード型メッセージを送信。商品カード、予約確認、注文ステータスなど多用途。

### APIエンドポイント

```
POST /api/send/flex
Body: {
  lineUserId: string,
  template: string,       // テンプレート名
  templateData: object,   // テンプレートに渡すデータ
  altText: string         // 通知時のテキスト
}
```

### テンプレートシステム

テンプレートをコードで定義し、データを注入して生成する。

```typescript
// services/flex-templates.ts

export const templates = {
  product_card: (data: ProductCardData) => ({
    type: 'bubble' as const,
    hero: {
      type: 'image' as const,
      url: data.imageUrl,
      size: 'full' as const,
      aspectRatio: '20:13',
      aspectMode: 'cover' as const,
    },
    body: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [
        { type: 'text' as const, text: data.name, weight: 'bold' as const, size: 'xl' as const },
        { type: 'text' as const, text: `¥${data.price.toLocaleString()}`, color: '#cc0000', size: 'lg' as const },
        { type: 'text' as const, text: data.description, size: 'sm' as const, color: '#666666', wrap: true },
      ],
    },
    footer: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [
        {
          type: 'button' as const,
          style: 'primary' as const,
          action: { type: 'uri' as const, label: '詳細を見る', uri: data.detailUrl },
        },
      ],
    },
  }),

  booking_confirmation: (data: BookingData) => ({
    type: 'bubble' as const,
    body: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [
        { type: 'text' as const, text: '予約確認', weight: 'bold' as const, size: 'xl' as const },
        { type: 'separator' as const, margin: 'md' as const },
        {
          type: 'box' as const, layout: 'vertical' as const, margin: 'md' as const,
          contents: [
            infoRow('日時', data.datetime),
            infoRow('人数', `${data.guests}名`),
            infoRow('コース', data.course),
          ],
        },
      ],
    },
    footer: {
      type: 'box' as const,
      layout: 'horizontal' as const,
      contents: [
        {
          type: 'button' as const,
          style: 'primary' as const,
          action: { type: 'postback' as const, label: '確定', data: `confirm:${data.bookingId}` },
        },
        {
          type: 'button' as const,
          style: 'secondary' as const,
          action: { type: 'postback' as const, label: 'キャンセル', data: `cancel:${data.bookingId}` },
        },
      ],
    },
  }),
};
```

### テンプレート一覧API

```
GET /api/templates
Response: {
  templates: [
    { id: 'product_card', name: '商品カード', fields: ['imageUrl', 'name', 'price', 'description', 'detailUrl'] },
    { id: 'booking_confirmation', name: '予約確認', fields: ['datetime', 'guests', 'course', 'bookingId'] },
  ]
}
```

## クイックリプライ

メッセージ送信時にクイックリプライボタンを付与。

```typescript
await lineClient.pushMessage(lineUserId, [
  {
    type: 'text',
    text: 'ご要望をお選びください',
    quickReply: {
      items: [
        {
          type: 'action',
          action: { type: 'postback', label: '商品について', data: 'inquiry:product', displayText: '商品について' },
        },
        {
          type: 'action',
          action: { type: 'postback', label: '配送について', data: 'inquiry:shipping', displayText: '配送について' },
        },
        {
          type: 'action',
          action: { type: 'postback', label: 'その他', data: 'inquiry:other', displayText: 'その他' },
        },
      ],
    },
  },
]);
```

## テンプレートメッセージ（カルーセル）

```typescript
await lineClient.pushMessage(lineUserId, [
  {
    type: 'template',
    altText: '商品一覧',
    template: {
      type: 'carousel',
      columns: products.map(p => ({
        thumbnailImageUrl: p.imageUrl,
        title: p.name,
        text: `¥${p.price.toLocaleString()}`,
        actions: [
          { type: 'uri', label: '詳細', uri: p.detailUrl },
          { type: 'postback', label: 'カートに追加', data: `cart:add:${p.id}` },
        ],
      })),
    },
  },
]);
```

## 画像マップ

タップ領域付きの画像を送信。

```typescript
await lineClient.pushMessage(lineUserId, [
  {
    type: 'imagemap',
    baseUrl: 'https://example.com/imagemap',
    altText: 'メニュー',
    baseSize: { width: 1040, height: 1040 },
    actions: [
      {
        type: 'uri',
        linkUri: 'https://example.com/product-a',
        area: { x: 0, y: 0, width: 520, height: 520 },
      },
      {
        type: 'message',
        text: '商品Bについて教えて',
        area: { x: 520, y: 0, width: 520, height: 520 },
      },
    ],
  },
]);
```

## オペレーターからのスタンプ送信

送信可能なのはLINE提供の公式スタンプのみ。

```
POST /api/send/sticker
Body: { lineUserId: string, packageId: string, stickerId: string }
```

```typescript
// ミドルウェア
app.post('/api/send/sticker', authMiddleware, async (c) => {
  const { lineUserId, packageId, stickerId } = await c.req.json();

  // LINE Push APIでスタンプ送信
  await lineClient.pushMessage(lineUserId, [
    { type: 'sticker', packageId, stickerId },
  ]);

  // Conversationsに記録
  const conversation = await getConversationByLineUserId(lineUserId, c.env);
  const stickerUrl =
    `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker@2x.png`;

  await twilioClient.addMessage(conversation.sid, {
    Author: 'operator',
    Attributes: JSON.stringify({
      type: 'sticker',
      stickerId,
      packageId,
      stickerUrl,
    }),
  });

  return c.json({ ok: true });
});
```

## Web UIでの送信リッチ機能一覧

| 機能 | Phase 1 (MVP) | Phase 2 | Phase 3 |
|---|---|---|---|
| テキスト送信 | ✅ | ✅ | ✅ |
| Flex Messageテンプレート送信 | - | - | ✅ |
| スタンプ送信 | - | ✅ | ✅ |
| クイックリプライ付きメッセージ | - | - | ✅ |
| リッチメニュー切替 | - | - | ✅ |
| テンプレートメッセージ（カルーセル） | - | - | ✅ |
