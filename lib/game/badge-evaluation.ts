/**
 * Avaliação de medalhas do Meu Mundo.
 * Verifica requisitos e retorna a lista completa de badge ids que o usuário conquistou.
 */
import { getGameProfile } from '@/lib/db/game';
import {
  getCompletedTasksCountThisWeek,
  getDistinctCompletedTaskDates,
} from '@/lib/db/tasks';
import { getEventsByUserId } from '@/lib/db/events';
import { TIER_1_BADGE_IDS } from './badges';

/** Verifica se há 7 dias consecutivos em dates (YYYY-MM-DD ordenadas). */
function hasConsecutiveDays(dates: string[], count: number): boolean {
  if (dates.length < count) return false;
  const set = new Set(dates);
  const sorted = [...set].sort();
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]).getTime();
    const curr = new Date(sorted[i]).getTime();
    const diffDays = (curr - prev) / (24 * 60 * 60 * 1000);
    if (diffDays === 1) {
      run++;
      if (run >= count) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

/**
 * Retorna os IDs de todas as medalhas que o usuário já conquistou.
 * Usado para atualizar earned_badge_ids no perfil.
 */
export async function evaluateBadges(userId: string): Promise<string[]> {
  const profile = await getGameProfile(userId);
  if (!profile) return [];

  const earned = new Set(profile.earned_badge_ids ?? []);
  const tasksThisWeek = await getCompletedTasksCountThisWeek(userId);
  const distinctDates = await getDistinctCompletedTaskDates(userId);
  const events = await getEventsByUserId(userId);
  const eventsFromTasks = events.filter((e) => e.task_id != null);

  // Primeira semana: 10 tarefas em uma semana
  if (tasksThisWeek >= 10) earned.add('primeira_semana');

  // Maratonista: 7 dias seguidos com pelo menos 1 tarefa
  if (hasConsecutiveDays(distinctDates, 7)) earned.add('maratonista');

  // Organizado: criou e completou 5 eventos (eventos com task_id = de tarefa concluída)
  if (eventsFromTasks.length >= 5) earned.add('organizado');

  // Poupa tempo: usou a agenda em 3 dias diferentes
  if (distinctDates.length >= 3) earned.add('poupa_tempo');

  // Sem stress: stress < 20% por 3 dias (por enquanto: só estado atual)
  if (profile.stress < 20) earned.add('sem_stress');

  // Rico: 500 moedas
  if (profile.coins >= 500) earned.add('rico');

  // Nível 5
  if (profile.level >= 5) earned.add('nivel_5');

  // Equilíbrio: saúde ≥ 70% e stress ≤ 30% (estado atual)
  if (profile.health >= 70 && profile.stress <= 30) earned.add('equilibrio');

  // Próximo nível: tem as 8 primeiras
  const hasTier1 = TIER_1_BADGE_IDS.every((id) => earned.has(id));
  if (hasTier1) earned.add('proximo_nivel');

  return [...earned];
}
