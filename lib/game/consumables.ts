/**
 * Consumíveis da loja: Comida/Bebida Favorita I e II.
 * Efeito por uso (1x por dia, não acumulativo). Máx. 2 em estoque por usuário.
 */

export type ConsumableEffect = 'health_restore_percent' | 'stress_reduce_percent';

export interface ConsumableDef {
  id: string;
  name: string;
  price: number;
  /** Ícone placeholder; substituir depois pelo asset final. */
  imagePath: string;
  /** +X% vida (por uso/dia) */
  health_restore_percent?: number;
  /** -X% stress (por uso/dia) */
  stress_reduce_percent?: number;
  /** Máximo que o usuário pode ter em estoque (não acumulativo = 2). */
  maxStock: number;
  order: number;
}

export const CONSUMABLES: ConsumableDef[] = [
  {
    id: 'comida_favorita_i',
    name: 'Comida Favorita I',
    price: 250,
    imagePath: '/game/assets/placeholder-item.svg',
    health_restore_percent: 20,
    maxStock: 2,
    order: 1,
  },
  {
    id: 'bebida_favorita_i',
    name: 'Bebida Favorita I',
    price: 450,
    imagePath: '/game/assets/placeholder-item.svg',
    stress_reduce_percent: 20,
    maxStock: 2,
    order: 2,
  },
  {
    id: 'comida_favorita_ii',
    name: 'Comida Favorita II',
    price: 450,
    imagePath: '/game/assets/placeholder-item.svg',
    health_restore_percent: 20,
    maxStock: 2,
    order: 3,
  },
  {
    id: 'bebida_favorita_ii',
    name: 'Bebida Favorita II',
    price: 450,
    imagePath: '/game/assets/placeholder-item.svg',
    stress_reduce_percent: 20,
    maxStock: 2,
    order: 4,
  },
];

export function getConsumableById(id: string | null): ConsumableDef | undefined {
  if (!id) return undefined;
  return CONSUMABLES.find((c) => c.id === id);
}
