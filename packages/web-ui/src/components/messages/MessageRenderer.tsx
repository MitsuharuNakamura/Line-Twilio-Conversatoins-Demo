'use client';

import React from 'react';
import { Message } from '@twilio/conversations';
import type { MessageAttributes } from '@line-twilio-chat/shared';
import TextBubble from './TextBubble';
import StickerBubble from './StickerBubble';
import ImageBubble from './ImageBubble';
import VideoBubble from './VideoBubble';
import MapBubble from './MapBubble';
import FlexMessagePreview from './FlexMessagePreview';

interface MessageRendererProps {
  message: Message;
  isOwnMessage: boolean;
}

/**
 * MessageRenderer
 * Twilio Conversations Messageのattributes.typeに応じて適切なBubbleコンポーネントを表示する
 */
const MessageRenderer: React.FC<MessageRendererProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as MessageAttributes | undefined;
  const messageType = attributes?.type || 'text';

  // メッセージタイプごとに適切なコンポーネントを選択
  switch (messageType) {
    case 'text':
      return <TextBubble message={message} isOwnMessage={isOwnMessage} />;

    case 'sticker':
      return <StickerBubble message={message} isOwnMessage={isOwnMessage} />;

    case 'image':
      return <ImageBubble message={message} isOwnMessage={isOwnMessage} />;

    case 'video':
      return <VideoBubble message={message} isOwnMessage={isOwnMessage} />;

    case 'location':
      return <MapBubble message={message} isOwnMessage={isOwnMessage} />;

    case 'flex_message':
      return <FlexMessagePreview message={message} isOwnMessage={isOwnMessage} />;

    // Phase 1ではサポート外のタイプはテキストとして表示
    case 'audio':
    case 'file':
    case 'postback':
    case 'rich_menu_action':
    default:
      return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
          <div className={`max-w-xs px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}>
            <p className="text-sm">
              {message.body || `[未対応メッセージタイプ: ${messageType}]`}
            </p>
          </div>
        </div>
      );
  }
};

export default MessageRenderer;
