import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getOrCreateGameProfile } from '@/lib/db/game';
import {
  totalXpForLevel,
  xpRequiredForNextLevel,
  progressInCurrentLevel,
  MAX_LEVEL,
} from '@/lib/game/level-progression';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await getOrCreateGameProfile(userId);
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
      is_sick: profile.health <= 50,
      is_burnout: profile.stress >= 100,
    });
  } catch (e) {
    console.error('[game/status GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
