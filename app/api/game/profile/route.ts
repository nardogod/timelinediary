import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getOrCreateGameProfile, updateGameProfile } from '@/lib/db/game';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await getOrCreateGameProfile(userId);
    return NextResponse.json(profile);
  } catch (e) {
    console.error('[game/profile GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const profile = await updateGameProfile(userId, {
    profession: body.profession,
    work_hours_start: body.work_hours_start,
    work_hours_end: body.work_hours_end,
    avatar_image_url: body.avatar_image_url,
    cover_id: body.cover_id,
    cover_position_y: body.cover_position_y,
    pet_id: body.pet_id,
  });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  return NextResponse.json(profile);
}
