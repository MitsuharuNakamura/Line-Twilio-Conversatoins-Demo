/**
 * Outbound ハンドラ
 * Twilio Conversations → LINE へのメッセージ送信
 */

import type { ConversationAttributes } from '@line-twilio-chat/shared';
import type { LineClient } from '../services/line.js';
import type { TwilioClient } from '../services/twilio.js';
import { isLineUserId } from '../services/conversation-manager.js';

/**
 * Conversations Webhook イベント
 */
export interface ConversationsWebhookEvent {
  EventType: string;
  ConversationSid: string;
  MessageSid: string;
  Author: string;
  Body: string | null;
  Attributes: string;
  DateCreated: string;
  Index: string;
  AccountSid: string;
  ChatServiceSid: string;
}

/**
 * Conversations onMessageAdded イベントを処理
 */
export async function handleConversationsMessageAdded(
  event: ConversationsWebhookEvent,
  lineClient: LineClient,
  twilioClient: TwilioClient
): Promise<void> {
  // LINEユーザーからのメッセージはスキップ（LINE に再送しない）
  if (isLineUserId(event.Author)) {
    console.log('Skipping LINE user message:', event.Author);
    return;
  }

  // Body が空の場合はスキップ
  if (!event.Body) {
    console.log('Skipping message with empty body');
    return;
  }

  // Conversation を取得して lineUserId を取得
  const conversation = await twilioClient.getConversationBySid(
    event.ConversationSid
  );

  const attrs: ConversationAttributes = JSON.parse(conversation.attributes);

  // LINE チャネルの Conversation でない場合はスキップ
  if (attrs.channel !== 'line') {
    console.log('Skipping non-LINE conversation');
    return;
  }

  // LINE にテキストメッセージを送信
  await lineClient.pushMessage(attrs.lineUserId, [
    {
      type: 'text',
      text: event.Body,
    },
  ]);

  console.log(`Message sent to LINE user: ${attrs.lineUserId}`);
}
