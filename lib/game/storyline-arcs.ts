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
    story: 'Luna, a Última Iniciada, te guia nos primeiros passos. Complete Primeira Luz, Caminho Iluminado e Porta Aberta para provar que está pronto e desbloquear a Trilha do Guerreiro.',
  },
  {
    id: 'guerreiro',
    name: 'Trilha do Guerreiro',
    avatarIndices: [1, 2, 3, 4, 5, 6, 7],
    story: 'Kael, Lyra, Thorne e os outros te ensinam disciplina e força. Cada um desbloqueia o próximo ao completar as 3 missões.',
  },
  {
    id: 'sombra',
    name: 'Trilha da Sombra',
    avatarIndices: [8, 10, 11, 12, 13, 14],
    story: 'Shadow, Draven, Vex... A sombra exige precisão e constância. Complete cada arco para avançar.',
  },
  {
    id: 'natureza',
    name: 'Trilha da Natureza',
    avatarIndices: [15, 16, 17, 18, 19, 20, 21],
    story: 'Sylas, Fenrir, Aurora e os guardiões da natureza. Equilíbrio e variedade nas tarefas levam ao próximo personagem.',
  },
  {
    id: 'tecnologia',
    name: 'Trilha da Tecnologia',
    avatarIndices: [22, 23, 24, 25, 26, 27, 28],
    story: 'Neo, Pixel, Glitch... A trilha tech recompensa organização e ritmo. Desbloqueie um a um.',
  },
  {
    id: 'mistica',
    name: 'Trilha Mística',
    avatarIndices: [29, 30, 31, 32, 33, 34],
    story: 'Zen, Spirit, Oracle até Eternal. O fim da jornada exige maestria: complete cada arco para o título e o próximo avatar.',
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
