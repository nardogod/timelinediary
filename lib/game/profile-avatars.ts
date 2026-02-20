/**
 * Avatares disponíveis para foto de perfil no Meu Mundo (pixel art).
 * Imagens em public/game/assets/avatar/ (origem: zipgame/cair/personagens/personagens cortados).
 */

export interface ProfileAvatarOption {
  id: string;
  path: string;
  name: string;
}

const AVATAR_IDS = Array.from({ length: 34 }, (_, i) => i + 1);

export const PROFILE_AVATARS: ProfileAvatarOption[] = AVATAR_IDS.map((n) => ({
  id: `personagem${n}`,
  path: `/game/assets/avatar/personagem${n}.png`,
  name: `Personagem ${n}`,
}));

export const DEFAULT_AVATAR_ID = 'personagem1';
export const DEFAULT_AVATAR_PATH = '/game/assets/avatar/personagem1.png';

export function getAvatarByPath(path: string | null): ProfileAvatarOption | undefined {
  if (!path) return PROFILE_AVATARS[0];
  return PROFILE_AVATARS.find((a) => a.path === path) ?? PROFILE_AVATARS[0];
}
