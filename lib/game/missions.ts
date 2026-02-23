/**
 * Missões do Meu Mundo: requisitos e recompensas (moedas, desbloqueio de avatar, título de conquista).
 */

import {
  getAvatarMissionsData,
  getAvatarMissionId,
  getAvatarUnlockId,
  getTitleBadgeId,
  getPreviousAvatarInStoryline,
} from './avatar-missions-data';
import { getArcByAvatarIndex } from './storyline-arcs';
import { PROFILE_AVATARS } from './profile-avatars';

export type MissionReward = {
  type: 'coins';
  amount: number;
  /** Desbloqueia este avatar ao completar a missão (ex.: personagem1). */
  avatarUnlockId?: string;
  /** Concede esta medalha/título no mural de conquistas (ex.: titulo_kael). */
  badgeId?: string;
};

export type MissionDifficulty = 'easy' | 'medium' | 'hard';

export interface MissionDef {
  id: string;
  name: string;
  description: string;
  /** Texto do requisito (exibido na UI) */
  requirement: string;
  reward: MissionReward;
  order: number;
  /** Dificuldade (missões de avatar). */
  difficulty?: MissionDifficulty;
  /** Arco da história (missões de avatar). */
  arcId?: string;
  arcName?: string;
  arcStory?: string;
}

/** 7 missões iniciais. */
const STARTER_MISSIONS: MissionDef[] = [
  {
    id: 'agenda_3_dias',
    name: 'Agenda em ação',
    description: 'Use a agenda em 3 dias diferentes.',
    requirement: 'Conclua pelo menos 1 tarefa em 3 dias diferentes.',
    reward: { type: 'coins', amount: 80 },
    order: 1,
  },
  {
    id: 'primeiras_5_tarefas',
    name: 'Primeiras 5 tarefas',
    description: 'Complete 5 tarefas na agenda.',
    requirement: 'Marque 5 tarefas como concluídas.',
    reward: { type: 'coins', amount: 120 },
    order: 2,
  },
  {
    id: 'nivel_2',
    name: 'Subindo de nível',
    description: 'Atingir nível 2 no Meu Mundo.',
    requirement: 'Ganhe XP concluindo tarefas até atingir o nível 2.',
    reward: { type: 'coins', amount: 150 },
    order: 3,
  },
  {
    id: 'cem_moedas',
    name: 'Primeira economia',
    description: 'Acumule 500 moedas.',
    requirement: 'Junte 500 moedas (tarefas e ações diárias).',
    reward: { type: 'coins', amount: 200 },
    order: 4,
  },
  {
    id: 'dez_tarefas',
    name: 'Dez tarefas',
    description: 'Complete 10 tarefas.',
    requirement: 'Marque 10 tarefas como concluídas na agenda.',
    reward: { type: 'coins', amount: 250 },
    order: 5,
  },
  {
    id: 'nivel_3',
    name: 'Nível 3',
    description: 'Atingir nível 3 no Meu Mundo.',
    requirement: 'Ganhe XP até atingir o nível 3.',
    reward: { type: 'coins', amount: 350 },
    order: 6,
  },
  {
    id: 'vinte_tarefas',
    name: 'Vinte tarefas',
    description: 'Complete 20 tarefas.',
    requirement: 'Marque 20 tarefas como concluídas na agenda.',
    reward: { type: 'coins', amount: 500 },
    order: 7,
  },
];

/** Missões de avatar (34 × 3 = 102): moedas + desbloqueio (fase 1) + título (fase 3). */
function buildAvatarMissions(): MissionDef[] {
  const data = getAvatarMissionsData();
  return data.map((row, idx) => {
    const id = getAvatarMissionId(row.avatarIndex, row.phase);
    const reward: MissionReward = {
      type: 'coins',
      amount: row.coins,
    };
    if (row.phase === 1) reward.avatarUnlockId = getAvatarUnlockId(row.avatarIndex);
    if (row.phase === 3) reward.badgeId = getTitleBadgeId(row.avatarIndex);
    const arc = getArcByAvatarIndex(row.avatarIndex);
    return {
      id,
      name: row.name,
      description: row.description,
      requirement: row.requirement,
      reward,
      order: 100 + idx,
      difficulty: row.difficulty,
      ...(arc && { arcId: arc.id, arcName: arc.name, arcStory: arc.story }),
    };
  });
}

export const MISSIONS: MissionDef[] = [...STARTER_MISSIONS, ...buildAvatarMissions()];

export function getMissionById(id: string): MissionDef | undefined {
  return MISSIONS.find((m) => m.id === id);
}

/** Retorna o id do avatar desbloqueado por esta missão, se houver. */
export function getMissionAvatarUnlock(missionId: string): string | undefined {
  return getMissionById(missionId)?.reward?.avatarUnlockId;
}

/** Retorna o id da medalha concedida por esta missão, se houver. */
export function getMissionBadgeReward(missionId: string): string | undefined {
  return getMissionById(missionId)?.reward?.badgeId;
}

/** Retorna o id da missão que desbloqueia este avatar (ex.: personagem5 → avatar_5_1). */
export function getMissionIdThatUnlocksAvatar(avatarId: string): string | undefined {
  const m = /^personagem(\d+)$/.exec(avatarId);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  if (n < 1 || n > 34) return undefined;
  return `avatar_${n}_1`;
}

/** Resumo para a loja: missão que desbloqueia e, se houver, o personagem anterior na storyline (arco a completar antes). */
export function getAvatarUnlockSummary(avatarId: string): {
  missionName: string;
  requirement: string;
  previousAvatarName: string | null;
} | null {
  const missionId = getMissionIdThatUnlocksAvatar(avatarId);
  if (!missionId) return null;
  const mission = getMissionById(missionId);
  if (!mission) return null;
  const m = /^personagem(\d+)$/.exec(avatarId);
  const avatarIndex = m ? parseInt(m[1], 10) : 0;
  const prevIndex = getPreviousAvatarInStoryline(avatarIndex);
  const previousAvatarName =
    prevIndex != null ? (PROFILE_AVATARS.find((a) => a.id === `personagem${prevIndex}`)?.name ?? null) : null;
  return {
    missionName: mission.name,
    requirement: mission.requirement,
    previousAvatarName,
  };
}
