/**
 * Tipos de pasta e recompensas ao concluir tarefa (Meu Mundo).
 * Trabalho: dinheiro e XP, mas stress e diminui saúde.
 * Estudos: mais XP, menos stress e menos custo de saúde que trabalho, sem dinheiro.
 * Lazer: aumenta bastante a saúde, sem XP nem dinheiro.
 * Tarefas pessoais: aumenta saúde e diminui um pouco o stress, sem XP nem dinheiro.
 */

export type FolderType = 'trabalho' | 'estudos' | 'lazer' | 'tarefas_pessoais';

export interface FolderTypeReward {
  coins: number;
  xp: number;
  health_change: number;
  stress_change: number;
}

/** Recompensas base por tipo de pasta (rebalanceadas: meio-termo, níveis escaláveis). */
export const FOLDER_TYPE_REWARDS: Record<FolderType, FolderTypeReward> = {
  trabalho: {
    coins: 120,
    xp: 35,
    health_change: -6,
    stress_change: 16,
  },
  estudos: {
    xp: 55,
    coins: 0,
    health_change: -3,
    stress_change: 8,
  },
  lazer: {
    coins: 0,
    xp: 0,
    health_change: 12,
    stress_change: -8,
  },
  tarefas_pessoais: {
    coins: 0,
    xp: 0,
    health_change: 5,
    stress_change: -4,
  },
};

/** Nomes padrão das pastas por tipo (para criar pastas iniciais). */
export const DEFAULT_FOLDER_NAMES: Record<FolderType, string> = {
  trabalho: 'Trabalho',
  estudos: 'Estudos',
  lazer: 'Lazer',
  tarefas_pessoais: 'Tarefas pessoais',
};

/** Cores sugeridas por tipo. */
export const DEFAULT_FOLDER_COLORS: Record<FolderType, string> = {
  trabalho: '#dc2626',
  estudos: '#2563eb',
  lazer: '#16a34a',
  tarefas_pessoais: '#ca8a04',
};

export function getRewardForFolderType(
  folderType: string | null | undefined
): FolderTypeReward {
  if (folderType && folderType in FOLDER_TYPE_REWARDS) {
    return FOLDER_TYPE_REWARDS[folderType as FolderType];
  }
  return FOLDER_TYPE_REWARDS.trabalho;
}

/** Importância do evento na timeline: influencia XP, dinheiro, saúde e stress ao concluir tarefa. */
export type EventImportance = 'simple' | 'medium' | 'important';

/** Multiplicador aplicado às recompensas da pasta conforme a importância do evento. */
export const EVENT_IMPORTANCE_MULTIPLIER: Record<EventImportance, number> = {
  simple: 0.6,    // menos XP, menos dinheiro, menos impacto (stress/saúde)
  medium: 1,
  important: 1.4, // bastante
};

export function getImportanceMultiplier(importance: EventImportance | string | null | undefined): number {
  if (importance && importance in EVENT_IMPORTANCE_MULTIPLIER) {
    return EVENT_IMPORTANCE_MULTIPLIER[importance as EventImportance];
  }
  return EVENT_IMPORTANCE_MULTIPLIER.medium;
}
