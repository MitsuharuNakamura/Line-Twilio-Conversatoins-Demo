import { useState, useEffect, useCallback } from 'react';
import { Conversation, Message, Paginator } from '@twilio/conversations';

/**
 * useMessages Hook
 * 選択中のConversationのメッセージ管理
 */
export function useMessages(conversation: Conversation | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [paginator, setPaginator] = useState<Paginator<Message> | null>(null);

  // メッセージ追加時のハンドラ
  const handleMessageAdded = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // メッセージ更新時のハンドラ
  const handleMessageUpdated = useCallback((args: { message: Message }) => {
    setMessages((prev) =>
      prev.map((m) => (m.sid === args.message.sid ? args.message : m))
    );
  }, []);

  // メッセージ削除時のハンドラ
  const handleMessageRemoved = useCallback((message: Message) => {
    setMessages((prev) => prev.filter((m) => m.sid !== message.sid));
  }, []);

  // メッセージ取得
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      setLoading(false);
      setError(null);
      setPaginator(null);
      return;
    }

    let mounted = true;

    async function fetchMessages() {
      try {
        setLoading(true);
        setError(null);

        // 過去メッセージ取得（最新30件）
        const paginatorResult = await conversation!.getMessages(30);

        if (!mounted) return;

        setMessages(paginatorResult.items);
        setPaginator(paginatorResult);
        setHasMore(paginatorResult.hasPrevPage);
        setLoading(false);

        // 未読マークをクリア
        if (conversation!.lastReadMessageIndex !== null) {
          const unreadCount = await conversation!.getUnreadMessagesCount();
          if (unreadCount && unreadCount > 0) {
            await conversation!.updateLastReadMessageIndex(
              paginatorResult.items[paginatorResult.items.length - 1]?.index ?? -1
            );
          }
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
          setLoading(false);
        }
      }
    }

    fetchMessages();

    // リアルタイムメッセージ受信のイベントリスナー
    conversation.on('messageAdded', handleMessageAdded);
    conversation.on('messageUpdated', handleMessageUpdated);
    conversation.on('messageRemoved', handleMessageRemoved);

    return () => {
      mounted = false;
      conversation.off('messageAdded', handleMessageAdded);
      conversation.off('messageUpdated', handleMessageUpdated);
      conversation.off('messageRemoved', handleMessageRemoved);
    };
  }, [conversation, handleMessageAdded, handleMessageUpdated, handleMessageRemoved]);

  // メッセージ送信
  const sendMessage = useCallback(
    async (body: string, attributes?: Record<string, unknown>) => {
      if (!conversation) {
        throw new Error('No active conversation');
      }

      try {
        await conversation.sendMessage(body, attributes as any);
      } catch (err) {
        console.error('Failed to send message:', err);
        throw err instanceof Error ? err : new Error('Failed to send message');
      }
    },
    [conversation]
  );

  // さらに過去のメッセージを読み込む
  const loadMoreMessages = useCallback(async () => {
    if (!paginator || !hasMore || loading) {
      return;
    }

    try {
      setLoading(true);
      const prevPaginator = await paginator.prevPage();

      setMessages((prev) => [...prevPaginator.items, ...prev]);
      setPaginator(prevPaginator);
      setHasMore(prevPaginator.hasPrevPage);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load more messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to load more messages'));
      setLoading(false);
    }
  }, [paginator, hasMore, loading]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    loadMoreMessages,
    hasMore,
  };
}
