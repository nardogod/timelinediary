import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { purchaseItem } from '@/lib/db/shop';
import type { ShopItemType } from '@/lib/game/shop-catalog';

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const itemType = body.item_type as ShopItemType | undefined;
  const itemId = body.item_id as string | undefined;
  if (!itemType || !itemId || !['cover', 'avatar', 'pet'].includes(itemType)) {
    return NextResponse.json({ error: 'item_type e item_id inválidos' }, { status: 400 });
  }

  try {
    const result = await purchaseItem(userId, itemType, itemId);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? 'Falha na compra' },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[game/shop/purchase POST]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
