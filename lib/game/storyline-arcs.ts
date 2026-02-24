/**
 * Arcos da história do Meu Mundo. Cada arco agrupa personagens e tem uma narrativa curta.
 * A história se conecta: você começa com Luna (Prelúdio), depois segue pelas trilhas na ordem.
 */

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface StoryArc {
  id: string;
  name: string;
  /** Índices dos avatares neste arco (1..34). */
  avatarIndices: number[];
  /** Texto curto que conecta o arco à história. */
  story: string;
}

/** Luna é o prelúdio; em seguida vêm as cinco trilhas na ordem da storyline. */
export const STORY_ARCS: StoryArc[] = [
  {
    id: 'preludio',
    name: 'Prelúdio',
    avatarIndices: [9],
    story:
      'Luna, a Última Iniciada, te guia nos primeiros passos dentro da Ordem. Aqui você prova que consegue usar a agenda com variedade de pastas, links e nível mínimo de atenção. Ao concluir suas 3 missões, você mostra que está pronto para entrar na Trilha do Guerreiro.',
  },
  {
    id: 'guerreiro',
    name: 'Trilha do Guerreiro',
    avatarIndices: [1, 2, 3, 4, 5, 6, 7],
    story:
      'Kael, Lyra, Thorne e os outros transformam sua rotina em treino: dias com foco, semanas consistentes, metas claras de nível e moedas. Cada personagem dessa trilha representa um jeito diferente de lidar com pressão e disciplina, e completar as 3 missões de um deles abre caminho para o próximo guerreiro.',
  },
  {
    id: 'sombra',
    name: 'Trilha da Sombra',
    avatarIndices: [8, 10, 11, 12, 13, 14],
    story:
      'Shadow, Draven, Vex e os demais vivem no limite entre foco e exaustão. Suas missões testam sua capacidade de voltar depois de pausas, manter dias ativos mesmo quando tudo está pesado e equilibrar “modo batalha” com descanso real. A cada 3 missões concluídas, a sombra ganha uma nova forma.',
  },
  {
    id: 'natureza',
    name: 'Trilha da Natureza',
    avatarIndices: [15, 16, 17, 18, 19, 20, 21],
    story:
      'Sylas, Fenrir, Aurora e os outros guardiões da natureza te convidam a misturar áreas da vida: trabalho, estudos, lazer e cuidado pessoal. Aqui o foco é construir semanas equilibradas, com pequenas tarefas espalhadas em várias pastas. A progressão nessa trilha mostra se sua rotina respira ou está sufocada.',
  },
  {
    id: 'tecnologia',
    name: 'Trilha da Tecnologia',
    avatarIndices: [22, 23, 24, 25, 26, 27, 28],
    story:
      'Neo, Pixel, Glitch e companhia representam a parte “sistêmica” da sua vida: projetos longos, links, documentação e processos. As missões dessa trilha pedem regularidade em períodos maiores e uso inteligente da timeline como registro. Cada avanço deixa seu sistema pessoal mais robusto.',
  },
  {
    id: 'mistica',
    name: 'Trilha Mística',
    avatarIndices: [29, 30, 31, 32, 33, 34],
    story:
      'Zen, Spirit, Oracle até Eternal fecham a jornada com foco em sentido e longo prazo. Aqui, as metas envolvem grandes volumes de tarefas, streaks longos e níveis altos — é a prova de que você consegue sustentar hábitos por meses, não só por semanas. Concluir essa trilha é praticamente “zerar” o Meu Mundo.',
  },
];

const ARC_BY_AVATAR_INDEX = new Map<number, StoryArc>();
for (const arc of STORY_ARCS) {
  for (const i of arc.avatarIndices) {
    ARC_BY_AVATAR_INDEX.set(i, arc);
  }
}

export function getArcByAvatarIndex(avatarIndex: number): StoryArc | undefined {
  return ARC_BY_AVATAR_INDEX.get(avatarIndex);
}

export function getArcName(avatarIndex: number): string {
  return getArcByAvatarIndex(avatarIndex)?.name ?? 'Meu Mundo';
}

export function getArcStory(avatarIndex: number): string | undefined {
  return getArcByAvatarIndex(avatarIndex)?.story;
}
