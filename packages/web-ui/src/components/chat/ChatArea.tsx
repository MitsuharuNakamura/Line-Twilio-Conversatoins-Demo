'use client';

import React, { useEffect, useRef } from 'react';
import { Conversation, Message } from '@twilio/conversations';
import type { ConversationAttributes } from '@line-twilio-chat/shared';
import MessageRenderer from '@/components/messages/MessageRenderer';
import MessageInput from './MessageInput';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onLoadMore: () => void;
  hasMore: boolean;
  operatorIdentity: string;
}

/**
 * ChatArea
 * チャット画面 - メッセージ一覧と入力エリア
 */
const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  loading,
  onSendMessage,
  onLoadMore,
  hasMore,
  operatorIdentity,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);

  // 自動スクロールを実行する関数
  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // 会話が変更されたら最下部にスクロール（ルームを開いた時）
  useEffect(() => {
    if (conversation && messages.length > 0) {
      // 会話が変更されたら即座に最下部へスクロール
      scrollToBottom('auto');

      // 画像読み込みを考慮して再スクロール
      setTimeout(() => scrollToBottom('smooth'), 500);
    }
  }, [conversation?.sid, scrollToBottom]); // conversation.sidの変更を監視

  // 新しいメッセージが追加されたら最下部にスクロール
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      // 最後のメッセージが自分のメッセージか、現在最下部付近にいる場合のみ自動スクロール
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage.author === operatorIdentity;
      const container = messagesContainerRef.current;

      if (container) {
        const isNearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (isOwnMessage || isNearBottom) {
          // 初回は即座にスクロール
          scrollToBottom('auto');

          // 画像やスタンプの読み込みを考慮して、少し遅延してから再スクロール
          const timeouts = [100, 300, 500, 1000];
          timeouts.forEach(delay => {
            setTimeout(() => {
              const stillNearBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < 200;
              if (stillNearBottom) {
                scrollToBottom('smooth');
              }
            }, delay);
          });
        }
      }
    }
  }, [messages, operatorIdentity, scrollToBottom]);

  // 過去メッセージ読み込み時のスクロール位置維持
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container && previousScrollHeight.current > 0) {
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      container.scrollTop = scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [messages.length]);

  // スクロールイベント - 上端に到達したら過去メッセージを読み込む
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loading) {
      previousScrollHeight.current = container.scrollHeight;
      onLoadMore();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">会話を選択してください</h3>
          <p className="mt-1 text-sm text-gray-500">
            左側の受信トレイから会話を選択すると、メッセージが表示されます
          </p>
        </div>
      </div>
    );
  }

  const attrs = conversation.attributes as unknown as ConversationAttributes | undefined;
  const displayName = attrs?.lineDisplayName || conversation.friendlyName || '不明なユーザー';

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-300 bg-white">
        <div className="flex items-center gap-3">
          {/* プロフィール画像 */}
          {attrs?.lineProfilePictureUrl ? (
            <img
              src={attrs.lineProfilePictureUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
              {displayName.charAt(0)}
            </div>
          )}

          {/* 名前とステータス */}
          <div className="flex-1">
            <h2 className="font-semibold text-gray-800">{displayName}</h2>
            <p className="text-xs text-gray-500">
              {attrs?.status === 'open' && '未対応'}
              {attrs?.status === 'assigned' && '対応中'}
              {attrs?.status === 'closed' && 'クローズ済み'}
            </p>
          </div>
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50"
      >
        {/* 過去メッセージ読み込み中 */}
        {loading && hasMore && (
          <div className="text-center py-2">
            <span className="text-sm text-gray-500">読み込み中...</span>
          </div>
        )}

        {/* メッセージリスト */}
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            まだメッセージがありません
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.author === operatorIdentity;
            return (
              <MessageRenderer
                key={message.sid}
                message={message}
                isOwnMessage={isOwnMessage}
              />
            );
          })
        )}

        {/* スクロール用の参照要素 */}
        <div ref={messagesEndRef} />
      </div>

      {/* メッセージ入力エリア */}
      <MessageInput onSendMessage={onSendMessage} disabled={loading} />
    </div>
  );
};

export default ChatArea;
