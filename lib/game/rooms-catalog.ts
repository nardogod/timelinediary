/**
 * Catálogo de casas e salas de trabalho (Fase 6). Nada é grátis — primeira de cada tem preço 0 (já possuída ao criar perfil).
 */

export type RoomType = 'house' | 'work';

export interface HouseDef {
  id: string;
  name: string;
  price: number;
  /** Redução extra de stress ao relaxar (além do base). */
  relax_extra: number;
  /** Aumento de saúde ao relaxar (além do base, se houver). */
  health_bonus: number;
  /** Imagem do quarto (pasta public/game/casa/quartos/). */
  imagePath?: string;
}

export interface WorkRoomDef {
  id: string;
  name: string;
  price: number;
  /** Moedas extras ao ativar "Trabalhar" (além do base). */
  work_coins_extra: number;
  /** Redução do custo de saúde ao ativar "Trabalhar" (ex: -2 = custa 8 em vez de 10). */
  work_health_extra: number;
  /** Imagem do escritório (pasta public/game/casa/escritorio/). */
  imagePath?: string;
}

const RELAX_BASE = 15;
/** Quartos em public/game/casa/quartos/ (quarto_1.png … quarto_5.png). */
/** Preços 12× (rebalanceamento). Casa básica já possuída (price 0). */
export const HOUSES: HouseDef[] = [
  { id: 'casa_1', name: 'Casa Básica', price: 0, relax_extra: 0, health_bonus: 5, imagePath: '/game/casa/quartos/quarto_1.png' },
  { id: 'casa_2', name: 'Casa Conforto', price: 1800, relax_extra: 5, health_bonus: 10, imagePath: '/game/casa/quartos/quarto_2.png' },
  { id: 'casa_3', name: 'Casa Espaçosa', price: 3600, relax_extra: 10, health_bonus: 15, imagePath: '/game/casa/quartos/quarto_3.png' },
  { id: 'casa_4', name: 'Casa Premium', price: 5400, relax_extra: 15, health_bonus: 20, imagePath: '/game/casa/quartos/quarto_4.png' },
  { id: 'casa_5', name: 'Casa Luxo', price: 7200, relax_extra: 20, health_bonus: 25, imagePath: '/game/casa/quartos/quarto_5.png' },
];

export function getHouseStressReduction(house: HouseDef): number {
  return RELAX_BASE + house.relax_extra;
}

/** Escritórios em public/game/casa/escritorio/ — nomes de cidades. Preços 12×. Sala Tokyo já possuída (price 0). */
export const WORK_ROOMS: WorkRoomDef[] = [
  { id: 'sala_1', name: 'Sala Tokyo', price: 0, work_coins_extra: 0, work_health_extra: 0, imagePath: '/game/casa/escritorio/escritorio_1.png' },
  { id: 'sala_2', name: 'Sala Paris', price: 2400, work_coins_extra: 30, work_health_extra: -2, imagePath: '/game/casa/escritorio/escritorio_2.png' },
  { id: 'sala_3', name: 'Sala Londres', price: 4200, work_coins_extra: 50, work_health_extra: -3, imagePath: '/game/casa/escritorio/escritorio_3.png' },
  { id: 'sala_4', name: 'Sala Nova York', price: 6000, work_coins_extra: 70, work_health_extra: -4, imagePath: '/game/casa/escritorio/escritorio_6.png' },
  { id: 'sala_5', name: 'Sala Berlim', price: 7800, work_coins_extra: 90, work_health_extra: -5, imagePath: '/game/casa/escritorio/escritorio_7.png' },
  { id: 'sala_6', name: 'Sala Sydney', price: 9600, work_coins_extra: 110, work_health_extra: -6, imagePath: '/game/casa/escritorio/escritorio_8.png' },
];

const WORK_BONUS_COINS_BASE = 80;
const WORK_BONUS_HEALTH_COST_BASE = 10;

export function getWorkRoomCoinsReward(room: WorkRoomDef): number {
  return WORK_BONUS_COINS_BASE + room.work_coins_extra;
}

export function getWorkRoomHealthCost(room: WorkRoomDef): number {
  return Math.max(0, WORK_BONUS_HEALTH_COST_BASE + room.work_health_extra);
}

export const DEFAULT_HOUSE_ID = HOUSES[0].id;
export const DEFAULT_WORK_ROOM_ID = WORK_ROOMS[0].id;

export function getHouseById(id: string | null): HouseDef | undefined {
  return HOUSES.find((h) => h.id === (id ?? DEFAULT_HOUSE_ID));
}

export function getWorkRoomById(id: string | null): WorkRoomDef | undefined {
  return WORK_ROOMS.find((r) => r.id === (id ?? DEFAULT_WORK_ROOM_ID));
}
