/**
 * Twilio Conversation Message Attributes
 * LINEメッセージタイプごとに異なる属性を持つ
 */
export type MessageAttributes =
  | TextMessageAttributes
  | StickerMessageAttributes
  | ImageMessageAttributes
  | VideoMessageAttributes
  | AudioMessageAttributes
  | LocationMessageAttributes
  | FileMessageAttributes
  | PostbackMessageAttributes
  | FlexMessageAttributes
  | RichMenuActionAttributes;

/** テキストメッセージ */
export interface TextMessageAttributes {
  type: 'text';
}

/** LINEスタンプ */
export interface StickerMessageAttributes {
  type: 'sticker';
  stickerId: string;
  packageId: string;
  stickerUrl: string;
}

/** 画像 */
export interface ImageMessageAttributes {
  type: 'image';
  mediaUrl: string;
}

/** 動画 */
export interface VideoMessageAttributes {
  type: 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
}

/** 音声 */
export interface AudioMessageAttributes {
  type: 'audio';
  mediaUrl: string;
  duration: number; // ミリ秒
}

/** 位置情報 */
export interface LocationMessageAttributes {
  type: 'location';
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
}

/** ファイル */
export interface FileMessageAttributes {
  type: 'file';
  fileName: string;
  fileSize: number;
  mediaUrl: string;
}

/** Postback (ボタンタップ) */
export interface PostbackMessageAttributes {
  type: 'postback';
  data: string;
  displayText?: string;
}

/** Flex Message送信記録 */
export interface FlexMessageAttributes {
  type: 'flex_message';
  template: string;
  templateData?: Record<string, unknown>;
}

/** リッチメニューアクション記録 */
export interface RichMenuActionAttributes {
  type: 'rich_menu_action';
  action: string;
  data?: string;
}
