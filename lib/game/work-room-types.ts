/**
 * Config da sala de trabalho (imagem de sala inteira). Persistido em public/game/work-room.json.
 * Editável em Dev → Ambientes (aba Sala de trabalho).
 */
export interface WorkRoomConfig {
  /** Quando definido, mostra esta imagem como sala inteira em vez do desenho isométrico. Ex.: /game/casa/escritorio_firefly_1.png */
  fullRoomImageSrc?: string | null;
}
