import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { searchEventsByUserId } from '@/lib/db/events';
import { searchUsers } from '@/lib/db/users';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') ?? '';
    const userId = await getSessionUserId();

    const [events, users] = await Promise.all([
      userId ? searchEventsByUserId(userId, q) : Promise.resolve([]),
      searchUsers(q),
    ]);

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        user_id: e.user_id,
        title: e.title,
        date: e.date,
        end_date: e.end_date,
        type: e.type,
        link: e.link,
        folder_id: e.folder_id,
      })),
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        avatar: u.avatar,
      })),
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
