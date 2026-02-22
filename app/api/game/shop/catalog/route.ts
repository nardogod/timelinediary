import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getCatalog, getOwnedItems } from '@/lib/db/shop';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [catalog, owned] = await Promise.all([getCatalog(), getOwnedItems(userId)]);
    return NextResponse.json({ catalog, owned });
  } catch (e) {
    console.error('[game/shop/catalog GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
