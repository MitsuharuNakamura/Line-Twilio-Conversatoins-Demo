'use client';

import React from 'react';
import { Message } from '@twilio/conversations';
import type { ImageMessageAttributes } from '@line-twilio-chat/shared';

interface ImageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

/**
 * ImageBubble (Phase 1: スタブ実装)
 * 画像メッセージの表示用コンポーネント
 * TODO: Phase 2で画像表示とプレビュー機能を実装
 */
const ImageBubble: React.FC<ImageBubbleProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as ImageMessageAttributes;
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
        {/* 画像プレースホルダー */}
        <div className="w-64 h-48 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <div className="text-5xl mb-2">🖼️</div>
            <p className="text-sm text-gray-500">Image</p>
            <p className="text-xs text-gray-400 mt-2 px-4 break-all">
              {attributes.mediaUrl}
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

export default ImageBubble;
