'use client';

import React from 'react';
import { Message } from '@twilio/conversations';

interface TextBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

/**
 * TextBubble
 * LINE風のテキストメッセージバブルを表示
 */
const TextBubble: React.FC<TextBubbleProps> = ({ message, isOwnMessage }) => {
  const messageBody = message.body || '';
  const timestamp = message.dateCreated;

  // 時刻を HH:MM 形式にフォーマット
  const formatTime = (date: Date | null | undefined): string => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* メッセージバブル */}
        <div
          className={`
            relative px-4 py-2 rounded-2xl break-words
            ${isOwnMessage
              ? 'bg-[#06C755] text-white rounded-br-sm'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
            }
            shadow-sm
          `}
        >
          {/* メッセージ本文 */}
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {messageBody}
          </p>
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

export default TextBubble;
