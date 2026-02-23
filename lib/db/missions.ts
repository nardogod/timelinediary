import { getNeon } from '@/lib/neon';
import { getOrCreateGameProfile, getGameProfile, updateGameProfile } from '@/lib/db/game';
import { MISSIONS, type MissionDef, type MissionReward } from '@/lib/game/missions';

export async function getCompletedMissionIds(userId: string): Promise<string[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT mission_id FROM game_user_missions WHERE user_id = ${userId}
  `;
  return (rows as { mission_id: string }[]).map((r) => r.mission_id);
}

export async function recordMissionCompleted(
  userId: string,
  missionId: string
): Promise<void> {
  const sql = getNeon();
  await sql`
    INSERT INTO game_user_missions (user_id, mission_id)
    VALUES (${userId}, ${missionId})
    ON CONFLICT (user_id, mission_id) DO NOTHING
  `;
}

async function grantReward(userId: string, reward: MissionReward): Promise<void> {
  await getOrCreateGameProfile(userId);
  const sql = getNeon();
  if (reward.type === 'coins' && reward.amount > 0) {
    await sql`
      UPDATE game_profiles SET coins = coins + ${reward.amount}, updated_at = NOW() WHERE user_id = ${userId}
    `;
  }
  if (reward.badgeId) {
    const profile = await getGameProfile(userId);
    if (profile) {
      const earned = new Set(profile.earned_badge_ids ?? []);
      earned.add(reward.badgeId);
      await updateGameProfile(userId, { earned_badge_ids: [...earned] });
    }
  }
}

/**
 * Concede a recompensa da missão e marca como concluída. Idempotente (não duplica recompensa).
 */
export async function completeMissionAndGrantReward(
  userId: string,
  missionId: string
): Promise<boolean> {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return false;
  const completed = await getCompletedMissionIds(userId);
  if (completed.includes(missionId)) return true;
  await grantReward(userId, mission.reward);
  await recordMissionCompleted(userId, missionId);
  return true;
}

export function getMissionsInOrder(): MissionDef[] {
  return [...MISSIONS].sort((a, b) => a.order - b.order);
}

/**
 * Avalia missões, concede recompensa e marca como concluídas para as que o usuário cumpriu e ainda não tinha recebido.
 */
export async function evaluateAndGrantMissions(userId: string): Promise<void> {
  await getOrCreateGameProfile(userId);
  const { evaluateMissions } = await import('@/lib/game/mission-evaluation');
  const completedIds = await getCompletedMissionIds(userId);
  const checks = await evaluateMissions(userId);
  for (const { missionId, completed } of checks) {
    if (completed && !completedIds.includes(missionId)) {
      await completeMissionAndGrantReward(userId, missionId);
    }
  }
}
