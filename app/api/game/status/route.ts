import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getGameProfile, getOrCreateGameProfile, updateGameProfile } from '@/lib/db/game';
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
    let profile =
      targetUserId === sessionUserId
        ? await getOrCreateGameProfile(sessionUserId)
        : await getGameProfile(targetUserId);
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // Passivo: stress diminui 1 ponto a cada 2 minutos sem precisar de ação manual (até chegar a 0).
    // Usamos updated_at como referência de último ajuste gravado.
    if (targetUserId === sessionUserId && profile.stress > 0 && profile.updated_at) {
      const last = new Date(profile.updated_at).getTime();
      const now = Date.now();
      if (!Number.isNaN(last) && now > last) {
        const STEP_MS = 2 * 60 * 1000; // 2 minutos
        const steps = Math.floor((now - last) / STEP_MS);
        if (steps > 0) {
          const newStress = Math.max(0, profile.stress - steps);
          if (newStress !== profile.stress) {
            const updated = await updateGameProfile(sessionUserId, { stress: newStress });
            if (updated) profile = updated;
          }
        }
      }
    }

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
