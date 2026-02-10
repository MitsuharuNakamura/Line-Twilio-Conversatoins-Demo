/**
 * Twilio Conversations Webhook ルート
 */

import { Hono } from 'hono';
import { LineClient } from '../services/line.js';
import { TwilioClient } from '../services/twilio.js';
import {
  handleConversationsMessageAdded,
  type ConversationsWebhookEvent,
} from '../handlers/outbound.js';

export interface Env {
  LINE_CHANNEL_ACCESS_TOKEN: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_CONVERSATIONS_SERVICE_SID: string;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/webhook/conversations', async (c) => {
  try {
    // Webhook イベントを取得（form-urlencoded形式）
    const formData = await c.req.formData();
    const event: ConversationsWebhookEvent = Object.fromEntries(formData) as any;

    console.log('Conversations Webhook event:', event.EventType);

    // onMessageAdded イベントのみ処理
    if (event.EventType !== 'onMessageAdded') {
      return c.json({ ok: true });
    }

    // クライアント初期化
    const lineClient = new LineClient(c.env.LINE_CHANNEL_ACCESS_TOKEN);
    const twilioClient = new TwilioClient(
      c.env.TWILIO_ACCOUNT_SID,
      c.env.TWILIO_AUTH_TOKEN,
      c.env.TWILIO_CONVERSATIONS_SERVICE_SID
    );

    // メッセージを LINE に転送
    await handleConversationsMessageAdded(event, lineClient, twilioClient);

    return c.json({ ok: true });
  } catch (error) {
    console.error('Conversations Webhook error:', error);
    // エラーが発生してもTwilioには200を返す（リトライを防ぐ）
    // 重大なエラーの場合のみ500を返すべきだが、Phase 1ではシンプルに
    return c.json({ ok: true });
  }
});

export default app;
