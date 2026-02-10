/**
 * Twilio Access Token 生成ルート
 */

import { Hono } from 'hono';
import { SignJWT } from 'jose';
import type { TokenRequest, TokenResponse } from '@line-twilio-chat/shared';

export interface Env {
  TWILIO_ACCOUNT_SID: string;
  TWILIO_API_KEY_SID: string;
  TWILIO_API_KEY_SECRET: string;
  TWILIO_CONVERSATIONS_SERVICE_SID: string;
}

const app = new Hono<{ Bindings: Env }>();

/**
 * Twilio Access Token を生成
 * Conversations Grant を含む
 */
app.post('/api/token', async (c) => {
  try {
    const body: TokenRequest = await c.req.json();
    const { identity } = body;

    if (!identity) {
      return c.json({ error: 'identity is required' }, 400);
    }

    // JWT の有効期限（1時間）
    const ttl = 3600;
    const now = Math.floor(Date.now() / 1000);

    // JWT ペイロード
    const payload = {
      jti: `${c.env.TWILIO_API_KEY_SID}-${now}`,
      iss: c.env.TWILIO_API_KEY_SID,
      sub: c.env.TWILIO_ACCOUNT_SID,
      exp: now + ttl,
      nbf: now,
      grants: {
        identity,
        chat: {
          service_sid: c.env.TWILIO_CONVERSATIONS_SERVICE_SID,
        },
      },
    };

    // API Key Secret を TextEncoder でエンコード
    const encoder = new TextEncoder();
    const secret = encoder.encode(c.env.TWILIO_API_KEY_SECRET);

    // JWT 生成
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(secret);

    const response: TokenResponse = { token };
    return c.json(response);
  } catch (error) {
    console.error('Token generation error:', error);
    return c.json({ error: 'Token generation failed' }, 500);
  }
});

export default app;
