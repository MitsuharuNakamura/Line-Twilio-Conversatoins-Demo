/**
 * Node.js環境用エントリポイント
 * Hono アプリケーション（環境変数をprocess.envから取得）
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import lineWebhook from './routes/line-webhook.js';
import conversationsWebhook from './routes/conversations-webhook.js';
import tokenRoute from './routes/token.js';

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

// 環境変数をBindingsとして注入するミドルウェア
app.use('*', async (c, next) => {
  // Node.js環境では process.env から環境変数を取得
  c.env = {
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET!,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
    TWILIO_API_KEY_SID: process.env.TWILIO_API_KEY_SID!,
    TWILIO_API_KEY_SECRET: process.env.TWILIO_API_KEY_SECRET!,
    TWILIO_CONVERSATIONS_SERVICE_SID: process.env.TWILIO_CONVERSATIONS_SERVICE_SID!,
  } as any;
  await next();
});

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
