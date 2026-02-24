/**
 * Avatares disponíveis para foto de perfil no Meu Mundo (pixel art).
 * Imagens em public/game/assets/avatar/ (origem: zipgame/cair/personagens/personagens cortados).
 * Nomes: trilhas Guerreiro (1-7), Sombra (8-14), Natureza (15-21), Tecnologia (22-28), Mística (29-34).
 */

export interface ProfileAvatarOption {
  id: string;
  path: string;
  name: string;
  /** Frase curta sobre o personagem, usada na história do Meu Mundo. */
  tagline?: string;
}

const AVATAR_NAMES: string[] = [
  'Kael', 'Lyra', 'Thorne', 'Seraphina', 'Ragnar', 'Elara', 'Magnus',       // 1-7 Guerreiro
  'Shadow', 'Luna', 'Draven', 'Vex', 'Raven', 'Zane', 'Nyx',               // 8-14 Sombra
  'Sylas', 'Fenrir', 'Aurora', 'Thorn', 'Ember', 'Tide', 'Gale',          // 15-21 Natureza
  'Neo', 'Pixel', 'Glitch', 'Spark', 'Byte', 'Data', 'Nova',               // 22-28 Tecnologia
  'Zen', 'Spirit', 'Oracle', 'Phantom', 'Titan', 'Eternal',                // 29-34 Mística
];

/** Descrições curtas por avatar 1..34, alinhadas com os arcos da história. */
const AVATAR_TAGLINES: string[] = [
  'Kael dá o primeiro passo da Trilha do Guerreiro: disciplina básica e coragem para começar.', // 1
  'Lyra planeja cada movimento; com ela, organização vira arma.', // 2
  'Thorne transforma raiva em foco — trabalho duro com limite.', // 3
  'Seraphina exige constância: luz acesa todos os dias.', // 4
  'Ragnar liga jornada a viagens e descobertas fora da rotina.', // 5
  'Elara recompensa precisão: menos quantidade, mais mira.', // 6
  'Magnus mistura estudos e estratégia para grandes conquistas.', // 7
  'Shadow testa sua disciplina quando tudo está caótico.', // 8
  'Luna é o prelúdio: prova de que você está pronto para trilhas maiores.', // 9
  'Draven cuida dos recomeços — levantar depois de pausas longas.', // 10
  'Vex brinca com máscaras: variar pastas e papéis sem perder o foco.', // 11
  'Raven premia caçadas consistentes em trabalho.', // 12
  'Zane mede duelos diários: dias em que você realmente aperta o ritmo.', // 13
  'Nyx acompanha noites produtivas sem estourar limites.', // 14
  'Sylas abre a Trilha da Natureza: equilíbrio entre áreas da vida.', // 15
  'Fenrir representa esforço intenso em blocos curtos de tempo.', // 16
  'Aurora conecta estudo profundo com rotina estável.', // 17
  'Thorn recompensa raízes fortes: muitas pequenas tarefas ao longo da semana.', // 18
  'Ember marca renascimentos: voltar a cuidar de si mesmo.', // 19
  'Tide acompanha ciclos de alta e baixa de energia com variedade de pastas.', // 20
  'Gale celebra dias leves com várias pequenas vitórias.', // 21
  'Neo abre a Trilha da Tecnologia: otimizar processos do dia a dia.', // 22
  'Pixel recompensa quem registra links e referências com cuidado.', // 23
  'Glitch mede sprints intensos de foco técnico.', // 24
  'Spark valoriza projetos construídos em várias frentes ao mesmo tempo.', // 25
  'Data observa consistência em períodos mais longos.', // 26
  'Nova fecha a parte tecnológica com exploração e expansão de rotina.', // 27
  'Zen inicia a Trilha Mística: foco em bem‑estar e longas sequências.', // 28
  'Spirit mede equilíbrio entre tarefas e descanso.', // 29
  'Oracle olha para previsibilidade: planejar a frente com regularidade.', // 30
  'Phantom acompanha semanas cheias mas bem distribuídas.', // 31
  'Titan reforça força mental para grandes volumes de tarefa.', // 32
  'Eternal é o fim de jogo: manter constância por muito tempo.', // 33
];

const AVATAR_IDS = Array.from({ length: 34 }, (_, i) => i + 1);

export const PROFILE_AVATARS: ProfileAvatarOption[] = AVATAR_IDS.map((n) => ({
  id: `personagem${n}`,
  path: `/game/assets/avatar/personagem${n}.png`,
  name: AVATAR_NAMES[n - 1] ?? `Personagem ${n}`,
  tagline: AVATAR_TAGLINES[n - 1],
}));

export const DEFAULT_AVATAR_ID = 'personagem9';
export const DEFAULT_AVATAR_PATH = '/game/assets/avatar/personagem9.png';

export function getAvatarByPath(path: string | null): ProfileAvatarOption | undefined {
  if (!path) return PROFILE_AVATARS.find((a) => a.id === DEFAULT_AVATAR_ID) ?? PROFILE_AVATARS[0];
  return PROFILE_AVATARS.find((a) => a.path === path) ?? PROFILE_AVATARS.find((a) => a.id === DEFAULT_AVATAR_ID) ?? PROFILE_AVATARS[0];
}
