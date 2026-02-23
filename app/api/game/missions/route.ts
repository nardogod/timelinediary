import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getMissionsInOrder, getCompletedMissionIds } from '@/lib/db/missions';

/** Não concede missões aqui: concede apenas ao completar uma tarefa (evita desbloquear muitos avatares de uma vez). */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
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
      ...(m.difficulty && { difficulty: m.difficulty }),
      ...(m.arcId && { arcId: m.arcId, arcName: m.arcName, arcStory: m.arcStory }),
    }));
    return NextResponse.json({ missions: list });
  } catch (e) {
    console.error('[game/missions GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
