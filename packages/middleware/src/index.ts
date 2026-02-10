/**
 * Cloudflare Workers エントリポイント
 * Hono アプリケーション
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import lineWebhook from './routes/line-webhook';
import conversationsWebhook from './routes/conversations-webhook';
import tokenRoute from './routes/token';

export interface Env {
  // LINE
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;

  // Twilio
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_API_KEY_SID: string;
  TWILIO_API_KEY_SECRET: string;
  TWILIO_CONVERSATIONS_SERVICE_SID: string;
}

const app = new Hono<{ Bindings: Env }>();

// リクエストログミドルウェア
app.use('*', async (c, next) => {
  const start = Date.now();
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
  const end = Date.now();
  console.log(`${c.req.method} ${c.req.url} - ${c.res.status} (${end - start}ms)`);
});

// CORS 設定（Web UI からのアクセスを許可）
app.use('/api/*', cors());

// ヘルスチェック
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ルートをマウント
app.route('/', lineWebhook);
app.route('/', conversationsWebhook);
app.route('/', tokenRoute);

// 404 ハンドラ
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// エラーハンドラ
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
