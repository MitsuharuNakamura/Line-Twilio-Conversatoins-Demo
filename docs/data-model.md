# Conversation データモデル

## 設計方針

LINEユーザーごとに1つのConversationを作成する。LINEの公式アカウントのトーク画面と同じ構造をTwilio Conversations側で再現する。

```
LINE ユーザー A  →  Conversation A  ←  オペレーター（複数人参加可）
LINE ユーザー B  →  Conversation B  ←  オペレーター
LINE ユーザー C  →  Conversation C  ←  オペレーター
```

## Conversation の識別

| フィールド | 値 | 用途 |
|---|---|---|
| `uniqueName` | `line_{lineUserId}` | 一意キーとしてLINE userIdで検索に利用 |
| `friendlyName` | LINEの表示名 | UI表示用 |

## Conversation Attributes スキーマ

```typescript
interface ConversationAttributes {
  // チャネル識別
  channel: 'line';

  // LINEユーザー情報
  lineUserId: string;
  lineDisplayName: string;
  lineProfilePictureUrl: string | null;

  // ステータス管理
  status: 'open' | 'assigned' | 'closed';
  assignedOperator: string | null;  // オペレーターIdentity

  // メタデータ
  tags: string[];
  createdAt: string;              // ISO 8601
  lastLineMessageAt: string;      // ISO 8601
}
```

## Conversation ライフサイクル

```
  LINEユーザーの
  初回メッセージ
       │
       ▼
    [open] ──── オペレーターがアサイン ────→ [assigned]
       ▲                                        │
       │                                   対応完了
       │                                        │
       │                                        ▼
       └──── 再度メッセージ受信 ──────── [closed]
```

| 状態遷移 | トリガー | 処理 |
|---|---|---|
| (新規) → open | LINEユーザーの初回メッセージ | Conversation新規作成 |
| open → assigned | オペレーターがUIからアサイン | Attributes更新 |
| assigned → closed | オペレーターがUIからクローズ | Attributes更新 |
| closed → open | LINEユーザーが再度メッセージ | Attributes更新、status を open に戻す |

## Participant 設計

### LINEユーザー側

LINEユーザーはTwilio Conversationsの正式なParticipantとしては追加しない。LINEユーザーのメッセージはミドルウェア経由で `author` を指定して追加する。

```typescript
// LINEユーザーのメッセージ追加時
await conversation.messages.create({
  author: lineUserId,  // LINE userId を author に設定
  body: messageText,
  attributes: JSON.stringify({ type: 'text' })
});
```

### オペレーター側

オペレーターはConversations JS SDKで接続するため、正式なParticipantとして追加する。

**初期フェーズ（共有受信トレイ）**: 全オペレーターが全Conversationを閲覧可能。各Conversationに全オペレーターをParticipantとして追加する。

**拡張フェーズ（アサイン制）**: アサインされたオペレーターのみParticipantに追加。

## Message Attributes スキーマ

```typescript
type MessageAttributes =
  // テキストメッセージ（attributesなしでもOK）
  | { type: 'text' }
  // LINEスタンプ
  | { type: 'sticker'; stickerId: string; packageId: string; stickerUrl: string }
  // 画像
  | { type: 'image'; mediaUrl: string }
  // 動画
  | { type: 'video'; mediaUrl: string; thumbnailUrl?: string }
  // 音声
  | { type: 'audio'; mediaUrl: string; duration: number }
  // 位置情報
  | { type: 'location'; latitude: number; longitude: number; title?: string; address?: string }
  // ファイル
  | { type: 'file'; fileName: string; fileSize: number; mediaUrl: string }
  // Postback (ボタンタップ)
  | { type: 'postback'; data: string; displayText?: string }
  // Flex Message送信記録
  | { type: 'flex_message'; template: string; templateData?: Record<string, unknown> }
  // リッチメニューアクション記録
  | { type: 'rich_menu_action'; action: string; data?: string };
```

## uniqueName による検索

Conversationの取得・作成パターン:

```typescript
async function getOrCreateConversation(
  twilioClient: TwilioClient,
  lineUserId: string,
  lineProfile: LineProfile
): Promise<ConversationInstance> {
  const uniqueName = `line_${lineUserId}`;

  try {
    // 既存Conversationを取得
    return await twilioClient.conversations.v1
      .conversations(uniqueName)
      .fetch();
  } catch (e) {
    // 404の場合は新規作成
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

    return await twilioClient.conversations.v1
      .conversations
      .create({
        uniqueName,
        friendlyName: lineProfile.displayName,
        attributes: JSON.stringify(attrs),
      });
  }
}
```
