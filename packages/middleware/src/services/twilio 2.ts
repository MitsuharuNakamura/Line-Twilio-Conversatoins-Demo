/**
 * Twilio Conversations REST API クライアント
 * Cloudflare Workers では Twilio SDK が使えないため REST API を直接叩く
 */

export interface TwilioConversation {
  sid: string;
  account_sid: string;
  chat_service_sid: string;
  messaging_service_sid: string | null;
  friendly_name: string;
  unique_name: string;
  attributes: string;
  state: string;
  date_created: string;
  date_updated: string;
  timers: Record<string, unknown>;
  url: string;
  links: Record<string, string>;
}

export interface TwilioMessage {
  sid: string;
  account_sid: string;
  conversation_sid: string;
  body: string | null;
  media: unknown[] | null;
  author: string;
  participant_sid: string | null;
  attributes: string;
  date_created: string;
  date_updated: string;
  index: number;
  delivery: Record<string, unknown> | null;
  url: string;
  links: Record<string, string>;
}

export interface CreateConversationParams {
  UniqueName?: string;
  FriendlyName?: string;
  Attributes?: string;
}

export interface CreateMessageParams {
  Author?: string;
  Body?: string;
  Attributes?: string;
}

export class TwilioClient {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly serviceSid: string;
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(accountSid: string, authToken: string, serviceSid: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.serviceSid = serviceSid;
    this.baseUrl = `https://conversations.twilio.com/v1/Services/${serviceSid}`;
    this.authHeader = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  }

  /**
   * uniqueName で Conversation を取得
   */
  async getConversation(uniqueName: string): Promise<TwilioConversation> {
    const response = await fetch(`${this.baseUrl}/Conversations/${uniqueName}`, {
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Conversation not found');
      }
      const error = await response.text();
      console.error('Twilio Get Conversation error:', error);
      throw new Error(`Twilio API failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Conversation を作成
   */
  async createConversation(
    params: CreateConversationParams
  ): Promise<TwilioConversation> {
    const body = new URLSearchParams();
    if (params.UniqueName) body.append('UniqueName', params.UniqueName);
    if (params.FriendlyName) body.append('FriendlyName', params.FriendlyName);
    if (params.Attributes) body.append('Attributes', params.Attributes);

    const response = await fetch(`${this.baseUrl}/Conversations`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio Create Conversation error:', error);
      throw new Error(`Twilio API failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Conversation を更新
   */
  async updateConversation(
    conversationSid: string,
    params: { Attributes?: string; FriendlyName?: string }
  ): Promise<TwilioConversation> {
    const body = new URLSearchParams();
    if (params.Attributes) body.append('Attributes', params.Attributes);
    if (params.FriendlyName) body.append('FriendlyName', params.FriendlyName);

    const response = await fetch(
      `${this.baseUrl}/Conversations/${conversationSid}`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio Update Conversation error:', error);
      throw new Error(`Twilio API failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Conversation にメッセージを追加
   */
  async createMessage(
    conversationSid: string,
    params: CreateMessageParams
  ): Promise<TwilioMessage> {
    const body = new URLSearchParams();
    if (params.Author) body.append('Author', params.Author);
    if (params.Body) body.append('Body', params.Body);
    if (params.Attributes) body.append('Attributes', params.Attributes);

    const response = await fetch(
      `${this.baseUrl}/Conversations/${conversationSid}/Messages`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio Create Message error:', error);
      throw new Error(`Twilio API failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Conversation SID で Conversation を取得
   */
  async getConversationBySid(
    conversationSid: string
  ): Promise<TwilioConversation> {
    const response = await fetch(
      `${this.baseUrl}/Conversations/${conversationSid}`,
      {
        headers: {
          Authorization: this.authHeader,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio Get Conversation by SID error:', error);
      throw new Error(`Twilio API failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Conversation に Participant を追加
   */
  async addParticipant(
    conversationSid: string,
    identity: string
  ): Promise<void> {
    const body = new URLSearchParams();
    body.append('Identity', identity);

    const response = await fetch(
      `${this.baseUrl}/Conversations/${conversationSid}/Participants`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio Add Participant error:', error);
      throw new Error(`Twilio API failed: ${response.status}`);
    }
  }
}
