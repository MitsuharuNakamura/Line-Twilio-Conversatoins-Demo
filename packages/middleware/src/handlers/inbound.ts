/**
 * Inbound ハンドラ
 * LINE → Twilio Conversations へのメッセージ変換
 */

import type {
  LineMessageEvent,
  LineTextMessage,
  LineStickerMessage,
  LineImageMessage,
  LineVideoMessage,
  LinePostbackEvent,
  StickerMessageAttributes,
  ImageMessageAttributes,
  VideoMessageAttributes,
} from '@line-twilio-chat/shared';
import type { LineClient } from '../services/line.js';
import type { TwilioClient } from '../services/twilio.js';
import { getOrCreateConversation } from '../services/conversation-manager.js';

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
  console.log('Full message object:', JSON.stringify(event.message));
  switch (event.message.type) {
    case 'text':
      console.log('Handling text message:', (event.message as LineTextMessage).text);
      await handleTextMessage(event.message, conversation.sid, twilioClient, lineUserId);
      console.log('Text message handled successfully');
      break;

    case 'sticker':
      console.log('Handling sticker message');
      await handleStickerMessage(event.message, conversation.sid, twilioClient, lineUserId);
      console.log('Sticker message handled successfully');
      break;

    case 'image':
      console.log('Handling image message');
      try {
        await handleImageMessage(event.message, conversation.sid, twilioClient, lineClient, lineUserId);
        console.log('Image message handled successfully');
      } catch (error) {
        console.error('Error handling image message:', error);
        throw error;
      }
      break;

    case 'video':
      console.log('Handling video message');
      await handleVideoMessage(event.message, conversation.sid, twilioClient, lineClient, lineUserId);
      console.log('Video message handled successfully');
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

  // LINE絵文字情報を含める
  const attributes: any = { type: 'text' };
  if (message.emojis && message.emojis.length > 0) {
    attributes.emojis = message.emojis;
  }

  const result = await twilioClient.createMessage(conversationSid, {
    Author: lineUserId,
    Body: message.text,
    Attributes: JSON.stringify(attributes),
  });
  console.log('Message created:', result.sid);
}

/**
 * スタンプメッセージを Conversation に追加
 */
async function handleStickerMessage(
  message: LineStickerMessage,
  conversationSid: string,
  twilioClient: TwilioClient,
  lineUserId: string
): Promise<void> {
  // LINEスタンプの画像URLを生成
  // 公式スタンプの場合: https://stickershop.line-scdn.net/stickershop/v1/sticker/{stickerId}/android/sticker.png
  const stickerUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${message.stickerId}/android/sticker.png`;

  const attrs: StickerMessageAttributes = {
    type: 'sticker',
    stickerId: message.stickerId,
    packageId: message.packageId,
    stickerUrl,
  };

  console.log('Creating sticker message in Twilio Conversation...');
  const result = await twilioClient.createMessage(conversationSid, {
    Author: lineUserId,
    Body: `[Sticker: ${message.packageId}/${message.stickerId}]`, // スタンプの情報をbodyに含める
    Attributes: JSON.stringify(attrs),
  });
  console.log('Sticker message created:', result.sid);
}

/**
 * 画像メッセージを Conversation に追加
 */
async function handleImageMessage(
  message: LineImageMessage,
  conversationSid: string,
  twilioClient: TwilioClient,
  lineClient: LineClient,
  lineUserId: string
): Promise<void> {
  console.log('Downloading image from LINE...');

  // LINE Content APIから画像データを取得
  const imageData = await lineClient.getContent(message.id);

  // Step 1: MCSにメディアをアップロード
  console.log('Uploading image to Twilio MCS...');
  const mediaSid = await twilioClient.uploadMediaToMCS(
    'image/jpeg', // LINEは基本的にJPEG形式
    imageData
  );
  console.log('Media uploaded to MCS, Media SID:', mediaSid);

  const attrs: ImageMessageAttributes = {
    type: 'image',
    mediaUrl: `https://mcs.us1.twilio.com/v1/Services/${twilioClient.serviceSid}/Media/${mediaSid}`,
  };

  // Step 2: メディアSIDを使ってメッセージを作成
  console.log('Creating image message in Twilio Conversation...');
  const result = await twilioClient.createMediaMessage(
    conversationSid,
    mediaSid,
    lineUserId,
    '[Image]',
    JSON.stringify(attrs)
  );
  console.log('Image message created:', result.sid);
}

/**
 * 動画メッセージを Conversation に追加
 */
async function handleVideoMessage(
  message: LineVideoMessage,
  conversationSid: string,
  twilioClient: TwilioClient,
  lineClient: LineClient,
  lineUserId: string
): Promise<void> {
  console.log('Downloading video from LINE...');

  // LINE Content APIから動画データを取得
  const videoData = await lineClient.getContent(message.id);

  // Step 1: MCSにメディアをアップロード
  console.log('Uploading video to Twilio MCS...');
  const mediaSid = await twilioClient.uploadMediaToMCS(
    'video/mp4', // LINEは基本的にMP4形式
    videoData
  );
  console.log('Media uploaded to MCS, Media SID:', mediaSid);

  const attrs: VideoMessageAttributes = {
    type: 'video',
    mediaUrl: `https://mcs.us1.twilio.com/v1/Services/${twilioClient.serviceSid}/Media/${mediaSid}`,
  };

  // Step 2: メディアSIDを使ってメッセージを作成
  console.log('Creating video message in Twilio Conversation...');
  const result = await twilioClient.createMediaMessage(
    conversationSid,
    mediaSid,
    lineUserId,
    '[Video]',
    JSON.stringify(attrs)
  );
  console.log('Video message created:', result.sid);
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
