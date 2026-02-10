/**
 * Conversation 管理サービス
 * LINE ユーザーごとの Conversation を取得または作成する
 */

import type { ConversationAttributes, LineProfile } from '@line-twilio-chat/shared';
import type { TwilioClient, TwilioConversation } from './twilio';

/**
 * LINE ユーザーの Conversation を取得または作成
 * uniqueName = `line_{lineUserId}` で管理
 */
export async function getOrCreateConversation(
  twilioClient: TwilioClient,
  lineUserId: string,
  lineProfile: LineProfile
): Promise<TwilioConversation> {
  const uniqueName = `line_${lineUserId}`;
  const defaultOperator = 'operator-001'; // TODO: 環境変数から取得

  try {
    // 既存の Conversation を取得
    const conversation = await twilioClient.getConversation(uniqueName);

    // 既存の場合、lastLineMessageAt を更新
    const attrs: ConversationAttributes = JSON.parse(conversation.attributes);
    attrs.lastLineMessageAt = new Date().toISOString();

    // status が closed の場合は open に戻す
    if (attrs.status === 'closed') {
      attrs.status = 'open';
    }

    // プロフィール情報を更新（表示名や画像が変わっている可能性がある）
    attrs.lineDisplayName = lineProfile.displayName;
    attrs.lineProfilePictureUrl = lineProfile.pictureUrl ?? null;

    // オペレーターがParticipantとして追加されているか確認し、なければ追加
    try {
      await twilioClient.addParticipant(conversation.sid, defaultOperator);
      console.log(`Added operator ${defaultOperator} as participant to existing conversation`);
    } catch (err) {
      // 既に追加されている場合は409エラーが返るが、それは問題ない
      if (err instanceof Error && !err.message.includes('already exists')) {
        console.warn('Failed to add operator as participant:', err);
      }
    }

    return await twilioClient.updateConversation(conversation.sid, {
      Attributes: JSON.stringify(attrs),
      FriendlyName: lineProfile.displayName,
    });
  } catch (error) {
    // 404 の場合は新規作成
    if (error instanceof Error && error.message.includes('not found')) {
      const attrs: ConversationAttributes = {
        channel: 'line',
        lineUserId,
        lineDisplayName: lineProfile.displayName,
        lineProfilePictureUrl: lineProfile.pictureUrl ?? null,
        status: 'open',
        assignedOperator: null,
        tags: [],
        createdAt: new Date().toISOString(),
        lastLineMessageAt: new Date().toISOString(),
      };

      const conversation = await twilioClient.createConversation({
        UniqueName: uniqueName,
        FriendlyName: lineProfile.displayName,
        Attributes: JSON.stringify(attrs),
      });

      // オペレーターをParticipantとして追加（Phase 1: 全オペレーターが閲覧可能）
      try {
        await twilioClient.addParticipant(conversation.sid, defaultOperator);
        console.log(`Added operator ${defaultOperator} as participant to new conversation`);
      } catch (err) {
        console.warn('Failed to add operator as participant:', err);
        // Participant追加に失敗してもConversationは作成されているので続行
      }

      return conversation;
    }

    // その他のエラーは再スロー
    throw error;
  }
}

/**
 * LINE ユーザー ID かどうかを判定
 * LINE の userId は "U" で始まる33文字の文字列
 */
export function isLineUserId(author: string): boolean {
  return author.startsWith('U') && author.length === 33;
}
