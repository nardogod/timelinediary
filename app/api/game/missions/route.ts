import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import {
  getMissionsInOrder,
  getCompletedMissionIds,
  evaluateAndGrantMissions,
} from '@/lib/db/missions';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await evaluateAndGrantMissions(userId);
    const [missions, completedIds] = await Promise.all([
      getMissionsInOrder(),
      getCompletedMissionIds(userId),
    ]);
    const completedSet = new Set(completedIds);
    const list = missions.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      requirement: m.requirement,
      reward: m.reward,
      completed: completedSet.has(m.id),
    }));
    return NextResponse.json({ missions: list });
  } catch (e) {
    console.error('[game/missions GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
