# メッセージタイプ対応仕様

## 概要

LINEの各メッセージタイプをTwilio Conversationsに保存し、独自Web UIで適切に表示する。

## 受信メッセージタイプ一覧

### テキスト

最もシンプル。`body` にそのまま保存。

```typescript
// ミドルウェア
await twilioClient.addMessage(conversationSid, {
  Author: lineUserId,
  Body: event.message.text,
  Attributes: JSON.stringify({ type: 'text' }),
});
```

```tsx
// Web UI
function TextBubble({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap">{text}</p>;
}
```

### スタンプ

LINE CDN URLで画像を表示。

```typescript
// ミドルウェア
const { stickerId, packageId } = event.message;
const stickerUrl =
  `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker@2x.png`;

await twilioClient.addMessage(conversationSid, {
  Author: lineUserId,
  Attributes: JSON.stringify({
    type: 'sticker',
    stickerId,
    packageId,
    stickerUrl,
  }),
});
```

```tsx
// Web UI
function StickerBubble({ url }: { url: string }) {
  return <img src={url} alt="sticker" className="w-24 h-24 object-contain" />;
}
```

**注意**: アニメーションスタンプ (`stickerResourceType: 'ANIMATION'`) の場合、APNG形式。Web表示にはAPNG対応が必要（モダンブラウザは対応済み）。

### 画像

LINE Content APIでバイナリ取得→保存先URLをattributesに記録。

```typescript
// ミドルウェア
const content = await lineClient.getContent(event.message.id);
// R2 や S3 等に保存してURLを取得
const mediaUrl = await uploadToStorage(content, `images/${event.message.id}.jpg`);

await twilioClient.addMessage(conversationSid, {
  Author: lineUserId,
  Attributes: JSON.stringify({
    type: 'image',
    mediaUrl,
  }),
});
```

```tsx
// Web UI
function ImageBubble({ url }: { url: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <img
        src={url}
        alt="image"
        className="max-w-xs rounded-lg cursor-pointer"
        onClick={() => setExpanded(true)}
      />
      {expanded && <ImageModal url={url} onClose={() => setExpanded(false)} />}
    </>
  );
}
```

### 動画

```typescript
// ミドルウェア
const content = await lineClient.getContent(event.message.id);
const mediaUrl = await uploadToStorage(content, `videos/${event.message.id}.mp4`);
// プレビュー画像も取得可能
const thumbnailUrl = event.message.contentProvider?.previewImageUrl;

await twilioClient.addMessage(conversationSid, {
  Author: lineUserId,
  Attributes: JSON.stringify({
    type: 'video',
    mediaUrl,
    thumbnailUrl,
  }),
});
```

```tsx
// Web UI
function VideoBubble({ url, thumbnail }: { url: string; thumbnail?: string }) {
  return (
    <video
      src={url}
      poster={thumbnail}
      controls
      className="max-w-xs rounded-lg"
    />
  );
}
```

### 音声

```typescript
// ミドルウェア
await twilioClient.addMessage(conversationSid, {
  Author: lineUserId,
  Attributes: JSON.stringify({
    type: 'audio',
    mediaUrl,
    duration: event.message.duration, // ミリ秒
  }),
});
```

```tsx
// Web UI
function AudioBubble({ url, duration }: { url: string; duration: number }) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
      <audio src={url} controls className="h-8" />
      <span className="text-xs text-gray-500">
        {Math.ceil(duration / 1000)}秒
      </span>
    </div>
  );
}
```

### 位置情報

```typescript
// ミドルウェア
await twilioClient.addMessage(conversationSid, {
  Author: lineUserId,
  Attributes: JSON.stringify({
    type: 'location',
    latitude: event.message.latitude,
    longitude: event.message.longitude,
    title: event.message.title,
    address: event.message.address,
  }),
});
```

```tsx
// Web UI
function MapBubble({ lat, lng, title, address }: LocationAttrs) {
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=300x200&markers=${lat},${lng}&key=${MAPS_API_KEY}`;
  const linkUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <a href={linkUrl} target="_blank" rel="noopener noreferrer">
      <img src={mapUrl} alt={title || '位置情報'} className="rounded-lg" />
      {title && <p className="text-sm font-medium mt-1">{title}</p>}
      {address && <p className="text-xs text-gray-500">{address}</p>}
    </a>
  );
}
```

### ファイル

```typescript
// ミドルウェア
const content = await lineClient.getContent(event.message.id);
const mediaUrl = await uploadToStorage(content, `files/${event.message.id}`);

await twilioClient.addMessage(conversationSid, {
  Author: lineUserId,
  Attributes: JSON.stringify({
    type: 'file',
    fileName: event.message.fileName,
    fileSize: event.message.fileSize,
    mediaUrl,
  }),
});
```

### Postback

```typescript
// ミドルウェア（postbackイベント）
await twilioClient.addMessage(conversationSid, {
  Author: lineUserId,
  Body: event.postback.data,
  Attributes: JSON.stringify({
    type: 'postback',
    data: event.postback.data,
    displayText: event.postback.params?.displayText,
  }),
});
```

## バイナリコンテンツの保存先

Cloudflare R2 を推奨（Workers と同じエコシステム）。

```typescript
// Cloudflare R2 へのアップロード
async function uploadToStorage(
  content: ArrayBuffer,
  key: string,
  env: Env
): Promise<string> {
  await env.MEDIA_BUCKET.put(key, content);
  return `${env.R2_PUBLIC_URL}/${key}`;
}
```

`wrangler.toml` での R2 バインディング:
```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "line-media"
```

## MessageRenderer 統合コンポーネント

```tsx
// components/messages/MessageRenderer.tsx
import { Message } from '@twilio/conversations';
import { MessageAttributes } from '@line-chat/shared';

export function MessageRenderer({ message }: { message: Message }) {
  const attr: MessageAttributes = JSON.parse(message.attributes as string || '{}');

  switch (attr.type) {
    case 'sticker':
      return <StickerBubble url={attr.stickerUrl} />;
    case 'image':
      return <ImageBubble url={attr.mediaUrl} />;
    case 'video':
      return <VideoBubble url={attr.mediaUrl} thumbnail={attr.thumbnailUrl} />;
    case 'audio':
      return <AudioBubble url={attr.mediaUrl} duration={attr.duration} />;
    case 'location':
      return <MapBubble lat={attr.latitude} lng={attr.longitude}
        title={attr.title} address={attr.address} />;
    case 'file':
      return <FileBubble name={attr.fileName} size={attr.fileSize} url={attr.mediaUrl} />;
    case 'postback':
      return <PostbackBubble data={attr.data} displayText={attr.displayText} />;
    case 'flex_message':
      return <FlexMessagePreview template={attr.template} data={attr.templateData} />;
    default:
      return <TextBubble text={message.body || ''} />;
  }
}
```
