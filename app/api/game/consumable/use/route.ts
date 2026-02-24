import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { useConsumable } from '@/lib/db/game';

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const consumableId = typeof body.consumable_id === 'string' ? body.consumable_id.trim() : null;
    if (!consumableId) {
      return NextResponse.json({ ok: false, error: 'consumable_id obrigatório' }, { status: 400 });
    }
    const result = await useConsumable(userId, consumableId);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, profile: result.profile });
  } catch (e) {
    console.error('[game/consumable/use POST]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
