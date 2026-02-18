import { NextRequest, NextResponse } from 'next/server';
import { getTelegramUserByUserId } from '@/lib/db/telegram';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const link = await getTelegramUserByUserId(userId);
    return NextResponse.json({
      linked: !!link,
      telegram_username: link?.telegram_username ?? null,
    });
  } catch (error) {
    console.error('Error checking Telegram status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
