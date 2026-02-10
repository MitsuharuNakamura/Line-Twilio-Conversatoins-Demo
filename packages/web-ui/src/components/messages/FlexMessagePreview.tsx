'use client';

import React from 'react';
import { Message } from '@twilio/conversations';
import type { FlexMessageAttributes } from '@line-twilio-chat/shared';

interface FlexMessagePreviewProps {
  message: Message;
  isOwnMessage: boolean;
}

/**
 * FlexMessagePreview (Phase 1: スタブ実装)
 * LINE Flex Message送信記録の表示用コンポーネント
 * TODO: Phase 2でFlex Messageのビジュアルプレビューを実装
 */
const FlexMessagePreview: React.FC<FlexMessagePreviewProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as FlexMessageAttributes;
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
        {/* Flex Messageプレースホルダー */}
        <div className="w-72 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                LINE Flex Message
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Template: <span className="font-mono">{attributes.template}</span>
              </p>
              {attributes.templateData && (
                <div className="text-xs text-gray-400 bg-gray-50 rounded p-2 mt-2">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(attributes.templateData, null, 2)}
                  </pre>
                </div>
              )}
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

export default FlexMessagePreview;
