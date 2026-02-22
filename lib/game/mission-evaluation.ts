/**
 * Avaliação de missões: verifica se o usuário cumpriu os requisitos.
 */
import { getGameProfile } from '@/lib/db/game';
import {
  getDistinctCompletedTaskDates,
  getCompletedTasksCountTotal,
} from '@/lib/db/tasks';
import { MISSIONS } from './missions';

export type MissionCheckResult = { missionId: string; completed: boolean };

/**
 * Retorna quais missões o usuário já cumpriu (sem considerar se já foram entregues).
 */
export async function evaluateMissions(userId: string): Promise<MissionCheckResult[]> {
  const profile = await getGameProfile(userId);
  const distinctDates = await getDistinctCompletedTaskDates(userId);
  const totalTasksCompleted = await getCompletedTasksCountTotal(userId);

  const results: MissionCheckResult[] = [];
  for (const m of MISSIONS) {
    let completed = false;
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
    results.push({ missionId: m.id, completed });
  }
  return results;
}
