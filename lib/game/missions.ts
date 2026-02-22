/**
 * Missões do Meu Mundo: requisitos e recompensas (desbloqueio de itens ou moedas).
 */

import type { ShopItemType } from './shop-catalog';

export type MissionReward =
  | { type: 'unlock_item'; item_type: ShopItemType; item_id: string }
  | { type: 'coins'; amount: number };

export interface MissionDef {
  id: string;
  name: string;
  description: string;
  /** Texto do requisito (exibido na UI) */
  requirement: string;
  reward: MissionReward;
  order: number;
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'agenda_3_dias',
    name: 'Agenda em ação',
    description: 'Use a agenda em 3 dias diferentes.',
    requirement: 'Conclua pelo menos 1 tarefa em 3 dias diferentes.',
    reward: { type: 'unlock_item', item_type: 'cover', item_id: 'capa2' },
    order: 1,
  },
  {
    id: 'primeiras_5_tarefas',
    name: 'Primeiras 5 tarefas',
    description: 'Complete 5 tarefas.',
    requirement: 'Marque 5 tarefas como concluídas na agenda.',
    reward: { type: 'unlock_item', item_type: 'avatar', item_id: 'personagem2' },
    order: 2,
  },
  {
    id: 'nivel_2',
    name: 'Subindo de nível',
    description: 'Atingir nível 2.',
    requirement: 'Ganhe XP concluindo tarefas até atingir o nível 2.',
    reward: { type: 'unlock_item', item_type: 'pet', item_id: 'pet2' },
    order: 3,
  },
  {
    id: 'cem_moedas',
    name: 'Primeiras 500 moedas',
    description: 'Acumule 500 moedas.',
    requirement: 'Junte 500 moedas no Meu Mundo (tarefas e ações diárias).',
    reward: { type: 'unlock_item', item_type: 'cover', item_id: 'capa3' },
    order: 4,
  },
  {
    id: 'dez_tarefas',
    name: 'Dez tarefas',
    description: 'Complete 10 tarefas.',
    requirement: 'Marque 10 tarefas como concluídas na agenda.',
    reward: { type: 'unlock_item', item_type: 'avatar', item_id: 'personagem3' },
    order: 5,
  },
  {
    id: 'nivel_3',
    name: 'Nível 3',
    description: 'Atingir nível 3.',
    requirement: 'Ganhe XP até atingir o nível 3.',
    reward: { type: 'unlock_item', item_type: 'avatar', item_id: 'personagem5' },
    order: 6,
  },
  {
    id: 'vinte_tarefas',
    name: 'Vinte tarefas',
    description: 'Complete 20 tarefas.',
    requirement: 'Marque 20 tarefas como concluídas na agenda.',
    reward: { type: 'unlock_item', item_type: 'avatar', item_id: 'personagem10' },
    order: 7,
  },
];

export function getMissionById(id: string): MissionDef | undefined {
  return MISSIONS.find((m) => m.id === id);
}
