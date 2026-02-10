'use client';

import React from 'react';
import { Conversation } from '@twilio/conversations';
import type { ConversationAttributes } from '@line-twilio-chat/shared';

interface UserInfoPanelProps {
  conversation: Conversation | null;
}

/**
 * UserInfoPanel
 * 選択中のConversationのLINEユーザー情報を表示するサイドパネル
 */
const UserInfoPanel: React.FC<UserInfoPanelProps> = ({ conversation }) => {
  if (!conversation) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <p className="text-gray-500 text-sm">会話を選択してください</p>
      </div>
    );
  }

  const attributes = conversation.attributes as unknown as ConversationAttributes | undefined;

  // デフォルト値
  const displayName = attributes?.lineDisplayName || 'Unknown User';
  const profilePictureUrl = attributes?.lineProfilePictureUrl || null;
  const lineUserId = attributes?.lineUserId || 'N/A';
  const status = attributes?.status || 'open';
  const assignedOperator = attributes?.assignedOperator || null;
  const tags = attributes?.tags || [];
  const createdAt = attributes?.createdAt ? new Date(attributes.createdAt) : null;
  const lastMessageAt = attributes?.lastLineMessageAt ? new Date(attributes.lastLineMessageAt) : null;

  // 日時フォーマット
  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // ステータスバッジの色
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      {/* ヘッダー */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">ユーザー情報</h2>
      </div>

      {/* プロフィール */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex flex-col items-center">
          {/* プロフィール画像 */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-4">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                👤
              </div>
            )}
          </div>

          {/* 表示名 */}
          <h3 className="text-xl font-bold text-gray-800 mb-1">{displayName}</h3>

          {/* LINE User ID */}
          <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
            {lineUserId}
          </p>
        </div>
      </div>

      {/* ステータス情報 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">ステータス</h4>

        {/* 会話ステータス */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">会話状態</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.toUpperCase()}
          </span>
        </div>

        {/* 担当オペレーター */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">担当オペレーター</p>
          <p className="text-sm text-gray-800">
            {assignedOperator || '未割り当て'}
          </p>
        </div>

        {/* タグ */}
        {tags.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">タグ</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* タイムスタンプ */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">タイムスタンプ</h4>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500">会話開始</p>
            <p className="text-sm text-gray-800">{formatDate(createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">最終メッセージ</p>
            <p className="text-sm text-gray-800">{formatDate(lastMessageAt)}</p>
          </div>
        </div>
      </div>

      {/* アクション（Phase 1ではプレースホルダー） */}
      <div className="mt-auto px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button
          className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
          disabled
        >
          アクション（未実装）
        </button>
      </div>
    </div>
  );
};

export default UserInfoPanel;
