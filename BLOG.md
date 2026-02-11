# LINE × Twilio Conversations — 双方向リアルタイムチャット基盤を作った話

LINE公式アカウントに届いたメッセージを、独自のWeb UIでオペレーターがリアルタイムに返信できるプラットフォームを構築しました。Twilio Conversations APIを会話基盤に据え、LINE Messaging APIとWeb Chat UIを橋渡しする設計です。

本記事では、実装中に直面した技術的な課題と、その解決策を中心に解説します。

---

## 全体アーキテクチャ

```
LINE User ──→ LINE Webhook ──→ Middleware (Hono) ──→ Twilio Conversations
                                                           ↕ (Real-time SDK)
LINE User ←── LINE Messaging API ←── Middleware ←── Web UI (Next.js 15)
```

| コンポーネント | 技術 | デプロイ先 |
|---|---|---|
| ミドルウェア | Hono (Node.js) | Google Cloud Run |
| Web Chat UI | Next.js 15 (App Router) | Vercel |
| 会話基盤 | Twilio Conversations API | - |
| メッセージング | LINE Messaging API | - |
| メディア管理 | Twilio MCS (Media Content Service) | - |

LINEユーザーからのメッセージはミドルウェアを経由してTwilio Conversationsに保存され、Web UIがTwilio Conversations JS SDKでリアルタイムに受信します。オペレーターの返信は逆の経路でLINEユーザーに届きます。

---

## 技術的に面白い5つのポイント

### 1. Twilio Conversations Webhookの罠 — `req.json()` では読めない

最初にハマったのがこれです。Twilio ConversationsのWebhookは **`application/x-www-form-urlencoded`** 形式でPOSTされます。JSONを期待して `c.req.json()` を呼ぶと無言で失敗します。

```typescript
// ❌ これでは取れない
const event = await c.req.json()

// ✅ form-urlencoded形式で受け取る
const formData = await c.req.formData()
const event = Object.fromEntries(formData)
```

LINEのWebhookがJSONなのに対し、Twilio側はform-urlencoded。同じ「Webhook」でもフォーマットが違うため、両方を同じミドルウェア内で扱う場合は注意が必要です。

---

### 2. 画像・動画の橋渡し — Twilio MCS経由の2ステップ転送

LINEユーザーが送った画像や動画をWeb UIに表示するのは、単純なURL転送では解決できません。LINE Content APIのURLは一時的かつ認証付きで、そのままブラウザに渡せないためです。

解決策として **Twilio MCS (Media Content Service)** を仲介に使う2ステップ方式を採用しました。

```
LINE Content API → バイナリ取得 → Twilio MCSにアップロード → Media SID取得
                                                                ↓
                          Conversationメッセージに MediaSid として添付
                                                                ↓
                          Web UIでSDK経由の署名付き一時URLを取得して表示
```

ミドルウェア側の実装:

```typescript
// Step 1: LINE Content APIからバイナリデータを取得
const imageData = await lineClient.getContent(message.id)

// Step 2: Twilio MCSにアップロード
const mediaSid = await twilioClient.uploadMediaToMCS('image/jpeg', imageData)

// Step 3: Conversationメッセージに添付
await twilioClient.createMediaMessage(conversationSid, mediaSid, author, '[Image]', attributes)
```

Web UI側で画像を表示する際のポイントは、MCSのURLを直接叩いてはいけないこと。認証エラーになります。代わりにSDKの `getContentTemporaryUrl()` で署名付きURLを取得します。

```typescript
const media = message.attachedMedia
if (media && media.length > 0) {
  const tempUrl = await media[0].getContentTemporaryUrl()
  setImageUrl(tempUrl)
}
```

この署名付きURLには有効期限があるため、長時間放置したタブでは画像が切れる可能性があります。それでも、自前のストレージを持たずにメディアを安全に橋渡しできるのはMCSの大きな利点です。

---

### 3. 無限ループ防止 — LINEユーザーIDのパターンマッチ

双方向ブリッジにはつきものの問題：**メッセージの無限ループ**。

LINEユーザーがメッセージを送ると、ミドルウェアがTwilio Conversationsに保存します。すると `onMessageAdded` Webhookが発火し、ミドルウェアが再び呼ばれます。ここでLINEに転送してしまうと、それがまたWebhookを……という無限ループです。

解決策はシンプルです。Twilio Conversations側のメッセージ作成者（Author）を見て、**LINEユーザーIDのパターンに一致するものはスキップ**します。

```typescript
function isLineUserId(identity: string): boolean {
  return /^U[0-9a-f]{32}$/.test(identity)
}

// Webhookハンドラ内
if (isLineUserId(author)) {
  // LINEユーザー自身のメッセージ → 転送不要
  return c.json({ status: 'skipped' })
}
```

LINE User IDは `U` + 32文字の16進数という固定フォーマットなので、正規表現一発で判別できます。

---

### 4. Participant自動追加の設計 — SDKの「見える会話」の仕組み

Twilio Conversations JS SDKの `getSubscribedConversations()` は、**自分がParticipantとして追加されている会話だけ**を返します。つまり、LINE側から新しい会話が作られても、オペレーターがParticipantに入っていなければWeb UIには表示されません。

そこで、Conversationの作成・取得のたびにオペレーターを自動追加するロジックを組みました。

```typescript
async function ensureOperatorParticipant(conversationSid: string): Promise<void> {
  try {
    await twilioClient.addParticipant(conversationSid, 'operator-001')
  } catch (err) {
    // 既に追加済みの場合は409エラー → 握り潰してOK
    if (err instanceof Error && !err.message.includes('already exists')) {
      throw err
    }
  }
}
```

409 Conflictを「正常系」として扱うのがポイントです。毎回「既に存在するか？」をチェックするよりも、楽観的に追加を試みて失敗したら無視する方がAPI呼び出しが1回で済みます。

Web UI側では2つのイベントで新しい会話を検出します:

```typescript
client.on('conversationAdded', handleNewConversation)   // 新規作成
client.on('conversationJoined', handleNewConversation)   // 既存会話に後から追加された場合
```

`conversationAdded` だけだと、ミドルウェアが先にConversationを作り、後からParticipantを追加するケースを拾えません。`conversationJoined` で補完しています。

---

### 5. メディア読み込みに追従する自動スクロール

チャットUIの自動スクロールは見た目以上に厄介です。テキストだけなら最下部に飛ばせば終わりですが、画像・動画・スタンプが混在するとDOMの高さが非同期に変化します。

最初の `scrollToBottom` 時点ではまだ画像が読み込まれておらず、スクロール位置がずれる問題が発生しました。

採用した解決策は**複数回の遅延スクロール**です:

```typescript
useEffect(() => {
  if (conversation && messages.length > 0) {
    scrollToBottom('auto')  // 即座に1回

    // 画像読み込みの各段階で追従
    const delays = [100, 300, 500, 1000, 1500]
    delays.forEach(delay => {
      setTimeout(() => scrollToBottom('smooth'), delay)
    })
  }
}, [conversation?.sid, messages.length])
```

加えて、ユーザーが過去メッセージを読んでいるときに強制スクロールされないよう、「画面下部付近にいるか」を判定しています:

```typescript
const isNearBottom =
  container.scrollHeight - container.scrollTop - container.clientHeight < 100

if (isOwnMessage || isNearBottom) {
  scrollToBottom('smooth')
}
```

IntersectionObserverやResizeObserverを使う方法も検討しましたが、Twilio SDKのメッセージオブジェクトからメディア読み込み完了を正確に検知するのが難しく、タイマーベースの方がシンプルで確実でした。

---

## その他の実装Tips

### LINEスタンプの表示

LINEの公式スタンプ画像はCDNから直接取得できます:

```
https://stickershop.line-scdn.net/stickershop/v1/sticker/{stickerId}/android/sticker.png
```

ただしカスタムスタンプやアニメーションスタンプはこのパターンでは取得できないため、フォールバックとして絵文字表示を用意しています。

### ミドルウェアでのAccess Token手動生成

Web UI側はTwilio Node.js SDKの `AccessToken` クラスで簡単にトークンを生成できますが、ミドルウェア（Hono on Cloud Run）ではSDKの依存を避けたかったため、`jose` ライブラリでJWTを手動構築しています。

```typescript
const payload = {
  jti: `${apiKeySid}-${now}`,
  iss: apiKeySid,
  sub: accountSid,
  exp: now + ttl,
  grants: {
    identity,
    chat: { service_sid: serviceSid }
  }
}
const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
  .sign(secret)
```

Twilio Access Tokenのペイロード構造さえ合わせれば、SDK無しでも正しいトークンを生成できます。

### ES Modulesの `.js` 拡張子問題

Node.js環境でES Modulesを使う場合、TypeScriptの相対importに `.js` 拡張子が必須です。TypeScriptのソースなのに `.js` を書くという直感に反する規則ですが、`tsc` がimportパスを変換しないため必要になります。

```typescript
// ✅ Node.js ES Modulesで動く
import { LineClient } from '../services/line.js'

// ❌ コンパイルは通るがNode.jsで実行時エラー
import { LineClient } from '../services/line'
```

### 環境変数のtrim処理

Cloud RunやVercelで環境変数を設定する際、末尾に改行やスペースが混入するケースがあります。特にダッシュボードからのコピペ時に起きやすい問題です。

```typescript
const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
```

地味ですが、これを入れておかないとAPI認証が謎に失敗するデバッグ地獄に陥ります。

---

## まとめ

| 課題 | 解決策 |
|---|---|
| Twilio WebhookがJSONじゃない | `formData()` でパース |
| LINE画像をWeb UIに渡せない | Twilio MCS経由で署名付きURL |
| メッセージの無限ループ | LINE User IDパターンで判別・スキップ |
| 新しい会話がUIに出ない | Participant自動追加 + `conversationJoined` イベント |
| メディア読み込み後のスクロールずれ | 複数回遅延スクロール |

LINE Messaging APIとTwilio Conversations APIはそれぞれ単体では豊富なドキュメントがありますが、**2つを組み合わせた双方向ブリッジ**の情報はほとんど見つかりませんでした。特にメディアの橋渡しとリアルタイム同期の組み合わせは試行錯誤の連続で、この記事がどなたかの参考になれば幸いです。

### 技術スタック

- **TypeScript** (全コンポーネント共通)
- **Hono** — 軽量HTTPフレームワーク
- **Next.js 15** (App Router) — Server Components + Client Components
- **Twilio Conversations JS SDK** — リアルタイムメッセージング
- **pnpm workspaces** — モノレポ管理
- **Google Cloud Run** + **Vercel** — デプロイ
