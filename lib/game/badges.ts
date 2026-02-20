/**
 * Medalhas do Meu Mundo (estilo insígnias Pokémon).
 * Cada medalha tem id, nome, descrição e texto do requisito para conquistar.
 * earned_badge_ids no perfil do usuário indica quais já foram conquistadas.
 */

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  /** O que a pessoa precisa fazer para ganhar (exibido ao clicar mesmo se ainda não tiver) */
  requirement: string;
  /** Emoji ou nome do ícone (pixel art você adiciona depois em public/game/assets/badges/) */
  icon: string;
  order: number;
}

export const BADGES: BadgeDef[] = [
  {
    id: 'primeira_semana',
    name: 'Primeira semana',
    description: 'Completou 10 tarefas em uma semana.',
    requirement: 'Execute 10 tarefas concluídas em uma única semana (segunda a domingo).',
    icon: '📅',
    order: 1,
  },
  {
    id: 'maratonista',
    name: 'Maratonista',
    description: '7 dias seguidos com pelo menos 1 tarefa concluída.',
    requirement: 'Conclua pelo menos 1 tarefa por dia durante 7 dias seguidos.',
    icon: '🔥',
    order: 2,
  },
  {
    id: 'organizado',
    name: 'Organizado',
    description: 'Criou e completou 5 eventos na timeline.',
    requirement: 'Crie 5 eventos na sua timeline e marque todos como concluídos.',
    icon: '📋',
    order: 3,
  },
  {
    id: 'poupa_tempo',
    name: 'Poupa tempo',
    description: 'Usou blocos de tempo em 3 dias diferentes.',
    requirement: 'Use a agenda (blocos de tempo) em pelo menos 3 dias diferentes.',
    icon: '⏱️',
    order: 4,
  },
  {
    id: 'sem_stress',
    name: 'Sem stress',
    description: 'Manteve o stress abaixo de 20% por 3 dias.',
    requirement: 'Mantenha o indicador de stress do Meu Mundo abaixo de 20% por 3 dias seguidos.',
    icon: '🧘',
    order: 5,
  },
  {
    id: 'rico',
    name: 'Primeiras moedas',
    description: 'Acumulou 500 moedas no jogo.',
    requirement: 'Acumule 500 moedas no Meu Mundo (complete atividades e tarefas).',
    icon: '🪙',
    order: 6,
  },
  {
    id: 'nivel_5',
    name: 'Nível 5',
    description: 'Alcançou o nível 5 no Meu Mundo.',
    requirement: 'Suba até o nível 5 ganhando XP com atividades e tarefas concluídas.',
    icon: '⭐',
    order: 7,
  },
  {
    id: 'equilibrio',
    name: 'Equilíbrio',
    description: 'Saúde e stress sob controle na mesma semana.',
    requirement: 'Termine uma semana com saúde ≥ 70% e stress ≤ 30%.',
    icon: '⚖️',
    order: 8,
  },
  {
    id: 'proximo_nivel',
    name: 'Próximo nível',
    description: 'Desbloqueou o próximo nível de medalhas.',
    requirement: 'Conquiste todas as 8 medalhas acima para desbloquear o próximo nível de medalhas.',
    icon: '🏆',
    order: 9,
  },
];

/** IDs das medalhas do primeiro nível (precisam ser todas conquistadas para o próximo nível). */
export const TIER_1_BADGE_IDS = BADGES.filter((b) => b.id !== 'proximo_nivel').map((b) => b.id);

export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

export function getBadgesInOrder(): BadgeDef[] {
  return [...BADGES].sort((a, b) => a.order - b.order);
}

/** Verifica se todas as medalhas do nível 1 foram conquistadas (para desbloquear "Próximo nível"). */
export function hasUnlockedNextTier(earnedBadgeIds: string[]): boolean {
  const earned = new Set(earnedBadgeIds);
  return TIER_1_BADGE_IDS.every((id) => earned.has(id));
}
