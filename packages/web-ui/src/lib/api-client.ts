import type {
  SendFlexRequest,
  SendFlexResponse,
  SendStickerRequest,
  SendStickerResponse,
  SendTemplateRequest,
  SendTemplateResponse,
  SwitchRichMenuRequest,
  SwitchRichMenuResponse,
  TemplatesResponse,
} from '@line-twilio-chat/shared';

/**
 * ミドルウェアAPIクライアント
 * LINEの各種機能を呼び出すためのヘルパー関数
 */

const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;

if (!MIDDLEWARE_URL) {
  console.warn('NEXT_PUBLIC_MIDDLEWARE_URL is not set');
}

/**
 * Flex Messageを送信する
 */
export async function sendFlexMessage(
  request: SendFlexRequest
): Promise<SendFlexResponse> {
  const response = await fetch(`${MIDDLEWARE_URL}/api/send/flex`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to send flex message: ${response.statusText}`);
  }

  return response.json();
}

/**
 * スタンプを送信する
 */
export async function sendSticker(
  request: SendStickerRequest
): Promise<SendStickerResponse> {
  const response = await fetch(`${MIDDLEWARE_URL}/api/send/sticker`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to send sticker: ${response.statusText}`);
  }

  return response.json();
}

/**
 * テンプレートメッセージを送信する
 */
export async function sendTemplate(
  request: SendTemplateRequest
): Promise<SendTemplateResponse> {
  const response = await fetch(`${MIDDLEWARE_URL}/api/send/template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to send template: ${response.statusText}`);
  }

  return response.json();
}

/**
 * リッチメニューを切り替える
 */
export async function switchRichMenu(
  request: SwitchRichMenuRequest
): Promise<SwitchRichMenuResponse> {
  const response = await fetch(`${MIDDLEWARE_URL}/api/richmenu/switch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to switch rich menu: ${response.statusText}`);
  }

  return response.json();
}

/**
 * テンプレート一覧を取得する
 */
export async function getTemplates(): Promise<TemplatesResponse> {
  const response = await fetch(`${MIDDLEWARE_URL}/api/templates`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get templates: ${response.statusText}`);
  }

  return response.json();
}
