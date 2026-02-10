'use client';

import React from 'react';
import { Message } from '@twilio/conversations';

interface TextBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

interface LineEmoji {
  index: number;
  length: number;
  productId: string;
  emojiId: string;
}

/**
 * TextBubble
 * LINE風のテキストメッセージバブルを表示（LINE絵文字対応）
 */
const TextBubble: React.FC<TextBubbleProps> = ({ message, isOwnMessage }) => {
  const messageBody = message.body || '';
  const timestamp = message.dateCreated;
  const attributes = message.attributes as any;
  const emojis: LineEmoji[] = attributes?.emojis || [];

  // 時刻を HH:MM 形式にフォーマット
  const formatTime = (date: Date | null | undefined): string => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // テキスト内のLINE絵文字を画像に置き換える
  const renderTextWithEmojis = () => {
    if (emojis.length === 0) {
      return messageBody;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // 絵文字をインデックス順にソート
    const sortedEmojis = [...emojis].sort((a, b) => a.index - b.index);

    sortedEmojis.forEach((emoji, i) => {
      // 絵文字の前のテキスト
      if (emoji.index > lastIndex) {
        parts.push(messageBody.substring(lastIndex, emoji.index));
      }

      // LINE絵文字画像
      const emojiUrl = `https://stickershop.line-scdn.net/sticonshop/v1/sticon/${emoji.productId}/iPhone/${emoji.emojiId}.png`;
      parts.push(
        <img
          key={`emoji-${i}`}
          src={emojiUrl}
          alt="LINE Emoji"
          className="inline-block w-6 h-6 align-middle mx-0.5"
          onError={(e) => {
            // 画像読み込み失敗時は元のテキストを表示
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const text = document.createTextNode(messageBody.substring(emoji.index, emoji.index + emoji.length));
            target.parentNode?.insertBefore(text, target);
          }}
        />
      );

      lastIndex = emoji.index + emoji.length;
    });

    // 最後の絵文字以降のテキスト
    if (lastIndex < messageBody.length) {
      parts.push(messageBody.substring(lastIndex));
    }

    return parts;
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
          {/* メッセージ本文（LINE絵文字を画像として表示） */}
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {renderTextWithEmojis()}
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
