/**
 * Inbound ハンドラ
 * LINE → Twilio Conversations へのメッセージ変換
 */

import type {
  LineMessageEvent,
  LineTextMessage,
  LinePostbackEvent,
} from '@line-twilio-chat/shared';
import type { LineClient } from '../services/line';
import type { TwilioClient } from '../services/twilio';
import { getOrCreateConversation } from '../services/conversation-manager';

/**
 * LINE メッセージイベントを処理
 */
export async function handleLineMessageEvent(
  event: LineMessageEvent,
  lineClient: LineClient,
  twilioClient: TwilioClient
): Promise<void> {
  console.log('handleLineMessageEvent called');

  // ユーザー情報のソースからuserIdを取得
  if (event.source.type !== 'user') {
    console.warn('Group/Room messages are not supported yet');
    return;
  }

  const lineUserId = event.source.userId;
  console.log('LINE User ID:', lineUserId);

  // LINE プロフィール情報を取得
  console.log('Fetching LINE profile...');
  const profile = await lineClient.getProfile(lineUserId);
  console.log('LINE profile:', profile.displayName);

  // Conversation を取得または作成
  console.log('Getting or creating conversation...');
  const conversation = await getOrCreateConversation(
    twilioClient,
    lineUserId,
    profile
  );
  console.log('Conversation SID:', conversation.sid);

  // メッセージタイプ別に処理
  console.log('Message type:', event.message.type);
  switch (event.message.type) {
    case 'text':
      console.log('Handling text message:', (event.message as LineTextMessage).text);
      await handleTextMessage(event.message, conversation.sid, twilioClient, lineUserId);
      console.log('Text message handled successfully');
      break;

    case 'sticker':
      // Phase 2 で実装
      console.log('Sticker message received (not yet supported)');
      break;

    case 'image':
      // Phase 2 で実装
      console.log('Image message received (not yet supported)');
      break;

    case 'video':
      // Phase 2 で実装
      console.log('Video message received (not yet supported)');
      break;

    case 'audio':
      // Phase 2 で実装
      console.log('Audio message received (not yet supported)');
      break;

    case 'location':
      // Phase 2 で実装
      console.log('Location message received (not yet supported)');
      break;

    case 'file':
      // Phase 2 で実装
      console.log('File message received (not yet supported)');
      break;

    default:
      console.warn('Unknown message type:', (event.message as any).type);
  }
}

/**
 * テキストメッセージを Conversation に追加
 */
async function handleTextMessage(
  message: LineTextMessage,
  conversationSid: string,
  twilioClient: TwilioClient,
  lineUserId: string
): Promise<void> {
  console.log('Creating message in Twilio Conversation...');
  const result = await twilioClient.createMessage(conversationSid, {
    Author: lineUserId,
    Body: message.text,
    Attributes: JSON.stringify({ type: 'text' }),
  });
  console.log('Message created:', result.sid);
}

/**
 * LINE Postback イベントを処理
 */
export async function handleLinePostbackEvent(
  event: LinePostbackEvent,
  lineClient: LineClient,
  twilioClient: TwilioClient
): Promise<void> {
  // ユーザー情報のソースからuserIdを取得
  if (event.source.type !== 'user') {
    console.warn('Group/Room postbacks are not supported yet');
    return;
  }

  const lineUserId = event.source.userId;

  // LINE プロフィール情報を取得
  const profile = await lineClient.getProfile(lineUserId);

  // Conversation を取得または作成
  const conversation = await getOrCreateConversation(
    twilioClient,
    lineUserId,
    profile
  );

  // Postback データを Conversation に記録
  await twilioClient.createMessage(conversation.sid, {
    Author: lineUserId,
    Body: event.postback.data, // postback data を body に含める
    Attributes: JSON.stringify({
      type: 'postback',
      data: event.postback.data,
      // params があれば含める
      ...(event.postback.params && { params: event.postback.params }),
    }),
  });
}
