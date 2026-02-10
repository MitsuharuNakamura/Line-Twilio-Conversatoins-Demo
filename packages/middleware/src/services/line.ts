/**
 * LINE Messaging API クライアント
 */

import type { LineProfile } from '@line-twilio-chat/shared';
import type { LinePushMessage } from '@line-twilio-chat/shared';

export class LineClient {
  private readonly accessToken: string;
  private readonly apiBaseUrl = 'https://api.line.me/v2/bot';
  private readonly dataApiBaseUrl = 'https://api-data.line.me/v2/bot';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * プッシュメッセージを送信
   */
  async pushMessage(to: string, messages: LinePushMessage[]): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ to, messages }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('LINE Push API error:', error);
      throw new Error(`LINE Push API failed: ${response.status}`);
    }
  }

  /**
   * ユーザープロフィール情報を取得
   */
  async getProfile(userId: string): Promise<LineProfile> {
    const response = await fetch(`${this.apiBaseUrl}/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('LINE Profile API error:', error);
      throw new Error(`LINE Profile API failed: ${response.status}`);
    }

    return response.json() as Promise<LineProfile>;
  }

  /**
   * メッセージコンテンツ（画像、動画、音声、ファイル）を取得
   */
  async getContent(messageId: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `${this.dataApiBaseUrl}/message/${messageId}/content`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('LINE Content API error:', error);
      throw new Error(`LINE Content API failed: ${response.status}`);
    }

    return response.arrayBuffer();
  }

  /**
   * リプライメッセージを送信
   */
  async replyMessage(
    replyToken: string,
    messages: LinePushMessage[]
  ): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/message/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('LINE Reply API error:', error);
      throw new Error(`LINE Reply API failed: ${response.status}`);
    }
  }
}
