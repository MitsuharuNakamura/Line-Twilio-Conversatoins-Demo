'use client';

import React from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';

// 開発時はオペレーターのIdentityを固定値で使用
// 本番環境では認証システムから取得する
const OPERATOR_IDENTITY = 'operator-001';

/**
 * ChatLayout
 * メインレイアウト - 受信トレイとチャットエリアを配置
 */
const ChatLayout: React.FC = () => {
  // Conversations管理
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    loading: conversationsLoading,
    error: conversationsError,
  } = useConversations(OPERATOR_IDENTITY);

  // Messages管理
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    loadMoreMessages,
    hasMore,
  } = useMessages(activeConversation);

  // エラーハンドリング
  if (conversationsError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            接続エラーが発生しました
          </div>
          <p className="text-gray-600 text-sm">{conversationsError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-line-green text-white rounded-lg hover:bg-green-600"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // 初期読み込み中
  if (conversationsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-line-green mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-line-green text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
            <path d="M8 10h2v2H8v-2zm6 0h2v2h-2v-2zm-3 5c-1.654 0-3-1.346-3-3h2c0 .551.449 1 1 1s1-.449 1-1h2c0 1.654-1.346 3-3 3z" />
          </svg>
          <h1 className="text-xl font-bold">LINE × Twilio Chat</h1>
        </div>
        <div className="text-sm">
          オペレーター: <span className="font-semibold">{OPERATOR_IDENTITY}</span>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* 受信トレイ */}
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
        />

        {/* チャットエリア */}
        <ChatArea
          conversation={activeConversation}
          messages={messages}
          loading={messagesLoading}
          onSendMessage={sendMessage}
          onLoadMore={loadMoreMessages}
          hasMore={hasMore}
          operatorIdentity={OPERATOR_IDENTITY}
        />
      </div>

      {/* メッセージエラー表示 */}
      {messagesError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">{messagesError.message}</p>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;
