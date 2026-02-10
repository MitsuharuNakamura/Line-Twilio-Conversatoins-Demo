'use client';

import React from 'react';
import { Message } from '@twilio/conversations';
import type { LocationMessageAttributes } from '@line-twilio-chat/shared';

interface MapBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

/**
 * MapBubble (Phase 1: スタブ実装)
 * 位置情報メッセージの表示用コンポーネント
 * TODO: Phase 2で地図表示（Google Maps / Mapbox等）を実装
 */
const MapBubble: React.FC<MapBubbleProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as LocationMessageAttributes;
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
        {/* 地図プレースホルダー */}
        <div className="w-64 h-48 bg-gray-100 border border-gray-300 rounded-lg flex flex-col items-center justify-center overflow-hidden">
          <div className="text-center">
            <div className="text-5xl mb-2">📍</div>
            <p className="text-sm text-gray-500 font-medium">Location</p>
            {attributes.title && (
              <p className="text-sm text-gray-700 mt-2 px-4">{attributes.title}</p>
            )}
            {attributes.address && (
              <p className="text-xs text-gray-500 mt-1 px-4">{attributes.address}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {attributes.latitude.toFixed(6)}, {attributes.longitude.toFixed(6)}
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

export default MapBubble;
