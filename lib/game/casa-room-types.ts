/**
 * Config do quarto (casa) editável no dev. Persistido em public/game/casa-room.json.
 */

export interface CasaRoomConfig {
  /** ID do preset de quarto (ex.: quarto1, warm1, escritorio1). Se não definir, usa cores customizadas. */
  roomPresetId?: string | null;
  /** Imagem na parede traseira (usada só no modo desenho). */
  backgroundImageSrc?: string | null;
  /** Quando definido, mostra esta imagem como sala inteira (PNG) em vez do desenho em canvas. Ex.: /game/casa/quarto_firefly_1.png */
  fullRoomImageSrc?: string | null;
  options?: {
    janela?: boolean;
    luminaria?: boolean;
    quadros?: boolean;
    tomada?: boolean;
    chaoLinhas?: boolean;
    sombras?: boolean;
    brilhoChao?: boolean;
  };
  colors?: Record<string, string>;
  items?: Array<{ type: 'cama'; x: number; y: number; width: number; height: number }>;
}
