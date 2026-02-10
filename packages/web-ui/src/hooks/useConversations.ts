import { useState, useEffect, useCallback } from 'react';
import { Client, Conversation } from '@twilio/conversations';
import { getAccessToken, refreshToken } from '@/lib/twilio-client';

/**
 * useConversations Hook
 * Twilio Conversations JS SDKの初期化と会話一覧の管理
 */
export function useConversations(operatorIdentity: string) {
  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Conversation追加時のハンドラ
  const handleConversationAdded = useCallback((conversation: Conversation) => {
    console.log('Conversation added:', conversation.sid);
    setConversations((prev) => {
      // 既に存在する場合は追加しない
      if (prev.some((c) => c.sid === conversation.sid)) {
        return prev;
      }
      // 新しい会話を先頭に追加
      return [conversation, ...prev];
    });
  }, []);

  // Conversation更新時のハンドラ
  const handleConversationUpdated = useCallback((args: { conversation: Conversation }) => {
    console.log('Conversation updated:', args.conversation.sid);
    setConversations((prev) =>
      prev.map((c) => (c.sid === args.conversation.sid ? args.conversation : c))
    );
    // アクティブな会話が更新された場合も同期
    setActiveConversation((current) => {
      if (current && current.sid === args.conversation.sid) {
        return args.conversation;
      }
      return current;
    });
  }, []);

  // トークン期限切れ前のハンドラ
  const handleTokenAboutToExpire = useCallback(async (client: Client) => {
    try {
      console.log('Token about to expire, refreshing...');
      const newToken = await refreshToken(operatorIdentity);
      await client.updateToken(newToken);
      console.log('Token refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh token:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh token'));
    }
  }, [operatorIdentity]);

  // トークン期限切れ時のハンドラ
  const handleTokenExpired = useCallback(async (client: Client) => {
    try {
      console.log('Token expired, refreshing...');
      const newToken = await refreshToken(operatorIdentity);
      await client.updateToken(newToken);
      console.log('Token refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh token:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh token'));
    }
  }, [operatorIdentity]);

  // SDK初期化
  useEffect(() => {
    let mounted = true;
    let clientInstance: Client | null = null;

    async function initialize() {
      try {
        setLoading(true);
        setError(null);

        // Access Token取得
        const token = await getAccessToken(operatorIdentity);

        if (!mounted) return;

        // SDK初期化
        console.log('Initializing Twilio Client with token...');
        clientInstance = new Client(token);

        // SDK初期化完了を待つ（タイムアウト付き）
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            console.log('Waiting for SDK initialization...');

            const checkState = () => {
              const state = clientInstance!.connectionState;
              console.log('SDK connection state:', state);

              // connected 状態なら使用可能
              if (state === 'connected') {
                console.log('SDK ready! Connection state:', state);
                resolve();
              }
            };

            // 初期状態チェック
            checkState();

            // 状態変化を監視 (connectionStateChanged イベント)
            clientInstance!.on('connectionStateChanged', (state) => {
              console.log('SDK connection state changed to:', state);
              if (state === 'connected') {
                resolve();
              }
            });

            // エラーハンドリング
            clientInstance!.on('connectionError', (error) => {
              console.error('SDK connection error:', error);
              reject(error);
            });
          }),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('SDK initialization timeout')), 30000)
          ),
        ]);

        console.log('SDK initialized successfully');

        if (!mounted) return;

        // イベントリスナー登録
        clientInstance.on('conversationAdded', handleConversationAdded);
        clientInstance.on('conversationJoined', handleConversationAdded); // participantとして追加された時
        clientInstance.on('conversationUpdated', handleConversationUpdated);
        clientInstance.on('tokenAboutToExpire', () => handleTokenAboutToExpire(clientInstance!));
        clientInstance.on('tokenExpired', () => handleTokenExpired(clientInstance!));

        // 既存Conversation一覧取得
        console.log('Fetching conversations...');
        const paginator = await clientInstance.getSubscribedConversations();
        const items = paginator?.items || [];
        console.log('Fetched conversations:', items.length, 'conversations');

        if (!mounted) return;

        // 最終メッセージの日時でソート（新しい順）
        const sortedItems = items.sort((a, b) => {
          const dateA = a.lastMessage?.dateCreated || a.dateCreated;
          const dateB = b.lastMessage?.dateCreated || b.dateCreated;
          return dateB!.getTime() - dateA!.getTime();
        });

        console.log('Conversations loaded and sorted');
        setConversations(sortedItems);
        setClient(clientInstance);
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize Conversations client:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize'));
          setLoading(false);
        }
      }
    }

    initialize();

    // クリーンアップ
    return () => {
      mounted = false;
      if (clientInstance) {
        clientInstance.removeAllListeners();
      }
    };
  }, [operatorIdentity]);

  return {
    client,
    conversations,
    activeConversation,
    setActiveConversation,
    loading,
    error,
  };
}
