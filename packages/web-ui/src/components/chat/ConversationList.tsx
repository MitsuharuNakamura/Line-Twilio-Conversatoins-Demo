'use client';

import React, { useState, useMemo } from 'react';
import { Conversation } from '@twilio/conversations';
import type { ConversationAttributes } from '@line-twilio-chat/shared';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

/**
 * ConversationList
 * 受信トレイ - 会話一覧を表示
 */
const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'assigned' | 'closed'>('all');

  // フィルタリングされた会話リスト
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const attrs = conv.attributes as unknown as ConversationAttributes | undefined;

      // ステータスフィルタ
      if (statusFilter !== 'all' && attrs?.status !== statusFilter) {
        return false;
      }

      // 検索クエリフィルタ
      if (searchQuery) {
        const displayName = attrs?.lineDisplayName || conv.friendlyName || '';
        return displayName.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return true;
    });
  }, [conversations, statusFilter, searchQuery]);

  return (
    <div className="w-64 border-r border-gray-300 flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-300">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">受信トレイ</h2>

        {/* 検索バー */}
        <input
          type="text"
          placeholder="会話を検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-line-green"
        />

        {/* ステータスフィルタ */}
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 px-2 py-1 text-xs rounded ${
              statusFilter === 'all'
                ? 'bg-line-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全て
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`flex-1 px-2 py-1 text-xs rounded ${
              statusFilter === 'open'
                ? 'bg-line-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            未対応
          </button>
          <button
            onClick={() => setStatusFilter('assigned')}
            className={`flex-1 px-2 py-1 text-xs rounded ${
              statusFilter === 'assigned'
                ? 'bg-line-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            対応中
          </button>
        </div>
      </div>

      {/* 会話リスト */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchQuery ? '該当する会話が見つかりません' : '会話がありません'}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.sid}
              conversation={conv}
              isActive={activeConversation?.sid === conv.sid}
              onClick={() => onSelectConversation(conv)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

/**
 * ConversationItem
 * 個別の会話アイテム
 */
const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const attrs = conversation.attributes as unknown as ConversationAttributes | undefined;
  const displayName = attrs?.lineDisplayName || conversation.friendlyName || '不明なユーザー';
  const profilePicture = attrs?.lineProfilePictureUrl;
  const status = attrs?.status || 'open';

  // 最終メッセージのプレビュー
  const lastMessageText = (conversation.lastMessage as any)?.body || 'メッセージがありません';
  const lastMessageTime = conversation.lastMessage?.dateCreated;

  // 時刻フォーマット
  const formatTime = (date: Date | undefined) => {
    if (!date) return '';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffHours = diff / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    }
  };

  // ステータスバッジの色
  const getStatusColor = () => {
    switch (status) {
      case 'open':
        return 'bg-red-500';
      case 'assigned':
        return 'bg-yellow-500';
      case 'closed':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-line-lightgreen' : ''
      }`}
    >
      {/* プロフィール画像 */}
      <div className="flex-shrink-0 relative">
        {profilePicture ? (
          <img
            src={profilePicture}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
            {displayName.charAt(0)}
          </div>
        )}
        {/* ステータスバッジ */}
        <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor()} rounded-full border-2 border-white`} />
      </div>

      {/* 会話情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-semibold text-gray-800 text-sm truncate">{displayName}</h3>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {formatTime(lastMessageTime)}
          </span>
        </div>
        <p className="text-xs text-gray-600 truncate">{lastMessageText}</p>
      </div>
    </div>
  );
};

export default ConversationList;
