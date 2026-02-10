/**
 * LINE Webhook 署名検証
 * Web Crypto API を使用（Cloudflare Workers 環境）
 */

/**
 * LINE Webhook の署名を検証する
 * @param body リクエストボディ（文字列）
 * @param signature X-Line-Signature ヘッダーの値
 * @param channelSecret LINE チャネルシークレット
 * @returns 署名が有効なら true
 */
export async function verifyLineSignature(
  body: string,
  signature: string | undefined,
  channelSecret: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  try {
    const encoder = new TextEncoder();

    // シークレットキーをインポート
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(channelSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // HMAC 署名を生成
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    // Base64 エンコード
    const hash = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    // 署名を比較
    return hash === signature;
  } catch (error) {
    console.error('LINE signature verification error:', error);
    return false;
  }
}
