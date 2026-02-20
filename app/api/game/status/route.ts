import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getOrCreateGameProfile } from '@/lib/db/game';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await getOrCreateGameProfile(userId);
    return NextResponse.json({
      health: profile.health,
      stress: profile.stress,
      coins: profile.coins,
      level: profile.level,
      experience: profile.experience,
    });
  } catch (e) {
    console.error('[game/status GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
