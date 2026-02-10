/**
 * LINE Webhook イベント型定義
 */

/** LINE Webhook リクエストボディ */
export interface LineWebhookRequestBody {
  destination: string;
  events: LineWebhookEvent[];
}

/** LINE Webhook イベント */
export type LineWebhookEvent =
  | LineMessageEvent
  | LinePostbackEvent
  | LineFollowEvent
  | LineUnfollowEvent
  | LineJoinEvent
  | LineLeaveEvent
  | LineMemberJoinEvent
  | LineMemberLeaveEvent
  | LineBeaconEvent
  | LineAccountLinkEvent
  | LineThingsEvent;

/** ベースイベント */
interface BaseLineEvent {
  timestamp: number;
  source: LineEventSource;
  webhookEventId: string;
  deliveryContext: {
    isRedelivery: boolean;
  };
}

/** イベントソース */
export type LineEventSource =
  | { type: 'user'; userId: string }
  | { type: 'group'; groupId: string; userId?: string }
  | { type: 'room'; roomId: string; userId?: string };

/** メッセージイベント */
export interface LineMessageEvent extends BaseLineEvent {
  type: 'message';
  replyToken: string;
  message: LineMessage;
}

export type LineMessage =
  | LineTextMessage
  | LineStickerMessage
  | LineImageMessage
  | LineVideoMessage
  | LineAudioMessage
  | LineLocationMessage
  | LineFileMessage;

export interface LineTextMessage {
  type: 'text';
  id: string;
  text: string;
  emojis?: Array<{
    index: number;
    length: number;
    productId: string;
    emojiId: string;
  }>;
  mention?: {
    mentionees: Array<{
      index: number;
      length: number;
      userId: string;
    }>;
  };
}

export interface LineStickerMessage {
  type: 'sticker';
  id: string;
  packageId: string;
  stickerId: string;
  stickerResourceType: 'STATIC' | 'ANIMATION' | 'SOUND' | 'ANIMATION_SOUND' | 'POPUP' | 'POPUP_SOUND' | 'CUSTOM' | 'MESSAGE';
  keywords?: string[];
}

export interface LineImageMessage {
  type: 'image';
  id: string;
  contentProvider: {
    type: 'line' | 'external';
    originalContentUrl?: string;
    previewImageUrl?: string;
  };
}

export interface LineVideoMessage {
  type: 'video';
  id: string;
  duration: number;
  contentProvider: {
    type: 'line' | 'external';
    originalContentUrl?: string;
    previewImageUrl?: string;
  };
}

export interface LineAudioMessage {
  type: 'audio';
  id: string;
  duration: number;
  contentProvider: {
    type: 'line' | 'external';
    originalContentUrl?: string;
  };
}

export interface LineLocationMessage {
  type: 'location';
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface LineFileMessage {
  type: 'file';
  id: string;
  fileName: string;
  fileSize: number;
}

/** Postbackイベント */
export interface LinePostbackEvent extends BaseLineEvent {
  type: 'postback';
  replyToken: string;
  postback: {
    data: string;
    params?: {
      date?: string;
      time?: string;
      datetime?: string;
    };
  };
}

/** フォローイベント */
export interface LineFollowEvent extends BaseLineEvent {
  type: 'follow';
  replyToken: string;
}

/** アンフォローイベント */
export interface LineUnfollowEvent extends BaseLineEvent {
  type: 'unfollow';
}

/** グループ参加イベント */
export interface LineJoinEvent extends BaseLineEvent {
  type: 'join';
  replyToken: string;
}

/** グループ退出イベント */
export interface LineLeaveEvent extends BaseLineEvent {
  type: 'leave';
}

/** メンバー参加イベント */
export interface LineMemberJoinEvent extends BaseLineEvent {
  type: 'memberJoined';
  replyToken: string;
  joined: {
    members: Array<{
      type: 'user';
      userId: string;
    }>;
  };
}

/** メンバー退出イベント */
export interface LineMemberLeaveEvent extends BaseLineEvent {
  type: 'memberLeft';
  left: {
    members: Array<{
      type: 'user';
      userId: string;
    }>;
  };
}

/** ビーコンイベント */
export interface LineBeaconEvent extends BaseLineEvent {
  type: 'beacon';
  replyToken: string;
  beacon: {
    hwid: string;
    type: 'enter' | 'leave' | 'banner';
    dm?: string;
  };
}

/** アカウント連携イベント */
export interface LineAccountLinkEvent extends BaseLineEvent {
  type: 'accountLink';
  replyToken: string;
  link: {
    result: 'ok' | 'failed';
    nonce: string;
  };
}

/** LINE Thingsイベント */
export interface LineThingsEvent extends BaseLineEvent {
  type: 'things';
  replyToken: string;
  things: {
    type: 'link' | 'unlink' | 'scenarioResult';
    deviceId: string;
    result?: {
      scenarioId: string;
      revision: number;
      startTime: number;
      endTime: number;
      resultCode: 'success' | 'gatt_error' | 'runtime_error';
      actionResults: Array<{
        type: string;
        data: string;
      }>;
      bleNotificationPayload?: string;
      errorReason?: string;
    };
  };
}

/** LINE Push API メッセージ */
export interface LinePushMessage {
  type: 'text' | 'sticker' | 'image' | 'video' | 'audio' | 'location' | 'imagemap' | 'template' | 'flex';
  [key: string]: unknown;
}

export interface LineTextPushMessage extends LinePushMessage {
  type: 'text';
  text: string;
}

export interface LineStickerPushMessage extends LinePushMessage {
  type: 'sticker';
  packageId: string;
  stickerId: string;
}
