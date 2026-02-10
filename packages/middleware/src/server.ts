/**
 * Cloud Run エントリポイント
 * Node.js HTTPサーバーとしてHonoアプリを起動
 */

import { serve } from '@hono/node-server';
import app from './index.js';

const port = parseInt(process.env.PORT || '8080', 10);

console.log(`Starting server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});

console.log(`Server is running on http://0.0.0.0:${port}`);
