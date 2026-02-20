/**
 * Capas de fundo pixel art para o card de perfil (Meu Mundo).
 * Imagens em public/game/assets/covers/ (origem: zipgame/cair/personagens/capas).
 * A área de exibição é h-24 (96px) × 100% largura; object-cover centraliza e preenche.
 */

export interface ProfileCoverOption {
  id: string;
  name: string;
  /** Path da imagem (public/game/assets/covers/...) */
  imagePath: string;
}

export const PROFILE_COVERS: ProfileCoverOption[] = [
  { id: 'default', name: 'Padrão', imagePath: '' },
  { id: 'capa1', name: 'Capa 1', imagePath: '/game/assets/covers/capa1.png' },
  { id: 'capa2', name: 'Capa 2', imagePath: '/game/assets/covers/capa2.png' },
  { id: 'capa3', name: 'Capa 3', imagePath: '/game/assets/covers/capa3.png' },
  { id: 'capa4', name: 'Capa 4', imagePath: '/game/assets/covers/capa4.png' },
  { id: 'capa5', name: 'Capa 5', imagePath: '/game/assets/covers/capa5.png' },
];

export function getCoverById(id: string | null): ProfileCoverOption | undefined {
  if (!id) return PROFILE_COVERS[0];
  return PROFILE_COVERS.find((c) => c.id === id) ?? PROFILE_COVERS[0];
}
