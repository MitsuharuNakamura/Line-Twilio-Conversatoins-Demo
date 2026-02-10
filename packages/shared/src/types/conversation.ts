/**
 * Twilio Conversation Attributes
 * LINEユーザーごとに1つのConversationを作成
 */
export interface ConversationAttributes {
  /** チャネル識別 */
  channel: 'line';

  /** LINEユーザー情報 */
  lineUserId: string;
  lineDisplayName: string;
  lineProfilePictureUrl: string | null;

  /** ステータス管理 */
  status: 'open' | 'assigned' | 'closed';
  assignedOperator: string | null; // オペレーターIdentity

  /** メタデータ */
  tags: string[];
  createdAt: string; // ISO 8601
  lastLineMessageAt: string; // ISO 8601
}

/**
 * LINE プロフィール情報
 */
export interface LineProfile {
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}
