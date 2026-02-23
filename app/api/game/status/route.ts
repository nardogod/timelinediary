import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getGameProfile, getOrCreateGameProfile } from '@/lib/db/game';
import {
  totalXpForLevel,
  xpRequiredForNextLevel,
  progressInCurrentLevel,
  MAX_LEVEL,
} from '@/lib/game/level-progression';

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
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    const level = Math.min(profile.level, MAX_LEVEL);
    const xpForNext = xpRequiredForNextLevel(level);
    const xpInCurrentLevel =
      level >= MAX_LEVEL ? 0 : Math.max(0, profile.experience - totalXpForLevel(level));
    const xpProgress = progressInCurrentLevel(profile.experience);

    return NextResponse.json({
      health: profile.health,
      stress: profile.stress,
      coins: profile.coins,
      level: profile.level,
      experience: profile.experience,
      xp_for_next_level: xpForNext,
      xp_in_current_level: xpInCurrentLevel,
      xp_progress: xpProgress,
      is_sick: profile.health <= 50 || profile.stress > 75,
      is_burnout: profile.stress >= 100,
    });
  } catch (e) {
    console.error('[game/status GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
