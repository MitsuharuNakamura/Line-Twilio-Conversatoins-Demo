import type { TokenResponse } from '@line-twilio-chat/shared';

/**
 * Access Token 管理
 * トークンのキャッシュと更新を管理する
 */

let tokenPromise: Promise<string> | null = null;
let cachedToken: string | null = null;

/**
 * Access Tokenを取得する
 * キャッシュがあればキャッシュを返す、なければ新規取得
 */
export async function getAccessToken(identity: string): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  if (!tokenPromise) {
    tokenPromise = fetchNewToken(identity);
  }

  const token = await tokenPromise;
  cachedToken = token;
  tokenPromise = null;

  return token;
}

/**
 * 新しいAccess Tokenを取得する
 */
async function fetchNewToken(identity: string): Promise<string> {
  const response = await fetch('/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identity }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.statusText}`);
  }

  const data = await response.json() as TokenResponse;
  console.log('Generated token:', data.token);

  // トークンをデコードして内容を確認
  try {
    const parts = data.token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', payload);
    }
  } catch (e) {
    console.error('Failed to decode token:', e);
  }

  return data.token;
}

/**
 * トークンを更新する（期限切れ前に呼び出す）
 */
export async function refreshToken(identity: string): Promise<string> {
  // キャッシュをクリア
  cachedToken = null;
  tokenPromise = null;

  // 新しいトークンを取得
  return getAccessToken(identity);
}

/**
 * トークンキャッシュをクリアする
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenPromise = null;
}
