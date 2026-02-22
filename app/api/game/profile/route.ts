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
  const updates: Parameters<typeof updateGameProfile>[1] = {};
  if (body.profession !== undefined) updates.profession = body.profession;
  if (body.work_hours_start !== undefined) updates.work_hours_start = body.work_hours_start;
  if (body.work_hours_end !== undefined) updates.work_hours_end = body.work_hours_end;
  if (body.avatar_image_url !== undefined) updates.avatar_image_url = body.avatar_image_url;
  if (body.cover_id !== undefined) updates.cover_id = body.cover_id;
  if (body.cover_position_y !== undefined) updates.cover_position_y = body.cover_position_y;
  if (body.pet_id !== undefined) updates.pet_id = body.pet_id == null ? null : String(body.pet_id);

  const profile = await updateGameProfile(userId, updates);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  // Garantir que a resposta reflete o pet_id que o cliente enviou (evita volta para valor antigo)
  const responseProfile =
    updates.pet_id !== undefined ? { ...profile, pet_id: updates.pet_id } : profile;
  return NextResponse.json(responseProfile);
}
