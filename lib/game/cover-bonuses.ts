/**
 * Bônus por capa (capas pagas dão vantagem diferente).
 * Cada capa dá um pouco de bônus anti-stress e um pouco mais de dinheiro ao trabalhar (%), com diferenças entre elas.
 * A capa "default" é a única desbloqueada por padrão (sem bônus).
 */

export type CoverBonusType = 'xp_percent' | 'coins_percent' | 'stress_reduce_percent' | 'health_extra';

export interface CoverBonus {
  cover_id: string;
  /** +X% XP ao concluir tarefas */
  xp_percent?: number;
  /** +X% moedas ao concluir tarefas (ex.: trabalho) */
  coins_percent?: number;
  /** -X% de stress ao concluir atividades (anti-stress) */
  stress_reduce_percent?: number;
  /** +X de saúde ao concluir tarefa ou ao relaxar */
  health_extra?: number;
}

/** default = sem bônus; cada capa paga tem anti-stress % e +dinheiro % ao trabalhar, com diferenças. */
export const COVER_BONUSES: Record<string, CoverBonus> = {
  default: { cover_id: 'default' },
  capa1: { cover_id: 'capa1', xp_percent: 3, coins_percent: 2, stress_reduce_percent: 2 },
  capa2: { cover_id: 'capa2', coins_percent: 5, stress_reduce_percent: 3 },
  capa3: { cover_id: 'capa3', coins_percent: 2, stress_reduce_percent: 5 },
  capa4: { cover_id: 'capa4', coins_percent: 3, stress_reduce_percent: 3, health_extra: 1 },
  capa5: { cover_id: 'capa5', xp_percent: 2, coins_percent: 4, stress_reduce_percent: 4 },
};

export function getCoverBonus(coverId: string | null): CoverBonus {
  if (!coverId) return COVER_BONUSES.default;
  return COVER_BONUSES[coverId] ?? COVER_BONUSES.default;
}
