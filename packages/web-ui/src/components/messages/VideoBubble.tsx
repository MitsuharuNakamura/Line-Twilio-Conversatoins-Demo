'use client';

import React from 'react';
import { Message } from '@twilio/conversations';
import type { VideoMessageAttributes } from '@line-twilio-chat/shared';

interface VideoBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

/**
 * VideoBubble
 * 動画メッセージの表示用コンポーネント
 */
const VideoBubble: React.FC<VideoBubbleProps> = ({ message, isOwnMessage }) => {
  const attributes = message.attributes as unknown as VideoMessageAttributes;
  const timestamp = message.dateCreated;
  const [videoError, setVideoError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);

  const formatTime = (date: Date | null | undefined): string => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  React.useEffect(() => {
    const loadVideoUrl = async () => {
      try {
        // Twilio SDKのmediaオブジェクトから一時的な署名付きURLを取得
        const media = message.attachedMedia;
        if (media && media.length > 0) {
          const tempUrl = await media[0].getContentTemporaryUrl();
          setVideoUrl(tempUrl);
        } else {
          // fallback: attributesから直接取得
          setVideoUrl(attributes.mediaUrl || null);
        }
      } catch (error) {
        console.error('Failed to load video URL:', error);
        setVideoError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideoUrl();
  }, [message, attributes.mediaUrl]);

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* 動画 */}
        <div className="max-w-xs rounded-lg overflow-hidden shadow-md bg-gray-100">
          {!videoError && videoUrl ? (
            <>
              {isLoading && (
                <div className="w-64 h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                </div>
              )}
              <video
                src={videoUrl}
                controls
                className={`max-w-full h-auto ${isLoading ? 'hidden' : 'block'}`}
                onLoadedData={() => setIsLoading(false)}
                onError={() => {
                  setVideoError(true);
                  setIsLoading(false);
                }}
              />
            </>
          ) : (
            // 動画読み込み失敗時またはURLなし
            <div className="w-64 h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-2">🎬</div>
                <p className="text-sm text-gray-500">
                  {isLoading ? '読み込み中...' : '動画を読み込めません'}
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

export default VideoBubble;
