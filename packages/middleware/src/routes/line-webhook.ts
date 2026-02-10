/**
 * LINE Webhook ルート
 */

import { Hono } from 'hono';
import type { LineWebhookRequestBody } from '@line-twilio-chat/shared';
import { verifyLineSignature } from '../utils/line-signature.js';
import { LineClient } from '../services/line.js';
import { TwilioClient } from '../services/twilio.js';
import {
  handleLineMessageEvent,
  handleLinePostbackEvent,
} from '../handlers/inbound.js';

export interface Env {
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_CONVERSATIONS_SERVICE_SID: string;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/webhook/line', async (c) => {
  try {
    // 1. リクエストボディ取得
    const signature = c.req.header('X-Line-Signature');
    const body = await c.req.text();

    // 2. イベント処理（一時的に署名検証をスキップ）
    // TODO: 署名検証を有効化する
    // const isValid = await verifyLineSignature(
    //   body,
    //   signature,
    //   c.env.LINE_CHANNEL_SECRET
    // );
    // if (!isValid) {
    //   return c.json({ error: 'Invalid signature' }, 401);
    // }

    const webhookBody: LineWebhookRequestBody = JSON.parse(body);
    const { events } = webhookBody;

    // クライアント初期化
    const lineClient = new LineClient(c.env.LINE_CHANNEL_ACCESS_TOKEN);
    const twilioClient = new TwilioClient(
      c.env.TWILIO_ACCOUNT_SID,
      c.env.TWILIO_AUTH_TOKEN,
      c.env.TWILIO_CONVERSATIONS_SERVICE_SID
    );

    // 並列処理（複数イベントを同時に処理）
    const results = await Promise.allSettled(
      events.map(async (event) => {
        switch (event.type) {
          case 'message':
            await handleLineMessageEvent(event, lineClient, twilioClient);
            return { type: 'message', success: true };

          case 'postback':
            await handleLinePostbackEvent(event, lineClient, twilioClient);
            return { type: 'postback', success: true };

          case 'follow':
            return { type: 'follow', success: true, note: 'not implemented' };

          case 'unfollow':
            return { type: 'unfollow', success: true, note: 'not implemented' };

          default:
            return { type: event.type, success: false, note: 'unknown type' };
        }
      })
    );

    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason);

    // 3. 200 OK を返却（LINE への応答）+ デバッグ情報
    return c.json({
      ok: true,
      debug: {
        eventsReceived: events.length,
        eventsProcessed: results.filter((r) => r.status === 'fulfilled').length,
        errors: errors.length > 0 ? errors.map(e => e instanceof Error ? e.message : String(e)) : undefined,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('LINE Webhook error:', error);
    return c.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default app;
