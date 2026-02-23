/**
 * Avaliação de missões: verifica se o usuário cumpriu os requisitos (incluindo 102 missões de avatar).
 */
import { getGameProfile, getConsecutiveDaysStreak } from '@/lib/db/game';
import {
  getDistinctCompletedTaskDates,
  getCompletedTasksCountTotal,
  getCompletedTasksCountByFolderType,
  getDistinctFoldersWithCompletedTasksCount,
  getMaxCompletedTasksInOneDay,
} from '@/lib/db/tasks';
import { getEventsByUserId } from '@/lib/db/events';
import { getCompletedMissionIds } from '@/lib/db/missions';
import { MISSIONS } from './missions';
import {
  getAvatarMissionsData,
  getAvatarMissionId,
  getPreviousAvatarInStoryline,
  getAvatarArcMissionIds,
} from './avatar-missions-data';
import type { AvatarMissionRequirement } from './avatar-missions-data';

export type MissionCheckResult = { missionId: string; completed: boolean };

async function checkAvatarRequirement(
  userId: string,
  r: AvatarMissionRequirement,
  profile: { level: number; coins: number } | null,
  totalTasks: number,
  distinctDates: string[]
): Promise<boolean> {
  if (!profile) return false;
  const distinctDays = distinctDates.length;
  switch (r.kind) {
    case 'total_tasks':
      return totalTasks >= (r.totalTasks ?? 0);
    case 'distinct_days':
      return distinctDays >= (r.distinctDays ?? 0);
    case 'total_and_days':
      return totalTasks >= (r.totalTasks ?? 0) && distinctDays >= (r.distinctDays ?? 0);
    case 'total_and_level':
      return totalTasks >= (r.totalTasks ?? 0) && profile.level >= (r.level ?? 0);
    case 'total_tasks_and_level':
      return totalTasks >= (r.totalTasks ?? 0) && profile.level >= (r.level ?? 0);
    case 'streak_days': {
      const streak = await getConsecutiveDaysStreak(userId);
      const need = r.streakDays ?? 0;
      return need > 0 && streak >= need;
    }
    case 'events_with_link': {
      const events = await getEventsByUserId(userId);
      const withLink = events.filter((e) => e.link != null && String(e.link).trim() !== '').length;
      return withLink >= (r.eventsWithLink ?? 0);
    }
    case 'distinct_folders': {
      const folders = await getDistinctFoldersWithCompletedTasksCount(userId);
      return folders >= (r.distinctFolders ?? 0);
    }
    case 'total_and_folders': {
      const folders = await getDistinctFoldersWithCompletedTasksCount(userId);
      return totalTasks >= (r.totalTasks ?? 0) && folders >= (r.distinctFolders ?? 0);
    }
    case 'tasks_by_folder_type': {
      const ft = r.folderType ?? 'estudos';
      const n = await getCompletedTasksCountByFolderType(userId, ft);
      return n >= (r.tasksByFolderType ?? 0);
    }
    case 'max_tasks_one_day': {
      const max = await getMaxCompletedTasksInOneDay(userId);
      return max >= (r.maxTasksOneDay ?? 0);
    }
    case 'total_and_streak': {
      const streak = await getConsecutiveDaysStreak(userId);
      return totalTasks >= (r.totalTasks ?? 0) && streak >= (r.streakDays ?? 0);
    }
    case 'coins':
      return profile.coins >= (r.coins ?? 0);
    case 'level':
      return profile.level >= (r.level ?? 0);
    case 'distinct_days_and_level':
      return distinctDays >= (r.distinctDays ?? 0) && profile.level >= (r.level ?? 0);
    case 'total_and_distinct_folders': {
      const folders = await getDistinctFoldersWithCompletedTasksCount(userId);
      return totalTasks >= (r.totalTasks ?? 0) && folders >= (r.distinctFolders ?? 0) && profile.level >= (r.level ?? 0);
    }
    default:
      return false;
  }
}

/**
 * Retorna quais missões o usuário já cumpriu (sem considerar se já foram entregues).
 * Missões de avatar fase 1 exigem ter completado as 3 missões do personagem anterior na storyline.
 */
export async function evaluateMissions(userId: string): Promise<MissionCheckResult[]> {
  const [profile, distinctDates, totalTasksCompleted, completedMissionIds] = await Promise.all([
    getGameProfile(userId),
    getDistinctCompletedTaskDates(userId),
    getCompletedTasksCountTotal(userId),
    getCompletedMissionIds(userId),
  ]);
  const completedSet = new Set(completedMissionIds);
  const avatarData = getAvatarMissionsData();
  const avatarByMissionId = new Map(avatarData.map((row) => [getAvatarMissionId(row.avatarIndex, row.phase), row]));

  const results: MissionCheckResult[] = [];
  for (const m of MISSIONS) {
    let completed = false;
    if (m.id.startsWith('avatar_')) {
      const row = avatarByMissionId.get(m.id);
      if (row) {
        const match = /^avatar_(\d+)_([123])$/.exec(m.id);
        const avatarIndex = match ? parseInt(match[1], 10) : 0;
        const phase = match ? parseInt(match[2], 10) : 0;
        const prevAvatar = getPreviousAvatarInStoryline(avatarIndex);
        const previousArcComplete =
          prevAvatar === null ||
          getAvatarArcMissionIds(prevAvatar).every((id) => completedSet.has(id));
        if (!previousArcComplete) {
          completed = false;
        } else {
          completed = await checkAvatarRequirement(
            userId,
            row.requirementCheck,
            profile ?? null,
            totalTasksCompleted,
            distinctDates
          );
        }
      }
    } else {
      switch (m.id) {
        case 'agenda_3_dias':
          completed = distinctDates.length >= 3;
          break;
        case 'primeiras_5_tarefas':
          completed = totalTasksCompleted >= 5;
          break;
        case 'nivel_2':
          completed = profile != null && profile.level >= 2;
          break;
        case 'cem_moedas':
          completed = profile != null && profile.coins >= 500;
          break;
        case 'dez_tarefas':
          completed = totalTasksCompleted >= 10;
          break;
        case 'nivel_3':
          completed = profile != null && profile.level >= 3;
          break;
        case 'vinte_tarefas':
          completed = totalTasksCompleted >= 20;
          break;
        default:
          break;
      }
    }
    results.push({ missionId: m.id, completed });
  }
  return results;
}
