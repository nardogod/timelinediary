import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import {
  getOwnedRooms,
  HOUSES,
  WORK_ROOMS,
} from '@/lib/db/rooms';
import { getGameProfile } from '@/lib/db/game';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [owned, profile] = await Promise.all([
      getOwnedRooms(userId),
      getGameProfile(userId),
    ]);
    return NextResponse.json({
      catalog: { house: HOUSES, work: WORK_ROOMS },
      owned,
      current_house_id: profile?.current_house_id ?? 'casa_1',
      current_work_room_id: profile?.current_work_room_id ?? 'sala_1',
    });
  } catch (e) {
    console.error('[game/rooms GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { setCurrentHouse, setCurrentWorkRoom } = await import('@/lib/db/rooms');

  if (body.current_house_id != null) {
    const result = await setCurrentHouse(userId, String(body.current_house_id));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (body.current_work_room_id != null) {
    const result = await setCurrentWorkRoom(userId, String(body.current_work_room_id));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const profile = await getGameProfile(userId);
  return NextResponse.json({
    current_house_id: profile?.current_house_id ?? 'casa_1',
    current_work_room_id: profile?.current_work_room_id ?? 'sala_1',
  });
}
