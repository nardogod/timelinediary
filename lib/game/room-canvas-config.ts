/**
 * Configuração base do ambiente "quarto" (perspectiva 3D estilo zipgame/cair).
 * Use como fundo base e edite cores/dimensões/elementos como quiser.
 * Referência: zipgame/cair/index.html e quarto_vazio.html
 */

/** Tamanho padrão de exibição para imagens de sala (PNG) no app. Todas as imagens de quarto/escritório usam este tamanho. */
export const ROOM_IMAGE_DISPLAY_WIDTH = 400;
export const ROOM_IMAGE_DISPLAY_HEIGHT = 400;

export interface RoomCanvasColors {
  parede: string;
  paredeSombra: string;
  chao: string;
  chaoClaro: string;
  chaoEscuro: string;
  teto: string;
  janelaFrame: string;
  janelaVidro: string;
  cortina: string;
  cortinaEscura: string;
  cortinaClara: string;
  luminaria: string;
  lampada: string;
  lampadaBrilho: string;
  quadro1: string;
  quadro2: string;
  moldura: string;
  tomada: string;
  /** Cama (quarto) */
  camaCabeceira: string;
  camaColchao: string;
  camaLencol: string;
  camaSombra: string;
}

/** Item colocável no quarto (ex.: cama) */
export interface RoomCanvasItemCama {
  type: 'cama';
  /** Canto traseiro esquerdo no chão (canvas: x, y do topo da cabeceira) */
  x: number;
  y: number;
  /** Largura da cama */
  width: number;
  /** Altura da cabeceira */
  height: number;
}

export type RoomCanvasItem = RoomCanvasItemCama;

export interface RoomCanvasOptions {
  width: number;
  height: number;
  /** Desenhar janela + cortinas */
  janela: boolean;
  /** Desenhar luminária no teto */
  luminaria: boolean;
  /** Desenhar quadros na parede */
  quadros: boolean;
  /** Desenhar tomada */
  tomada: boolean;
  /** Linhas do chão (placas) */
  chaoLinhas: boolean;
  /** Sombras de profundidade */
  sombras: boolean;
  /** Brilho da lâmpada no chão */
  brilhoChao: boolean;
}

export const DEFAULT_ROOM_COLORS: RoomCanvasColors = {
  parede: '#E8B4B4',
  paredeSombra: '#D4A0A0',
  chao: '#7A8B99',
  chaoClaro: '#8B9CAA',
  chaoEscuro: '#697A88',
  teto: '#C49494',
  janelaFrame: '#8B7355',
  janelaVidro: '#B8D4E8',
  cortina: '#6B8E9F',
  cortinaEscura: '#5A7D8E',
  cortinaClara: '#7C9FB0',
  luminaria: '#4A4A4A',
  lampada: '#FFF8DC',
  lampadaBrilho: '#FFFACD',
  quadro1: '#9FB4CC',
  quadro2: '#CC9F9F',
  moldura: '#8B7355',
  tomada: '#D4C4B4',
  camaCabeceira: '#8B7355',
  camaColchao: '#D4C4B4',
  camaLencol: '#FAF0E6',
  camaSombra: '#697A88',
};

export const DEFAULT_ROOM_OPTIONS: RoomCanvasOptions = {
  width: 400,
  height: 500,
  janela: true,
  luminaria: true,
  quadros: true,
  tomada: true,
  chaoLinhas: true,
  sombras: true,
  brilhoChao: true,
};

/** Retângulo da parede traseira (onde pode ir a imagem de fundo) */
export function getBackWallRect(options: RoomCanvasOptions) {
  return { x: 50, y: 50, w: 300, h: 350 };
}

/** Posição padrão da cama no quarto (encostada na parede, à esquerda; y = topo da cabeceira, perto do chão) */
export const DEFAULT_CAMA: RoomCanvasItemCama = {
  type: 'cama',
  x: 55,
  y: 350,
  width: 110,
  height: 50,
};
