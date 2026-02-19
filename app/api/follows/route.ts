import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getFollowedIds, addFollow, removeFollow } from '@/lib/db/follows';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ followedIds: [] });
    }
    const followedIds = await getFollowedIds(userId);
    return NextResponse.json({ followedIds });
  } catch (error) {
    console.error('Error fetching follows:', error);
    return NextResponse.json({ error: 'Internal server error', followedIds: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const targetUserId = body?.targetUserId ?? body?.target_user_id;
    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
    }
    await addFollow(userId, targetUserId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error adding follow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const targetUserId = request.nextUrl.searchParams.get('targetUserId');
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
    }
    await removeFollow(userId, targetUserId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error removing follow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
