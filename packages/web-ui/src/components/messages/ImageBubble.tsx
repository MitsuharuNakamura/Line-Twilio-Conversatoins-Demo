'use client';

import React from 'react';
import { Message } from '@twilio/conversations';
import type { ImageMessageAttributes } from '@line-twilio-chat/shared';

interface ImageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

/**
 * ImageBubble
 * 画像メッセージの表示用コンポーネント
 */
const ImageBubble: React.FC<ImageBubbleProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as ImageMessageAttributes;
  const timestamp = message.dateCreated;
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);

  const formatTime = (date: Date | null | undefined): string => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  React.useEffect(() => {
    const loadImageUrl = async () => {
      try {
        // Twilio SDKのmediaオブジェクトから一時的な署名付きURLを取得
        const media = message.attachedMedia;
        if (media && media.length > 0) {
          const tempUrl = await media[0].getContentTemporaryUrl();
          setImageUrl(tempUrl);
        } else {
          // fallback: attributesから直接取得
          setImageUrl(attributes.mediaUrl || null);
        }
      } catch (error) {
        console.error('Failed to load image URL:', error);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImageUrl();
  }, [message, attributes.mediaUrl]);

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* 画像 */}
        <div className="max-w-xs rounded-lg overflow-hidden shadow-md bg-gray-100">
          {!imageError && imageUrl ? (
            <>
              {isLoading && (
                <div className="w-64 h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                </div>
              )}
              <img
                src={imageUrl}
                alt="Image"
                className={`max-w-full h-auto ${isLoading ? 'hidden' : 'block'}`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setImageError(true);
                  setIsLoading(false);
                }}
              />
            </>
          ) : (
            // 画像読み込み失敗時またはURLなし
            <div className="w-64 h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-2">🖼️</div>
                <p className="text-sm text-gray-500">
                  {isLoading ? '読み込み中...' : '画像を読み込めません'}
                </p>
              </div>
            </div>
          )}
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
