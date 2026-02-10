import { NextRequest, NextResponse } from 'next/server';
import type { TokenRequest, TokenResponse } from '@line-twilio-chat/shared';
import { jwt } from 'twilio';

const AccessToken = jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;

/**
 * Access Token生成API
 * Twilio Conversations用のAccess Tokenを生成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TokenRequest;
    const { identity } = body;

    if (!identity) {
      return NextResponse.json(
        { error: 'identity is required' },
        { status: 400 }
      );
    }

    // 環境変数チェック
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    const serviceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;

    if (!accountSid || !apiKeySid || !apiKeySecret || !serviceSid) {
      console.error('Missing Twilio credentials');
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      );
    }

    // Twilio Access Token生成
    const token = new AccessToken(
      accountSid,
      apiKeySid,
      apiKeySecret,
      { identity, ttl: 3600 }
    );

    // Conversations Grant追加
    const chatGrant = new ChatGrant({
      serviceSid: serviceSid,
    });
    token.addGrant(chatGrant);

    const jwtToken = token.toJwt();
    console.log('Generated Twilio Access Token for identity:', identity);

    const response: TokenResponse = { token: jwtToken };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
