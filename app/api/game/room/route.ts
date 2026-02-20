import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import {
  getOrCreateGameProfile,
  getRoomLayoutTrabalho,
  setRoomLayoutTrabalho,
} from '@/lib/db/game';
import type { RoomLayoutTrabalho } from '@/lib/db/game-types';

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const room = request.nextUrl.searchParams.get('room') || 'trabalho';
  if (room !== 'trabalho') {
    return NextResponse.json({ layout: null });
  }

  try {
    await getOrCreateGameProfile(userId);
    const layout = await getRoomLayoutTrabalho(userId);
    return NextResponse.json({ layout });
  } catch (e) {
    console.error('[game/room GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const room = request.nextUrl.searchParams.get('room') || 'trabalho';
  if (room !== 'trabalho') {
    return NextResponse.json({ error: 'Unknown room' }, { status: 400 });
  }

  let body: { layout?: RoomLayoutTrabalho } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const layout = body.layout;
  if (!layout || typeof layout !== 'object' || Array.isArray(layout)) {
    return NextResponse.json({ error: 'layout object required' }, { status: 400 });
  }

  const sanitized: RoomLayoutTrabalho = {};
  for (const key of Object.keys(layout)) {
    const v = (layout as Record<string, unknown>)[key];
    if (v && typeof v === 'object' && !Array.isArray(v) && 'left' in v && 'bottom' in v) {
      const left = Number((v as { left: unknown }).left);
      const bottom = Number((v as { bottom: unknown }).bottom);
      if (Number.isFinite(left) && Number.isFinite(bottom)) {
        sanitized[key] = { left, bottom };
      }
    }
  }

  try {
    await getOrCreateGameProfile(userId);
    const ok = await setRoomLayoutTrabalho(userId, sanitized);
    if (!ok) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    return NextResponse.json({ layout: sanitized });
  } catch (e) {
    console.error('[game/room PATCH]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
