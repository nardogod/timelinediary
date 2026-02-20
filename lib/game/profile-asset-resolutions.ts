/**
 * Resoluções recomendadas para assets do card de perfil (Meu Mundo).
 * A capa e a foto são exibidas em tamanho fixo; use estas resoluções para pixel art nítida (incl. telas retina).
 */

/** Altura de exibição da capa no card (h-24 = 96px). */
export const COVER_DISPLAY_HEIGHT_PX = 96;

/** Largura típica do card no mobile/desktop; capa usa 100% dessa largura. */
export const COVER_DISPLAY_WIDTH_APPROX_PX = 560;

/**
 * Resolução ideal para a imagem da capa (pixel art).
 * Proporção ~5.8:1 (largura : altura). Use 2× para telas retina.
 */
export const COVER_RECOMMENDED_WIDTH_PX = 1120;  // 2× de ~560
export const COVER_RECOMMENDED_HEIGHT_PX = 192;   // 2× de 96

/** Resolução da capa no formato "largura×altura" para exibir na UI. */
export const COVER_RECOMMENDED_LABEL = `${COVER_RECOMMENDED_WIDTH_PX}×${COVER_RECOMMENDED_HEIGHT_PX} px`;

/** Tamanho de exibição do avatar no card (círculo). */
export const AVATAR_DISPLAY_SIZE_PX = 80;

/**
 * Resoluções que o usuário pode escolher para a foto de perfil.
 * A imagem é sempre exibida em 80×80 px; criar em um desses tamanhos mantém a pixel art nítida.
 */
export const AVATAR_RECOMMENDED_OPTIONS = [
  { value: '64×64', label: '64×64 px' },
  { value: '128×128', label: '128×128 px (recomendado)' },
  { value: '256×256', label: '256×256 px' },
] as const;

/** Resolução recomendada para avatar (melhor custo/qualidade). */
export const AVATAR_RECOMMENDED_LABEL = '128×128 px';
