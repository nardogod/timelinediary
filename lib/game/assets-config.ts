/**
 * Catálogo de assets do jogo (sala de trabalho).
 * Usado pelo editor dev para listar móveis e pelo slicer para sprite sheets.
 */

export interface GameAsset {
  key: string;
  src: string;
  label: string;
  category: 'furniture' | 'room' | 'character' | 'sheet';
  defaultWidth: number;
  defaultHeight: number;
}

export interface SpriteSheetAsset {
  key: string;
  src: string;
  label: string;
  /** Dimensões de cada célula (para grid fixo) */
  cellWidth: number;
  cellHeight: number;
  cols: number;
  rows: number;
}

/** Assets únicos (uma imagem = um item) */
export const GAME_ASSETS: GameAsset[] = [
  { key: 'floorCarpet_S', src: '/game/assets/room/floorCarpet_S.png', label: 'Chão tapete S', category: 'room', defaultWidth: 240, defaultHeight: 150 },
  { key: 'floorCarpet_N', src: '/game/assets/room/floorCarpet_N.png', label: 'Chão tapete N', category: 'room', defaultWidth: 240, defaultHeight: 150 },
  { key: 'floorCarpet_E', src: '/game/assets/room/floorCarpet_E.png', label: 'Chão tapete E', category: 'room', defaultWidth: 240, defaultHeight: 150 },
  { key: 'floorCarpet_W', src: '/game/assets/room/floorCarpet_W.png', label: 'Chão tapete W', category: 'room', defaultWidth: 240, defaultHeight: 150 },
  { key: 'wallBooks_S', src: '/game/assets/room/wallBooks_S.png', label: 'Parede livros', category: 'room', defaultWidth: 64, defaultHeight: 64 },
  { key: 'wallDoorway_S', src: '/game/assets/room/wallDoorway_S.png', label: 'Porta', category: 'room', defaultWidth: 64, defaultHeight: 64 },
  { key: 'longTable_S', src: '/game/assets/furniture/longTable_S.png', label: 'Mesa longa', category: 'furniture', defaultWidth: 112, defaultHeight: 80 },
  { key: 'longTableDecorated_S', src: '/game/assets/furniture/longTableDecorated_S.png', label: 'Mesa decorada', category: 'furniture', defaultWidth: 112, defaultHeight: 80 },
  { key: 'libraryChair_S', src: '/game/assets/furniture/libraryChair_S.png', label: 'Cadeira', category: 'furniture', defaultWidth: 56, defaultHeight: 56 },
  { key: 'bookcaseBooks_E', src: '/game/assets/furniture/bookcaseBooks_E.png', label: 'Estante livros', category: 'furniture', defaultWidth: 64, defaultHeight: 80 },
  { key: 'bookcaseWideBooks_E', src: '/game/assets/furniture/bookcaseWideBooks_E.png', label: 'Estante larga', category: 'furniture', defaultWidth: 96, defaultHeight: 80 },
  { key: 'candleStand_N', src: '/game/assets/furniture/candleStand_N.png', label: 'Luminária', category: 'furniture', defaultWidth: 48, defaultHeight: 56 },
];

/** Sprite sheets conhecidos (para o slicer) */
export const SPRITE_SHEETS: SpriteSheetAsset[] = [
  {
    key: 'furnitureandwalls',
    src: '/game/assets/room/furnitureandwalls.png',
    label: 'Furniture and Walls (OpenGameArt)',
    cellWidth: 64,
    cellHeight: 64,
    cols: 16,
    rows: 16,
  },
];

export function getAssetByKey(key: string): GameAsset | undefined {
  return GAME_ASSETS.find((a) => a.key === key);
}
