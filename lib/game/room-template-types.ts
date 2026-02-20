/**
 * Tipos para o template da sala (definido no modo dev).
 * Cada item pode vir de um asset único ou de um slice de sprite sheet.
 */

export interface RoomTemplateItem {
  id: string;
  /** Caminho da imagem: /game/assets/... ou key do slice (sheetId:index) */
  src: string;
  label: string;
  left: number;
  bottom: number;
  width: number;
  height: number;
  /** Se veio de sprite sheet: { sheetSrc, x, y, sheetW, sheetH } para background-position */
  slice?: {
    sheetSrc: string;
    x: number;
    y: number;
    sheetW: number;
    sheetH: number;
  };
}

export interface RoomTemplate {
  roomWidth: number;
  roomHeight: number;
  items: RoomTemplateItem[];
}

export const DEFAULT_ROOM_SIZE = { width: 380, height: 340 };
