'use client';

import React, { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
}

/**
 * MessageInput
 * メッセージ入力エリア
 */
const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || sending || disabled) {
      return;
    }

    try {
      setSending(true);
      await onSendMessage(trimmedText);
      setText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enterキーで送信（Shiftキー押下時は改行）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-300 bg-white p-4">
      <div className="flex gap-2">
        {/* テキスト入力エリア */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          disabled={disabled || sending}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-line-green disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={3}
        />

        {/* 送信ボタン */}
        <button
          onClick={handleSend}
          disabled={disabled || sending || !text.trim()}
          className="px-6 py-2 bg-line-green text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed self-end"
        >
          {sending ? '送信中...' : '送信'}
        </button>
      </div>

      {/* ヒントテキスト */}
      <p className="text-xs text-gray-500 mt-2">
        Enterで送信、Shift+Enterで改行
      </p>
    </div>
  );
};

export default MessageInput;
