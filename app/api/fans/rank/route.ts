import { NextRequest, NextResponse } from 'next/server';
import { getFanRank } from '@/lib/db/link-views';
import { getUsersByIds } from '@/lib/db/users';

/** GET: ranking de fãs do perfil (quem clicou em links da timeline, ordenado pela 1ª visualização = Fan #1, #2, ...) */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const userId = searchParams.get('userId');
    if (!username && !userId) {
      return NextResponse.json({ error: 'username or userId is required' }, { status: 400 });
    }

    // Resolver owner user id se veio username
    let ownerUserId = userId;
    if (!ownerUserId && username) {
      const { getUserByUsername } = await import('@/lib/db/users');
      const owner = await getUserByUsername(username);
      if (!owner) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      ownerUserId = owner.id;
    }

    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const rank = await getFanRank(ownerUserId!, limit);
    if (rank.length === 0) {
      return NextResponse.json({ fans: [], ownerUserId: ownerUserId });
    }

    const userIds = rank.map(r => r.viewer_user_id);
    const users = await getUsersByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, u]));

    const fans = rank.map((r, index) => ({
      rank: index + 1,
      userId: r.viewer_user_id,
      username: userMap.get(r.viewer_user_id)?.username ?? null,
      name: userMap.get(r.viewer_user_id)?.name ?? null,
      firstViewedAt: r.first_viewed_at,
      viewCount: r.view_count,
    }));

    return NextResponse.json({ fans, ownerUserId: ownerUserId });
  } catch (error) {
    console.error('GET /api/fans/rank:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
