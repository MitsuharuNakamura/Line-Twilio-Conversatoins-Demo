---
name: twilio-realtime-transcription
description: >
  Twilio Voice SDKを使用した通話のリアルタイム文字起こし機能の実装ガイド。
  Next.js (App Router) + Twilio Sync + Vercel環境を想定。
  使用場面: (1) Twilio通話に文字起こしを追加したい、(2) Client-to-Client通話の文字起こし、
  (3) サーバーレス環境での文字起こしデータ管理、(4) LINEスタイルの文字起こしUI実装。
  トリガー: 文字起こし, transcription, twilio transcription, 通話テキスト化
---

# Twilio Realtime Transcription Implementation Guide

Next.js + Twilio Voice SDK環境でリアルタイム文字起こしを実装するためのガイド。

## 概要

Twilio Voice SDKを使用したClient-to-Client通話にリアルタイム文字起こしを追加する方法。

### 重要な制約

1. **TwiML `<Transcription>` はClient-to-Client通話では動作しない**
2. **REST APIを使用して文字起こしを開始する必要がある**
3. **サーバーレス環境（Vercel等）ではインメモリ状態が共有されない**

---

## アーキテクチャ

```
[通話応答] → [REST API呼び出し] → [Twilio Transcription開始]
                                         ↓
[フロントエンド] ← [ポーリング] ← [Twilio Sync] ← [Webhook受信]
```

### コンポーネント構成

```
app/api/transcription/
├── start/route.ts      # 文字起こし開始API
├── webhook/route.ts    # Twilioからのコールバック
└── messages/route.ts   # メッセージ取得（ポーリング用）

lib/transcription/
└── sync-store.ts       # Twilio Syncによるデータ管理

hooks/
└── useTranscription.ts # フロントエンド用フック

components/transcription/
├── TranscriptionChat.tsx   # チャットUI
└── TranscriptionBubble.tsx # 吹き出しコンポーネント
```

---

## 実装手順

### Phase 1: 環境設定

#### 必要な環境変数

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
TWILIO_SYNC_SERVICE_SID=ISxxxxxxxxx  # Twilio Syncサービス
```

#### Twilio Sync Serviceの作成

```bash
# Twilio CLIで作成
twilio api:sync:v1:services:create --friendly-name="Transcription-Service"
```

または、コード内で自動作成（sync-store.ts参照）。

---

### Phase 2: バックエンド実装

#### 2.1 文字起こし開始API

`app/api/transcription/start/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { callSid } = await request.json()

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  const baseUrl = request.headers.get('x-forwarded-host')
    ? `https://${request.headers.get('x-forwarded-host')}`
    : `https://${request.headers.get('host')}`

  const webhookUrl = `${baseUrl}/api/transcription/webhook`

  // REST APIで文字起こしを開始
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}/Transcriptions.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        Track: 'both_tracks',           // 両方のトラックを文字起こし
        LanguageCode: 'ja-JP',          // 日本語
        PartialResults: 'true',         // 中間結果も受信
        ProfanityFilter: 'false',
        StatusCallbackUrl: webhookUrl,
        StatusCallbackMethod: 'POST',
      }).toString(),
    }
  )

  const result = await response.json()
  return NextResponse.json({
    success: response.ok,
    transcriptionSid: result.sid,
  })
}
```

#### 2.2 Webhook受信

`app/api/transcription/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { addMessage, createSession } from '@/lib/transcription/sync-store'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData()
  const params = Object.fromEntries(formData.entries())

  const callSid = params.CallSid as string
  const transcriptionEvent = params.TranscriptionEvent as string

  // イベントハンドリング
  if (transcriptionEvent === 'transcription-started') {
    await createSession(callSid, params.TranscriptionSid as string)
    return NextResponse.json({ success: true })
  }

  // テキストデータの処理
  let text = ''
  let isFinal = false

  if (params.TranscriptionData) {
    const parsed = JSON.parse(params.TranscriptionData as string)
    text = parsed.transcript || ''
    // confidenceがある = 確定メッセージ
    isFinal = typeof parsed.confidence === 'number'
  }

  // 確定メッセージのみ保存
  if (callSid && text && isFinal) {
    await addMessage(callSid, {
      id: `${Date.now()}-${params.Track}`,
      callSid,
      track: params.Track as 'inbound_track' | 'outbound_track',
      text,
      timestamp: Date.now(),
      isFinal: true,
    })
  }

  return NextResponse.json({ success: true })
}
```

#### 2.3 Twilio Syncストア

`lib/transcription/sync-store.ts`

```typescript
'use server'

import twilio from 'twilio'

const SESSION_PREFIX = 'transcription_'
const SESSION_TTL = 3600 // 1時間

export async function createSession(callSid: string, transcriptionSid: string) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  const serviceSid = process.env.TWILIO_SYNC_SERVICE_SID

  await client.sync.v1
    .services(serviceSid)
    .documents.create({
      uniqueName: `${SESSION_PREFIX}${callSid}`,
      data: {
        callSid,
        transcriptionSid,
        messages: [],
        status: 'active',
        startedAt: Date.now(),
      },
      ttl: SESSION_TTL,
    })
}

export async function addMessage(callSid: string, message: TranscriptionMessage) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  const serviceSid = process.env.TWILIO_SYNC_SERVICE_SID

  const doc = await client.sync.v1
    .services(serviceSid)
    .documents(`${SESSION_PREFIX}${callSid}`)
    .fetch()

  const session = doc.data as TranscriptionSession
  const updatedMessages = [...session.messages, message]

  await client.sync.v1
    .services(serviceSid)
    .documents(`${SESSION_PREFIX}${callSid}`)
    .update({
      data: { ...session, messages: updatedMessages },
      ttl: SESSION_TTL,
    })
}

export async function getMessages(callSid: string): Promise<TranscriptionMessage[]> {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  const serviceSid = process.env.TWILIO_SYNC_SERVICE_SID

  const doc = await client.sync.v1
    .services(serviceSid)
    .documents(`${SESSION_PREFIX}${callSid}`)
    .fetch()

  return (doc.data as TranscriptionSession).messages
}
```

---

### Phase 3: フロントエンド実装

#### 3.1 文字起こしフック

`hooks/useTranscription.ts`

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

const POLL_INTERVAL = 500 // 500ms

export function useTranscription(callSid: string | null) {
  const [messages, setMessages] = useState<TranscriptionMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!callSid) return

    setIsConnected(true)

    const poll = async () => {
      const res = await fetch(`/api/transcription/messages?callSid=${callSid}`)
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL)
    poll() // 初回即時実行

    return () => {
      clearInterval(interval)
      setIsConnected(false)
    }
  }, [callSid])

  return { messages, isConnected }
}
```

#### 3.2 通話応答時に文字起こし開始

```typescript
const acceptCall = useCallback(async () => {
  deviceAcceptCall()

  // 文字起こし開始（parentCallSidを使用）
  if (parentCallSid) {
    await fetch('/api/transcription/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callSid: parentCallSid }),
    })
  }
}, [deviceAcceptCall, parentCallSid])
```

---

### Phase 4: CallSid問題の解決

#### 問題

- 発信側（顧客）: 子通話のCallSidを取得
- Webhook: 親通話のCallSidを受信
- → CallSidが一致しない

#### 解決策

TwiMLでparentCallSidをパラメータとして渡す：

```typescript
// twiml.ts
export function createDialClientTwiml(params: DialClientParams): string {
  const response = new VoiceResponse()
  const dial = response.dial({ callerId: `client:customer-${params.customerId}` })

  const client = dial.client()

  // parentCallSidをパラメータに追加
  client.parameter({ name: 'parentCallSid', value: params.parentCallSid })
  client.parameter({ name: 'customerId', value: params.customerId })
  // ... その他のパラメータ

  client.identity(`store-${params.storeCode}`)

  return response.toString()
}
```

---

## 型定義

```typescript
// types/transcription.ts
export type TranscriptionTrack = 'inbound_track' | 'outbound_track' | 'unknown'

export interface TranscriptionMessage {
  id: string
  callSid: string
  track: TranscriptionTrack
  text: string
  timestamp: number
  isFinal: boolean
}

export interface TranscriptionSession {
  callSid: string
  transcriptionSid: string
  messages: TranscriptionMessage[]
  status: 'active' | 'stopped' | 'error'
  startedAt: number
}
```

---

## トラブルシューティング

### 文字起こしが開始されない

1. **REST API URLの確認**: `POST /Calls/{CallSid}/Transcriptions.json`
2. **CallSidの確認**: 親通話のCallSidを使用しているか
3. **Webhook URLの確認**: 正しいURLがTwilioに渡されているか
4. **認証の確認**: AccountSid/AuthTokenが正しいか

### Webhookが呼ばれない

1. **URLの公開確認**: Webhookはインターネットからアクセス可能か
2. **Middlewareの確認**: `/api/transcription` がブロックされていないか
3. **TwiML `<Transcription>` を使っていないか**: REST APIを使用すること

### データが保存されない

1. **Twilio Sync Service SIDの確認**
2. **ドキュメント名の形式**: `transcription_{callSid}`
3. **TTLの確認**: デフォルト3600秒

### 確定メッセージのみ表示

- `TranscriptionData` JSON内の `confidence` フィールドで判定
- `confidence` がある = 確定メッセージ
- `confidence` がない = 中間結果（スキップ）

---

## Vercel環境での注意点

1. **環境変数設定時は `printf` を使用**
   ```bash
   printf '%s' 'value' | vercel env add VAR_NAME production
   ```

2. **Middlewareで公開パスを設定**
   ```typescript
   const PUBLIC_PATHS = ['/api/transcription']
   ```

3. **インメモリ状態は共有されない**
   - Twilio Syncまたは他の永続化ストアを使用

---

## 参考リンク

- [Twilio Realtime Transcription API](https://www.twilio.com/docs/voice/api/realtime-transcription)
- [Twilio Sync](https://www.twilio.com/docs/sync)
- [Twilio Voice SDK](https://www.twilio.com/docs/voice/sdks/javascript)
