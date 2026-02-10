/**
 * ミドルウェア API リクエスト/レスポンス型定義
 */

/** Access Token 生成 */
export interface TokenRequest {
  identity: string;
}

export interface TokenResponse {
  token: string;
}

/** Flex Message 送信 */
export interface SendFlexRequest {
  lineUserId: string;
  template: string;
  templateData?: Record<string, unknown>;
  altText: string;
}

export interface SendFlexResponse {
  success: boolean;
  error?: string;
}

/** スタンプ送信 */
export interface SendStickerRequest {
  lineUserId: string;
  packageId: string;
  stickerId: string;
}

export interface SendStickerResponse {
  success: boolean;
  error?: string;
}

/** テンプレートメッセージ送信 */
export interface SendTemplateRequest {
  lineUserId: string;
  templateType: 'buttons' | 'confirm' | 'carousel' | 'image_carousel';
  altText: string;
  template: Record<string, unknown>;
}

export interface SendTemplateResponse {
  success: boolean;
  error?: string;
}

/** リッチメニュー切り替え */
export interface SwitchRichMenuRequest {
  lineUserId: string;
  richMenuId: string;
}

export interface SwitchRichMenuResponse {
  success: boolean;
  error?: string;
}

/** テンプレート一覧取得 */
export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'greeting' | 'promotion' | 'survey' | 'notification' | 'custom';
  previewUrl?: string;
  flexJson: Record<string, unknown>;
}

export interface TemplatesResponse {
  templates: Template[];
}

/** エラーレスポンス */
export interface ErrorResponse {
  error: string;
  details?: string;
}
