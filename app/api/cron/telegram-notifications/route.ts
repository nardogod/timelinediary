import { NextRequest, NextResponse } from 'next/server';
import { getAllLinkedTelegramUsers } from '@/lib/db/telegram';
import { runAllTaskNotifications } from '@/lib/notifications/task-notifications';

function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7) === secret;
  }
  const cronSecret = request.headers.get('x-cron-secret');
  return cronSecret === secret;
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const linked = await getAllLinkedTelegramUsers();
    const userIds = linked.map(u => u.user_id);
    const { sent, skipped, results } = await runAllTaskNotifications(userIds);
    return NextResponse.json({
      ok: true,
      sent,
      skipped,
      total: userIds.length,
      results: results.map(r => ({
        userId: r.userId,
        pending: r.pending,
        dueTomorrow: r.dueTomorrow,
        weeklyCongrats: r.weeklyCongrats,
      })),
    });
  } catch (error) {
    console.error('[cron/telegram-notifications]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
