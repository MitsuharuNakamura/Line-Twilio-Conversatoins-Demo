# Web Chat UI 仕様

## 概要

Next.js 15 (App Router) + Twilio Conversations JS SDK で構築するオペレーター向けチャットUI。LINEの管理画面に近いUXを独自UIで実現する。

## 画面構成

```
┌──────────────────────────────────────────────────────────────┐
│  ヘッダー: ロゴ + オペレーター名 + ログアウト                    │
├──────────────────┬──────────────────────┬────────────────────┤
│  受信トレイ       │  チャットエリア        │  ユーザー情報      │
│  (250px)         │  (flex: 1)           │  (280px)          │
│                  │                      │                    │
│  [検索バー]       │  田中太郎             │  LINEプロフィール   │
│  [フィルター]     │  ──────────────      │  画像 + 表示名     │
│                  │                      │                    │
│  ● 田中太郎      │  こんにちは           │  ステータス: 対応中  │
│    新着メッセージ  │  商品について質問が... │  タグ: [問合せ]    │
│                  │                      │                    │
│  ○ 山田花子      │  [スタンプ表示]        │  ──────────       │
│    昨日 14:30    │                      │  [リッチメニュー    │
│                  │  ──────────────      │   切替]            │
│  ○ 佐藤一郎      │  [メッセージ入力]      │                    │
│    昨日 10:15    │  [テンプレ] [送信]     │  [テンプレート送信]  │
└──────────────────┴──────────────────────┴────────────────────┘
```

## コンポーネント階層

```
app/page.tsx (Server Component)
└── ChatLayout (Client Component - メインレイアウト)
    ├── ConversationList (受信トレイ)
    │   ├── SearchBar
    │   ├── StatusFilter
    │   └── ConversationItem[] (各会話の行)
    │       ├── プロフィール画像
    │       ├── 表示名
    │       ├── 最新メッセージプレビュー
    │       └── 未読バッジ
    ├── ChatArea (チャット画面)
    │   ├── ChatHeader (相手の名前 + ステータス)
    │   ├── MessageList (メッセージ一覧、スクロール)
    │   │   └── MessageRenderer[] (タイプ別表示)
    │   │       ├── TextBubble
    │   │       ├── StickerBubble
    │   │       ├── ImageBubble
    │   │       ├── VideoBubble
    │   │       ├── MapBubble
    │   │       └── FlexMessagePreview
    │   └── MessageInput (入力エリア)
    │       ├── テキスト入力
    │       ├── StickerPicker (スタンプ選択)
    │       ├── TemplatePicker (テンプレート選択)
    │       └── 送信ボタン
    └── UserInfoPanel (ユーザー情報サイドバー)
        ├── LINEプロフィール表示
        ├── ステータス管理
        ├── タグ管理
        ├── リッチメニュー切替ボタン
        └── テンプレート送信ボタン
```

## Hooks 設計

### useConversations

Twilio Conversations JS SDKの初期化・会話一覧の管理。

```typescript
// hooks/useConversations.ts
export function useConversations() {
  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // 1. Access Token取得
      const { token } = await fetchToken(operatorIdentity);

      // 2. SDK初期化
      const client = new Client(token);

      // 3. イベントリスナー
      client.on('conversationAdded', handleConversationAdded);
      client.on('conversationUpdated', handleConversationUpdated);
      client.on('tokenAboutToExpire', handleTokenRefresh);

      // 4. 既存Conversation一覧取得
      const paginator = await client.getSubscribedConversations();
      setConversations(paginator.items);
      setClient(client);
      setLoading(false);
    }
    init();
  }, []);

  return { client, conversations, activeConversation, setActiveConversation, loading };
}
```

### useMessages

選択中のConversationのメッセージ管理。

```typescript
// hooks/useMessages.ts
export function useMessages(conversation: Conversation | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversation) return;

    setLoading(true);

    // 過去メッセージ取得
    conversation.getMessages().then(paginator => {
      setMessages(paginator.items);
      setLoading(false);
    });

    // 新規メッセージのリアルタイム受信
    const handler = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };
    conversation.on('messageAdded', handler);

    return () => {
      conversation.off('messageAdded', handler);
    };
  }, [conversation]);

  const sendMessage = async (body: string) => {
    if (!conversation) return;
    await conversation.sendMessage(body);
  };

  return { messages, loading, sendMessage };
}
```

### useLineActions

LINE固有のアクション（Flex Message送信、スタンプ送信、リッチメニュー切替）。

```typescript
// hooks/useLineActions.ts
export function useLineActions(conversationAttributes: ConversationAttributes | null) {
  const lineUserId = conversationAttributes?.lineUserId;

  const sendFlexMessage = async (template: string, data: Record<string, unknown>) => {
    if (!lineUserId) return;
    await apiClient.post('/api/send/flex', { lineUserId, template, data });
  };

  const sendSticker = async (packageId: string, stickerId: string) => {
    if (!lineUserId) return;
    await apiClient.post('/api/send/sticker', { lineUserId, packageId, stickerId });
  };

  const switchRichMenu = async (richMenuId: string) => {
    if (!lineUserId) return;
    await apiClient.post('/api/richmenu/switch', { lineUserId, richMenuId });
  };

  return { sendFlexMessage, sendSticker, switchRichMenu };
}
```

## Access Token 管理

```typescript
// lib/twilio-client.ts
let tokenPromise: Promise<string> | null = null;

export async function getAccessToken(identity: string): Promise<string> {
  if (!tokenPromise) {
    tokenPromise = fetchNewToken(identity);
  }
  return tokenPromise;
}

async function fetchNewToken(identity: string): Promise<string> {
  const res = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity }),
  });
  const { token } = await res.json();
  return token;
}
```

Next.js のAPIルートでトークンプロキシを作る:

```typescript
// app/api/token/route.ts
export async function POST(request: Request) {
  const { identity } = await request.json();

  const res = await fetch(`${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity }),
  });

  const data = await res.json();
  return Response.json(data);
}
```

## スタイリング方針

- Tailwind CSS をベースに構成
- ダークモード対応は後回し（Phase 4 以降）
- LINEのメッセージバブルに近いデザイン
  - 相手のメッセージ: 左寄せ、薄いグレー背景
  - 自分のメッセージ: 右寄せ、グリーン系背景
- レスポンシブ対応はデスクトップ優先（オペレーター向けのため）
