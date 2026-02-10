'use client';

import React from 'react';
import { Message } from '@twilio/conversations';
import type { StickerMessageAttributes } from '@line-twilio-chat/shared';

interface StickerBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

/**
 * StickerBubble (Phase 1: スタブ実装)
 * LINEスタンプの表示用コンポーネント
 * TODO: Phase 2でスタンプ画像表示を実装
 */
const StickerBubble: React.FC<StickerBubbleProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as StickerMessageAttributes;
  const timestamp = message.dateCreated;

  const formatTime = (date: Date | null | undefined): string => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* スタンププレースホルダー */}
        <div className="w-32 h-32 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🎨</div>
            <p className="text-xs text-gray-500">LINE Sticker</p>
            <p className="text-xs text-gray-400 mt-1">
              {attributes.packageId}/{attributes.stickerId}
            </p>
          </div>
        </div>

        {/* タイムスタンプ */}
        <div className="mt-1 px-1">
          <span className="text-xs text-gray-500">
            {formatTime(timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StickerBubble;
