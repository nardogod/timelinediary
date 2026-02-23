/**
 * Avatares disponíveis para foto de perfil no Meu Mundo (pixel art).
 * Imagens em public/game/assets/avatar/ (origem: zipgame/cair/personagens/personagens cortados).
 * Nomes: trilhas Guerreiro (1-7), Sombra (8-14), Natureza (15-21), Tecnologia (22-28), Mística (29-34).
 */

export interface ProfileAvatarOption {
  id: string;
  path: string;
  name: string;
}

const AVATAR_NAMES: string[] = [
  'Kael', 'Lyra', 'Thorne', 'Seraphina', 'Ragnar', 'Elara', 'Magnus',       // 1-7 Guerreiro
  'Shadow', 'Luna', 'Draven', 'Vex', 'Raven', 'Zane', 'Nyx',               // 8-14 Sombra
  'Sylas', 'Fenrir', 'Aurora', 'Thorn', 'Ember', 'Tide', 'Gale',          // 15-21 Natureza
  'Neo', 'Pixel', 'Glitch', 'Spark', 'Byte', 'Data', 'Nova',               // 22-28 Tecnologia
  'Zen', 'Spirit', 'Oracle', 'Phantom', 'Titan', 'Eternal',                // 29-34 Mística
];

const AVATAR_IDS = Array.from({ length: 34 }, (_, i) => i + 1);

export const PROFILE_AVATARS: ProfileAvatarOption[] = AVATAR_IDS.map((n) => ({
  id: `personagem${n}`,
  path: `/game/assets/avatar/personagem${n}.png`,
  name: AVATAR_NAMES[n - 1] ?? `Personagem ${n}`,
}));

export const DEFAULT_AVATAR_ID = 'personagem9';
export const DEFAULT_AVATAR_PATH = '/game/assets/avatar/personagem9.png';

export function getAvatarByPath(path: string | null): ProfileAvatarOption | undefined {
  if (!path) return PROFILE_AVATARS.find((a) => a.id === DEFAULT_AVATAR_ID) ?? PROFILE_AVATARS[0];
  return PROFILE_AVATARS.find((a) => a.path === path) ?? PROFILE_AVATARS.find((a) => a.id === DEFAULT_AVATAR_ID) ?? PROFILE_AVATARS[0];
}
