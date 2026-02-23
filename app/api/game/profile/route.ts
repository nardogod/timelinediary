import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getGameProfile, getOrCreateGameProfile, updateGameProfile } from '@/lib/db/game';
import { getOwnedItems } from '@/lib/db/shop';

export async function GET(request: NextRequest) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const targetUserId = url.searchParams.get('userId') ?? sessionUserId;

  try {
    const profile =
      targetUserId === sessionUserId
        ? await getOrCreateGameProfile(sessionUserId)
        : await getGameProfile(targetUserId);
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
  if (body.antistress_item_id !== undefined) {
    const value = body.antistress_item_id == null ? null : String(body.antistress_item_id);
    if (value !== null) {
      const owned = await getOwnedItems(userId);
      if (!owned.guardian_item.includes(value)) {
        return NextResponse.json({ error: 'Você não possui este item' }, { status: 400 });
      }
    }
    updates.antistress_item_id = value;
  }

  const profile = await updateGameProfile(userId, updates);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  const responseProfile = {
    ...profile,
    ...(updates.pet_id !== undefined && { pet_id: updates.pet_id }),
    ...(updates.antistress_item_id !== undefined && { antistress_item_id: updates.antistress_item_id }),
  };
  return NextResponse.json(responseProfile);
}
