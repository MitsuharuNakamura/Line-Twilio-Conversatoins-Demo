'use client';

import React from 'react';
import { Message } from '@twilio/conversations';
import type { VideoMessageAttributes } from '@line-twilio-chat/shared';

interface VideoBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

/**
 * VideoBubble (Phase 1: スタブ実装)
 * 動画メッセージの表示用コンポーネント
 * TODO: Phase 2で動画プレイヤーとサムネイル表示を実装
 */
const VideoBubble: React.FC<VideoBubbleProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as VideoMessageAttributes;
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
        {/* 動画プレースホルダー */}
        <div className="w-64 h-48 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative">
          <div className="text-center">
            <div className="text-5xl mb-2">🎬</div>
            <p className="text-sm text-gray-500">Video</p>
            <p className="text-xs text-gray-400 mt-2 px-4 break-all">
              {attributes.mediaUrl}
            </p>
          </div>
          {/* 再生ボタン風のアイコン */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
            </div>
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

export default VideoBubble;
