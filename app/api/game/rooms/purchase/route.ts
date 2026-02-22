import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { purchaseRoom } from '@/lib/db/rooms';

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const roomType = body.room_type as 'house' | 'work' | undefined;
  const roomId = body.room_id as string | undefined;
  if (!roomType || !roomId || !['house', 'work'].includes(roomType)) {
    return NextResponse.json({ error: 'room_type e room_id inválidos' }, { status: 400 });
  }

  try {
    const result = await purchaseRoom(userId, roomType, roomId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Falha na compra' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[game/rooms/purchase POST]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
