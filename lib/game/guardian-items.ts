/**
 * Itens anti-stress dos Guardiões. Desbloqueados ao completar a missão fase 3 do avatar;
 * comprados na loja e equipados no slot "anti-stress". Bônus coerentes com capas e pets.
 */

export interface GuardianItemBonus {
  /** -X% de stress ao concluir atividades */
  stress_reduce_percent?: number;
  /** +X% XP ao concluir tarefas */
  xp_percent?: number;
  /** +X% moedas em pastas que dão moedas */
  coins_percent?: number;
}

export interface GuardianItemDef {
  id: string;
  name: string;
  /** Missão que desbloqueia (ex.: avatar_9_3 = completar as 3 missões da Luna) */
  unlockMissionId: string;
  price: number;
  /** Path do ícone (placeholder até ter design final) */
  imagePath: string;
  bonus: GuardianItemBonus;
  /** Ordem na loja */
  order: number;
}

/** 8 itens (sem exageros): um por arco ou destaque. Capas 2–5% anti-stress; pets 5–12%. Itens: 2–4%. */
export const GUARDIAN_ITEMS: GuardianItemDef[] = [
  {
    id: 'cristal_luna',
    name: 'Cristal de Potencial',
    unlockMissionId: 'avatar_9_3',
    price: 3000,
    imagePath: '/game/assets/placeholder-item.svg',
    bonus: { stress_reduce_percent: 2 },
    order: 1,
  },
  {
    id: 'medalha_kael',
    name: 'Medalha do Iniciante',
    unlockMissionId: 'avatar_1_3',
    price: 3500,
    imagePath: '/game/assets/placeholder-item.svg',
    bonus: { stress_reduce_percent: 2, xp_percent: 1 },
    order: 2,
  },
  {
    id: 'medalha_lyra',
    name: 'Medalha da Estrategista',
    unlockMissionId: 'avatar_2_3',
    price: 4000,
    imagePath: '/game/assets/placeholder-item.svg',
    bonus: { stress_reduce_percent: 3 },
    order: 3,
  },
  {
    id: 'medalha_thorne',
    name: 'Medalha do Intenso',
    unlockMissionId: 'avatar_3_3',
    price: 4000,
    imagePath: '/game/assets/placeholder-item.svg',
    bonus: { stress_reduce_percent: 2, coins_percent: 1 },
    order: 4,
  },
  {
    id: 'medalha_seraphina',
    name: 'Medalha Inquebrável',
    unlockMissionId: 'avatar_4_3',
    price: 4500,
    imagePath: '/game/assets/placeholder-item.svg',
    bonus: { stress_reduce_percent: 3 },
    order: 5,
  },
  {
    id: 'medalha_shadow',
    name: 'Medalha Eficiente',
    unlockMissionId: 'avatar_8_3',
    price: 5000,
    imagePath: '/game/assets/placeholder-item.svg',
    bonus: { stress_reduce_percent: 4 },
    order: 6,
  },
  {
    id: 'medalha_sylas',
    name: 'Medalha Versátil',
    unlockMissionId: 'avatar_15_3',
    price: 4500,
    imagePath: '/game/assets/placeholder-item.svg',
    bonus: { stress_reduce_percent: 2, xp_percent: 1 },
    order: 7,
  },
  {
    id: 'medalha_zen',
    name: 'Medalha Presente',
    unlockMissionId: 'avatar_29_3',
    price: 5000,
    imagePath: '/game/assets/placeholder-item.svg',
    bonus: { stress_reduce_percent: 3 },
    order: 8,
  },
];

export function getGuardianItemById(id: string | null): GuardianItemDef | undefined {
  if (!id) return undefined;
  return GUARDIAN_ITEMS.find((i) => i.id === id);
}

export function getGuardianItemBonus(id: string | null): GuardianItemBonus {
  const item = getGuardianItemById(id);
  return item?.bonus ?? {};
}

export function getGuardianItemsUnlockedByMission(completedMissionIds: string[]): string[] {
  const set = new Set(completedMissionIds);
  return GUARDIAN_ITEMS.filter((i) => set.has(i.unlockMissionId)).map((i) => i.id);
}
