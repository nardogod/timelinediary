import { NextResponse } from 'next/server';
import { getActivityTypes } from '@/lib/db/game';

export async function GET() {
  try {
    const types = await getActivityTypes();
    return NextResponse.json(types);
  } catch (e) {
    console.error('[game/activity-types GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
