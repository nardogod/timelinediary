import { NextRequest, NextResponse } from 'next/server';
import { validateAndUseToken, linkTelegramUser } from '@/lib/db/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, telegram_id, telegram_username } = body;

    if (!token || !telegram_id) {
      return NextResponse.json(
        { error: 'Token and telegram_id are required' },
        { status: 400 }
      );
    }

    const tokenData = await validateAndUseToken(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const telegramLink = await linkTelegramUser({
      user_id: tokenData.user_id,
      telegram_id,
      telegram_username: telegram_username ?? null,
    });

    return NextResponse.json({ success: true, telegram_link: telegramLink });
  } catch (error) {
    console.error('Error linking Telegram account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
