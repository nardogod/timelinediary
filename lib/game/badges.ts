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

/** Títulos no mural — Ordem dos Guardiões (docs/LORE_ORDEM_DOS_GUARDIOES.md). */
const AVATAR_TITLE_BADGES: BadgeDef[] = [
  { id: 'titulo_kael', name: 'Disciplinado', description: 'Força de vontade. Forma final de Kael.', requirement: 'Complete as 3 missões do Guerreiro Kael.', icon: '⚔️', order: 100 },
  { id: 'titulo_lyra', name: 'Estrategista', description: 'Planejamento. Forma final de Lyra.', requirement: 'Complete as 3 missões da Estrategista Lyra.', icon: '♟️', order: 101 },
  { id: 'titulo_thorne', name: 'Intenso', description: 'Foco profundo. Forma final de Thorne.', requirement: 'Complete as 3 missões do Bárbaro Thorne.', icon: '🪓', order: 102 },
  { id: 'titulo_seraphina', name: 'Inquebrável', description: 'Constância. Forma final de Seraphina.', requirement: 'Complete as 3 missões da Paladina Seraphina.', icon: '🛡️', order: 103 },
  { id: 'titulo_ragnar', name: 'Rei do Norte', description: 'Conquistador. Forma final de Ragnar.', requirement: 'Complete as 3 missões do Viking Ragnar.', icon: '⛵', order: 104 },
  { id: 'titulo_elara', name: 'Caçadora Lendária', description: 'Precisão. Forma final de Elara.', requirement: 'Complete as 3 missões da Arqueira Elara.', icon: '🏹', order: 105 },
  { id: 'titulo_magnus', name: 'Sábio', description: 'Mestria intelectual. Forma final de Magnus.', requirement: 'Complete as 3 missões do Mago Magnus.', icon: '📜', order: 106 },
  { id: 'titulo_shadow', name: 'Eficiente', description: 'Precisão. Forma final de Shadow.', requirement: 'Complete as 3 missões do Assassino Shadow.', icon: '🗡️', order: 107 },
  { id: 'titulo_luna', name: 'Iniciado', description: 'Começo da jornada. A Guia Luna te reconheceu.', requirement: 'Complete as 3 missões de Luna (Primeira Luz, Caminho Iluminado, Porta Aberta).', icon: '💎', order: 108 },
  { id: 'titulo_draven', name: 'Ressuscitador', description: 'Redenção. Forma final de Draven.', requirement: 'Complete as 3 missões do Necromante Draven.', icon: '💀', order: 109 },
  { id: 'titulo_vex', name: 'Ilusionista', description: 'Criatividade. Forma final de Vex.', requirement: 'Complete as 3 missões da Ilusionista Vex.', icon: '🎭', order: 110 },
  { id: 'titulo_raven', name: 'Caçadora', description: 'Coragem. Forma final de Raven.', requirement: 'Complete as 3 missões da Caçadora Raven.', icon: '🎯', order: 111 },
  { id: 'titulo_zane', name: 'Iconoclasta', description: 'Quebra de regras. Forma final de Zane.', requirement: 'Complete as 3 missões do Espadachim Zane.', icon: '⚔️', order: 112 },
  { id: 'titulo_nyx', name: 'Noturno', description: 'Ritmo próprio. Forma final de Nyx.', requirement: 'Complete as 3 missões da Feiticeira Nyx.', icon: '🌙', order: 113 },
  { id: 'titulo_sylas', name: 'Versátil', description: 'Adaptação. Forma final de Sylas.', requirement: 'Complete as 3 missões do Druida Sylas.', icon: '🌿', order: 114 },
  { id: 'titulo_fenrir', name: 'Líder', description: 'Fluxo. Forma final de Fenrir.', requirement: 'Complete as 3 missões do Lobo Fenrir.', icon: '🐺', order: 115 },
  { id: 'titulo_aurora', name: 'Inspiradora', description: 'Estética. Forma final de Aurora.', requirement: 'Complete as 3 missões da Elfa Aurora.', icon: '✨', order: 116 },
  { id: 'titulo_thorn', name: 'Paciente', description: 'Longo prazo. Forma final de Thorn.', requirement: 'Complete as 3 missões do Ent Thorn.', icon: '🌳', order: 117 },
  { id: 'titulo_ember', name: 'Ressurgido', description: 'Resiliência. Forma final de Ember.', requirement: 'Complete as 3 missões da Fênix Ember.', icon: '🔥', order: 118 },
  { id: 'titulo_tide', name: 'Fluido', description: 'Energia. Forma final de Tide.', requirement: 'Complete as 3 missões do Tritão Tide.', icon: '🌊', order: 119 },
  { id: 'titulo_gale', name: 'Leve', description: 'Eficiência sustentável. Forma final de Gale.', requirement: 'Complete as 3 missões do Sílfide Gale.', icon: '💨', order: 120 },
  { id: 'titulo_neo', name: 'Híbrido', description: 'Integração tech. Forma final de Neo.', requirement: 'Complete as 3 missões do Ciborgue Neo.', icon: '🤖', order: 121 },
  { id: 'titulo_pixel', name: 'Otimizado', description: 'Inteligência. Forma final de Pixel.', requirement: 'Complete as 3 missões da IA Pixel.', icon: '💻', order: 122 },
  { id: 'titulo_glitch', name: 'Hacker', description: 'Criatividade sistêmica. Forma final de Glitch.', requirement: 'Complete as 3 missões do Hacker Glitch.', icon: '⌨️', order: 123 },
  { id: 'titulo_spark', name: 'Construtora', description: 'Sistemas. Forma final de Spark.', requirement: 'Complete as 3 missões da Engenheira Spark.', icon: '🔧', order: 124 },
  { id: 'titulo_byte', name: 'Inquebrável', description: 'Rotina. Forma final de Byte.', requirement: 'Complete as 3 missões do Robô Byte.', icon: '📟', order: 125 },
  { id: 'titulo_data', name: 'Iluminado', description: 'Conhecimento. Forma final de Data.', requirement: 'Complete as 3 missões do Cientista Data.', icon: '🔬', order: 126 },
  { id: 'titulo_nova', name: 'Exploradora', description: 'Inovação. Forma final de Nova.', requirement: 'Complete as 3 missões da Astronauta Nova.', icon: '🚀', order: 127 },
  { id: 'titulo_zen', name: 'Presente', description: 'Mindfulness. Forma final de Zen.', requirement: 'Complete as 3 missões do Monge Zen.', icon: '☯️', order: 128 },
  { id: 'titulo_spirit', name: 'Atemporal', description: 'Conexão. Forma final de Spirit.', requirement: 'Complete as 3 missões do Xamã Spirit.', icon: '🦅', order: 129 },
  { id: 'titulo_oracle', name: 'Visionária', description: 'Previsão. Forma final de Oracle.', requirement: 'Complete as 3 missões da Vidente Oracle.', icon: '🔮', order: 130 },
  { id: 'titulo_phantom', name: 'Silencioso', description: 'Intrínseco. Forma final de Phantom.', requirement: 'Complete as 3 missões do Fantasma Phantom.', icon: '👻', order: 131 },
  { id: 'titulo_titan', name: 'Inexorável', description: 'Volume. Forma final de Titan.', requirement: 'Complete as 3 missões do Colosso Titan.', icon: '💪', order: 132 },
  { id: 'titulo_eternal', name: 'IMORTAL', description: 'Lenda viva. O primeiro e último Guardião.', requirement: 'Complete as 3 missões do Imortal Eternal.', icon: '⏳', order: 133 },
];

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
  // Títulos de conquista (forma final de cada avatar) — ordem 100+
  ...AVATAR_TITLE_BADGES,
];

/** IDs das medalhas do primeiro nível (precisam ser todas conquistadas para o próximo nível). */
export const TIER_1_BADGE_IDS = BADGES.filter((b) => b.id !== 'proximo_nivel' && b.order < 100).map((b) => b.id);

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
