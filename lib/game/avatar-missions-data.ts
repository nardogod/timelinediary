/**
 * Dados das 102 missões de avatar (34 personagens × 3 fases).
 * Recompensas: moedas + desbloqueio de avatar (fase 1) + título de conquista (fase 3).
 *
 * STORYLINE: ordem cronológica de desbloqueio. Ninguém desbloqueia um avatar sem antes completar
 * as 3 missões do personagem anterior na história. Luna (9) é o início; depois Guerreiro 1–7,
 * Sombra 8,10–14, Natureza 15–21, Tecnologia 22–28, Mística 29–34.
 */

/** Ordem da história: primeiro avatar = Luna (9), depois os demais. Para desbloquear o próximo, complete as 3 missões do anterior. */
export const AVATAR_STORYLINE_ORDER: number[] = [
  9,   // Luna — início (já disponível)
  1, 2, 3, 4, 5, 6, 7,   // Guerreiro: Kael → Lyra → Thorne → Seraphina → Ragnar → Elara → Magnus
  8, 10, 11, 12, 13, 14,  // Sombra: Shadow → Draven → Vex → Raven → Zane → Nyx
  15, 16, 17, 18, 19, 20, 21,  // Natureza: Sylas → Fenrir → Aurora → Thorn → Ember → Tide → Gale
  22, 23, 24, 25, 26, 27, 28,  // Tecnologia: Neo → Pixel → Glitch → Spark → Byte → Data → Nova
  29, 30, 31, 32, 33, 34,  // Mística: Zen → Spirit → Oracle → Phantom → Titan → Eternal
];

/** Índice do avatar anterior na storyline (1..34), ou null se for o primeiro (Luna). */
export function getPreviousAvatarInStoryline(avatarIndex: number): number | null {
  const idx = AVATAR_STORYLINE_ORDER.indexOf(avatarIndex);
  if (idx <= 0) return null;
  return AVATAR_STORYLINE_ORDER[idx - 1] ?? null;
}

/** Nomes dos avatares por índice 1..34. */
const NAMES = [
  'Kael', 'Lyra', 'Thorne', 'Seraphina', 'Ragnar', 'Elara', 'Magnus',
  'Shadow', 'Luna', 'Draven', 'Vex', 'Raven', 'Zane', 'Nyx',
  'Sylas', 'Fenrir', 'Aurora', 'Thorn', 'Ember', 'Tide', 'Gale',
  'Neo', 'Pixel', 'Glitch', 'Spark', 'Byte', 'Data', 'Nova',
  'Zen', 'Spirit', 'Oracle', 'Phantom', 'Titan', 'Eternal',
];

/** IDs dos títulos (medalhas) de forma final, por avatar 1..34. */
const TITLE_BADGE_IDS = [
  'titulo_kael', 'titulo_lyra', 'titulo_thorne', 'titulo_seraphina', 'titulo_ragnar', 'titulo_elara', 'titulo_magnus',
  'titulo_shadow', 'titulo_luna', 'titulo_draven', 'titulo_vex', 'titulo_raven', 'titulo_zane', 'titulo_nyx',
  'titulo_sylas', 'titulo_fenrir', 'titulo_aurora', 'titulo_thorn', 'titulo_ember', 'titulo_tide', 'titulo_gale',
  'titulo_neo', 'titulo_pixel', 'titulo_glitch', 'titulo_spark', 'titulo_byte', 'titulo_data', 'titulo_nova',
  'titulo_zen', 'titulo_spirit', 'titulo_oracle', 'titulo_phantom', 'titulo_titan', 'titulo_eternal',
];

import type { DifficultyLevel } from './storyline-arcs';

export type AvatarMissionPhase = 1 | 2 | 3;

export type FolderTypeMission = 'trabalho' | 'estudos';

export interface AvatarMissionRequirement {
  kind:
    | 'total_tasks'
    | 'distinct_days'
    | 'total_and_days'
    | 'total_and_level'
    | 'streak_days'
    | 'events_with_link'
    | 'distinct_folders'
    | 'total_and_folders'
    | 'tasks_by_folder_type'
    | 'max_tasks_one_day'
    | 'total_and_streak'
    | 'coins'
    | 'level'
    | 'total_tasks_and_level'
    | 'distinct_days_and_level'
    | 'total_and_distinct_folders';
  totalTasks?: number;
  distinctDays?: number;
  level?: number;
  streakDays?: number;
  eventsWithLink?: number;
  distinctFolders?: number;
  /** Exige N tarefas em pastas do tipo folderType (trabalho ou estudos). */
  tasksByFolderType?: number;
  folderType?: FolderTypeMission;
  maxTasksOneDay?: number;
  coins?: number;
}

export interface AvatarMissionRow {
  avatarIndex: number;
  phase: AvatarMissionPhase;
  name: string;
  description: string;
  requirement: string;
  coins: number;
  requirementCheck: AvatarMissionRequirement;
  difficulty: DifficultyLevel;
}

function row(
  avatarIndex: number,
  phase: AvatarMissionPhase,
  name: string,
  description: string,
  requirement: string,
  coins: number,
  requirementCheck: AvatarMissionRequirement,
  difficulty: DifficultyLevel
): AvatarMissionRow {
  return { avatarIndex, phase, name, description, requirement, coins, requirementCheck, difficulty };
}

/** Gera as 102 linhas de missão (34 × 3). Requisitos adaptados ao que conseguimos medir. */
export function getAvatarMissionsData(): AvatarMissionRow[] {
  const N = NAMES;
  const out: AvatarMissionRow[] = [];
  let i = 0;
  const E = 'easy' as const;
  const M = 'medium' as const;
  const H = 'hard' as const;
  // 1 Kael
  out.push(row(1, 1, 'Primeiro Sangue', 'Complete 3 tarefas em um dia.', 'Conclua 3 tarefas em um único dia.', 80, { kind: 'max_tasks_one_day', maxTasksOneDay: 3 }, E));
  out.push(row(1, 2, 'Veterano de Guerra', '15 tarefas em 7 dias diferentes.', 'Conclua 15 tarefas em pelo menos 7 dias diferentes.', 200, { kind: 'total_and_days', totalTasks: 15, distinctDays: 7 }, M));
  out.push(row(1, 3, 'Lenda Viva', '50 tarefas e nível 5.', 'Conclua 50 tarefas e atinja o nível 5.', 500, { kind: 'total_tasks_and_level', totalTasks: 50, level: 5 }, H));
  // 2 Lyra
  out.push(row(2, 1, 'Mente Brilhante', '5 eventos com links.', 'Crie 5 eventos na timeline com link.', 90, { kind: 'events_with_link', eventsWithLink: 5 }, E));
  out.push(row(2, 2, 'Mestre dos Planos', '20 tarefas em pastas diferentes.', 'Conclua tarefas em pelo menos 5 pastas diferentes (20 tarefas no total).', 220, { kind: 'total_and_folders', totalTasks: 20, distinctFolders: 5 }, M));
  out.push(row(2, 3, 'Grande General', 'Nível 6 e 100 tarefas.', 'Atinja o nível 6 e conclua 100 tarefas.', 600, { kind: 'total_tasks_and_level', totalTasks: 100, level: 6 }, H));
  // 3 Thorne
  out.push(row(3, 1, 'Ira Controlada', '5 tarefas de trabalho.', 'Conclua 5 tarefas em pasta de tipo Trabalho.', 100, { kind: 'tasks_by_folder_type', tasksByFolderType: 5, folderType: 'trabalho' }, E));
  out.push(row(3, 2, 'Fúria Berserker', '10 tarefas em um dia.', 'Conclua 10 tarefas em um único dia (maratona).', 250, { kind: 'max_tasks_one_day', maxTasksOneDay: 10 }, M));
  out.push(row(3, 3, 'Rei das Batalhas', 'Nível 7 e 200 tarefas.', 'Atinja o nível 7 e conclua 200 tarefas.', 700, { kind: 'total_tasks_and_level', totalTasks: 200, level: 7 }, H));
  // 4 Seraphina
  out.push(row(4, 1, 'Juramento de Luz', '7 dias seguidos com tarefas.', 'Conclua pelo menos 1 tarefa por dia durante 7 dias consecutivos.', 110, { kind: 'streak_days', streakDays: 7 }, M));
  out.push(row(4, 2, 'Guardiã da Virtude', '30 tarefas sem quebrar o streak.', 'Mantenha sequência de dias e conclua 30 tarefas no total.', 280, { kind: 'total_and_streak', totalTasks: 30, streakDays: 7 }, M));
  out.push(row(4, 3, 'Anjo da Justiça', 'Nível 8 e 300 tarefas.', 'Atinja o nível 8 e conclua 300 tarefas.', 800, { kind: 'total_tasks_and_level', totalTasks: 300, level: 8 }, H));
  // 5 Ragnar
  out.push(row(5, 1, 'Primeira Navegação', '3 eventos com links.', 'Crie 3 eventos na timeline com link.', 95, { kind: 'events_with_link', eventsWithLink: 3 }, E));
  out.push(row(5, 2, 'Conquistador de Terras', '15 tarefas em 5 dias.', 'Conclua 15 tarefas em pelo menos 5 dias diferentes.', 240, { kind: 'total_and_days', totalTasks: 15, distinctDays: 5 }, M));
  out.push(row(5, 3, 'Rei do Norte', 'Nível 7 e 80 tarefas.', 'Atinja o nível 7 e conclua 80 tarefas.', 650, { kind: 'total_tasks_and_level', totalTasks: 80, level: 7 }, H));
  // 6 Elara
  out.push(row(6, 1, 'Primeiro Alvo', '5 tarefas em dias diferentes.', 'Conclua 5 tarefas em pelo menos 3 dias diferentes.', 85, { kind: 'total_and_days', totalTasks: 5, distinctDays: 3 }, E));
  out.push(row(6, 2, 'Atiradora de Elite', '25 tarefas.', 'Conclua 25 tarefas.', 210, { kind: 'total_tasks', totalTasks: 25 }, M));
  out.push(row(6, 3, 'Caçadora Lendária', 'Nível 6 e 150 tarefas.', 'Atinja o nível 6 e conclua 150 tarefas.', 550, { kind: 'total_tasks_and_level', totalTasks: 150, level: 6 }, H));
  // 7 Magnus
  out.push(row(7, 1, 'Primeiro Feitiço', '5 tarefas em pasta Estudos.', 'Conclua 5 tarefas em pasta do tipo Estudos.', 90, { kind: 'tasks_by_folder_type', tasksByFolderType: 5, folderType: 'estudos' }, E));
  out.push(row(7, 2, 'Arquimago', 'Acumule 2000 moedas.', 'Junte 2000 moedas no total.', 230, { kind: 'coins', coins: 2000 }, M));
  out.push(row(7, 3, 'Mago Supremo', 'Nível 8 e 120 tarefas.', 'Atinja o nível 8 e conclua 120 tarefas.', 600, { kind: 'total_tasks_and_level', totalTasks: 120, level: 8 }, H));
  // 8 Shadow
  out.push(row(8, 1, 'Primeira Eliminação', '5 tarefas em um dia.', 'Conclua 5 tarefas em um único dia.', 120, { kind: 'max_tasks_one_day', maxTasksOneDay: 5 }, E));
  out.push(row(8, 2, 'Sombra Mortal', '20 tarefas em 5 dias.', 'Conclua 20 tarefas em pelo menos 5 dias diferentes.', 300, { kind: 'total_and_days', totalTasks: 20, distinctDays: 5 }, M));
  out.push(row(8, 3, 'Mestre Assassino', 'Nível 7 e 100 tarefas.', 'Atinja o nível 7 e conclua 100 tarefas.', 750, { kind: 'total_tasks_and_level', totalTasks: 100, level: 7 }, H));
  // 9 Luna (Prelúdio — um pouco mais leve no fim)
  // Luna — A Guia (Prelúdio): Primeira Luz, Caminho Iluminado, Porta Aberta
  out.push(row(9, 1, 'Primeira Luz', '10 tarefas em 3 pastas.', 'Acenda a chama: conclua 10 tarefas em pelo menos 3 pastas diferentes.', 100, { kind: 'total_and_folders', totalTasks: 10, distinctFolders: 3 }, E));
  out.push(row(9, 2, 'Caminho Iluminado', '50 tarefas em 8 pastas.', 'Mantenha a tocha acesa: conclua 50 tarefas em 8 pastas diferentes.', 260, { kind: 'total_and_folders', totalTasks: 50, distinctFolders: 8 }, M));
  out.push(row(9, 3, 'Porta Aberta', 'Nível 6 e 60 tarefas.', 'Prove que está pronto para a Ordem: nível 6 e 60 tarefas concluídas.', 650, { kind: 'total_tasks_and_level', totalTasks: 60, level: 6 }, M));
  // 10 Draven
  out.push(row(10, 1, 'Primeira Ressurreição', '5 tarefas em 3 dias.', 'Conclua 5 tarefas em dias diferentes (reativar o hábito).', 110, { kind: 'total_and_days', totalTasks: 5, distinctDays: 3 }, E));
  out.push(row(10, 2, 'Senhor dos Mortos', '30 tarefas.', 'Conclua 30 tarefas.', 280, { kind: 'total_tasks', totalTasks: 30 }, M));
  out.push(row(10, 3, 'Lich Supremo', 'Nível 8 e 200 tarefas.', 'Atinja o nível 8 e conclua 200 tarefas.', 700, { kind: 'total_tasks_and_level', totalTasks: 200, level: 8 }, H));
  // 11 Vex
  out.push(row(11, 1, 'Primeira Ilusão', '5 tarefas em 3 pastas.', 'Conclua 5 tarefas em 3 categorias (pastas) diferentes.', 95, { kind: 'distinct_folders', distinctFolders: 3 }, E));
  out.push(row(11, 2, 'Mestre das Máscaras', '20 tarefas em 5 pastas.', 'Conclua 20 tarefas em 5 pastas diferentes.', 240, { kind: 'total_and_folders', totalTasks: 20, distinctFolders: 5 }, M));
  out.push(row(11, 3, 'Arquiteta de Sonhos', 'Nível 7 e 50 tarefas em 5 pastas.', 'Nível 7 e 50 tarefas em 5 pastas diferentes.', 620, { kind: 'total_and_distinct_folders', totalTasks: 50, distinctFolders: 5, level: 7 }, H));
  // 12 Raven
  out.push(row(12, 1, 'Primeira Recompensa', '5 tarefas de trabalho.', 'Conclua 5 tarefas em pasta Trabalho.', 105, { kind: 'tasks_by_folder_type', tasksByFolderType: 5, folderType: 'trabalho' }, E));
  out.push(row(12, 2, 'Caçadora Profissional', '25 tarefas em 5 dias.', 'Conclua 25 tarefas em 5 dias diferentes.', 270, { kind: 'total_and_days', totalTasks: 25, distinctDays: 5 }, M));
  out.push(row(12, 3, 'Lenda dos Caçadores', 'Nível 6 e 100 tarefas.', 'Atinja o nível 6 e conclua 100 tarefas.', 680, { kind: 'total_tasks_and_level', totalTasks: 100, level: 6 }, H));
  // 13 Zane
  out.push(row(13, 1, 'Primeiro Duelo', '5 tarefas em um dia.', 'Conclua 5 tarefas em um único dia.', 115, { kind: 'max_tasks_one_day', maxTasksOneDay: 5 }, E));
  out.push(row(13, 2, 'Mestre da Lâmina', '20 tarefas em 4 dias.', 'Conclua 20 tarefas em 4 dias diferentes.', 290, { kind: 'total_and_days', totalTasks: 20, distinctDays: 4 }, M));
  out.push(row(13, 3, 'Deus da Espada', 'Nível 7 e 80 tarefas.', 'Atinja o nível 7 e conclua 80 tarefas.', 720, { kind: 'total_tasks_and_level', totalTasks: 80, level: 7 }, H));
  // 14 Nyx
  out.push(row(14, 1, 'Primeira Noite', '5 tarefas em 3 dias.', 'Conclua 5 tarefas em 3 dias diferentes.', 100, { kind: 'total_and_days', totalTasks: 5, distinctDays: 3 }, E));
  out.push(row(14, 2, 'Rainha da Noite', '30 tarefas.', 'Conclua 30 tarefas.', 250, { kind: 'total_tasks', totalTasks: 30 }, M));
  out.push(row(14, 3, 'Deusa das Trevas', 'Nível 8 e 100 tarefas.', 'Atinja o nível 8 e conclua 100 tarefas.', 650, { kind: 'total_tasks_and_level', totalTasks: 100, level: 8 }, H));
  // 15 Sylas – 21 Gale
  out.push(row(15, 1, 'Primeira Transformação', 'Tarefas em 3 categorias.', 'Conclua tarefas em 3 pastas (tipos) diferentes.', 90, { kind: 'distinct_folders', distinctFolders: 3 }, E));
  out.push(row(15, 2, 'Guardião da Floresta', '20 tarefas em 5 pastas.', 'Conclua 20 tarefas em 5 pastas diferentes.', 220, { kind: 'total_and_folders', totalTasks: 20, distinctFolders: 5 }, M));
  out.push(row(15, 3, 'Arquidruida', 'Nível 7 e 100 tarefas em 5 pastas.', 'Nível 7 e 100 tarefas em 5 pastas diferentes.', 580, { kind: 'total_and_distinct_folders', totalTasks: 100, distinctFolders: 5, level: 7 }, H));
  out.push(row(16, 1, 'Primeira Caçada', '8 tarefas em um dia.', 'Conclua 8 tarefas em um único dia.', 110, { kind: 'max_tasks_one_day', maxTasksOneDay: 8 }, M));
  out.push(row(16, 2, 'Alfa da Alcateia', '20 tarefas e 4 dias seguidos.', 'Conclua 20 tarefas e mantenha 4 dias consecutivos.', 280, { kind: 'total_and_streak', totalTasks: 20, streakDays: 4 }, M));
  out.push(row(16, 3, 'Lobo Lendário', 'Nível 6 e 150 tarefas.', 'Atinja o nível 6 e conclua 150 tarefas.', 700, { kind: 'total_tasks_and_level', totalTasks: 150, level: 6 }, H));
  out.push(row(17, 1, 'Primeiro Encanto', '5 eventos com links.', 'Crie 5 eventos com link na timeline.', 95, { kind: 'events_with_link', eventsWithLink: 5 }, E));
  out.push(row(17, 2, 'Dama da Corte Élfica', '25 tarefas em 5 dias.', 'Conclua 25 tarefas em 5 dias diferentes.', 240, { kind: 'total_and_days', totalTasks: 25, distinctDays: 5 }, M));
  out.push(row(17, 3, 'Rainha das Fadas', 'Nível 7 e 80 tarefas.', 'Atinja o nível 7 e conclua 80 tarefas.', 620, { kind: 'total_tasks_and_level', totalTasks: 80, level: 7 }, H));
  out.push(row(18, 1, 'Primeiras Raízes', '5 tarefas em 3 dias.', 'Conclua 5 tarefas em 3 dias diferentes.', 85, { kind: 'total_and_days', totalTasks: 5, distinctDays: 3 }, E));
  out.push(row(18, 2, 'Guardião Ancião', '30 tarefas em 7 dias.', 'Conclua 30 tarefas em 7 dias diferentes.', 210, { kind: 'total_and_days', totalTasks: 30, distinctDays: 7 }, M));
  out.push(row(18, 3, 'World Tree', 'Nível 8 e 50 tarefas.', 'Atinja o nível 8 e conclua 50 tarefas.', 550, { kind: 'total_tasks_and_level', totalTasks: 50, level: 8 }, H));
  out.push(row(19, 1, 'Primeira Chama', '5 tarefas em 3 dias.', 'Conclua 5 tarefas em 3 dias diferentes (recomeçar).', 100, { kind: 'total_and_days', totalTasks: 5, distinctDays: 3 }, E));
  out.push(row(19, 2, 'Ave de Fogo', '20 tarefas em 5 dias.', 'Conclua 20 tarefas em 5 dias diferentes.', 260, { kind: 'total_and_days', totalTasks: 20, distinctDays: 5 }, M));
  out.push(row(19, 3, 'Fênix Imortal', 'Nível 7 e 100 tarefas.', 'Atinja o nível 7 e conclua 100 tarefas.', 680, { kind: 'total_tasks_and_level', totalTasks: 100, level: 7 }, H));
  out.push(row(20, 1, 'Primeira Onda', '5 tarefas em 3 pastas.', 'Conclua tarefas em 3 pastas diferentes.', 90, { kind: 'distinct_folders', distinctFolders: 3 }, E));
  out.push(row(20, 2, 'Rei dos Mares', '30 tarefas em 5 pastas.', 'Conclua 30 tarefas em 5 pastas diferentes.', 230, { kind: 'total_and_folders', totalTasks: 30, distinctFolders: 5 }, M));
  out.push(row(20, 3, 'Deus Oceânico', 'Nível 6 e 100 tarefas.', 'Atinja o nível 6 e conclua 100 tarefas.', 600, { kind: 'total_tasks_and_level', totalTasks: 100, level: 6 }, H));
  out.push(row(21, 1, 'Primeira Brisa', '5 tarefas em um dia.', 'Conclua 5 tarefas em um único dia.', 95, { kind: 'max_tasks_one_day', maxTasksOneDay: 5 }, E));
  out.push(row(21, 2, 'Mestre dos Ventos', '40 tarefas em 7 dias.', 'Conclua 40 tarefas em 7 dias diferentes.', 250, { kind: 'total_and_days', totalTasks: 40, distinctDays: 7 }, M));
  out.push(row(21, 3, 'Deus do Ar', 'Nível 7 e 90 tarefas.', 'Atinja o nível 7 e conclua 90 tarefas.', 640, { kind: 'total_tasks_and_level', totalTasks: 90, level: 7 }, H));
  // 22 Neo – 28 Nova
  out.push(row(22, 1, 'Primeira Upgrade', '10 tarefas em 3 dias.', 'Conclua 10 tarefas em 3 dias diferentes.', 100, { kind: 'total_and_days', totalTasks: 10, distinctDays: 3 }, M));
  out.push(row(22, 2, 'Máquina Perfeita', '50 tarefas em 10 dias.', 'Conclua 50 tarefas em 10 dias diferentes.', 280, { kind: 'total_and_days', totalTasks: 50, distinctDays: 10 }, M));
  out.push(row(22, 3, 'Singularidade', 'Nível 8 e 200 tarefas.', 'Atinja o nível 8 e conclua 200 tarefas.', 750, { kind: 'total_tasks_and_level', totalTasks: 200, level: 8 }, H));
  out.push(row(23, 1, 'Primeiro Algoritmo', '5 eventos com links.', 'Crie 5 eventos com link.', 110, { kind: 'events_with_link', eventsWithLink: 5 }, E));
  out.push(row(23, 2, 'Rede Neural', '60 tarefas em 10 dias.', 'Conclua 60 tarefas em 10 dias diferentes.', 300, { kind: 'total_and_days', totalTasks: 60, distinctDays: 10 }, M));
  out.push(row(23, 3, 'Superinteligência', 'Nível 9 e 150 tarefas.', 'Atinja o nível 9 e conclua 150 tarefas.', 800, { kind: 'total_tasks_and_level', totalTasks: 150, level: 9 }, H));
  out.push(row(24, 1, 'Primeiro Hack', '5 tarefas em um dia.', 'Conclua 5 tarefas em um único dia.', 120, { kind: 'max_tasks_one_day', maxTasksOneDay: 5 }, M));
  out.push(row(24, 2, 'Mestre do Código', '30 tarefas em 6 pastas.', 'Conclua 30 tarefas em 6 pastas diferentes.', 320, { kind: 'total_and_folders', totalTasks: 30, distinctFolders: 6 }, M));
  out.push(row(24, 3, 'Deus da Matrix', 'Nível 8 e 120 tarefas.', 'Atinja o nível 8 e conclua 120 tarefas.', 850, { kind: 'total_tasks_and_level', totalTasks: 120, level: 8 }, H));
  out.push(row(25, 1, 'Primeira Invenção', '10 tarefas em 3 pastas.', 'Conclua 10 tarefas em 3 pastas diferentes.', 95, { kind: 'total_and_folders', totalTasks: 10, distinctFolders: 3 }, E));
  out.push(row(25, 2, 'Mestre da Construção', '40 tarefas em 6 pastas.', 'Conclua 40 tarefas em 6 pastas diferentes.', 250, { kind: 'total_and_folders', totalTasks: 40, distinctFolders: 6 }, M));
  out.push(row(25, 3, 'Arquiteta do Futuro', 'Nível 7 e 100 tarefas.', 'Atinja o nível 7 e conclua 100 tarefas.', 680, { kind: 'total_tasks_and_level', totalTasks: 100, level: 7 }, H));
  out.push(row(26, 1, 'Primeiro Programa', '5 tarefas em 3 dias.', 'Conclua 5 tarefas em 3 dias diferentes.', 90, { kind: 'total_and_days', totalTasks: 5, distinctDays: 3 }, E));
  out.push(row(26, 2, 'Automação Total', '35 tarefas em 7 dias.', 'Conclua 35 tarefas em 7 dias diferentes.', 240, { kind: 'total_and_days', totalTasks: 35, distinctDays: 7 }, M));
  out.push(row(26, 3, 'Andróide Perfeito', 'Nível 6 e 80 tarefas.', 'Atinja o nível 6 e conclua 80 tarefas.', 620, { kind: 'total_tasks_and_level', totalTasks: 80, level: 6 }, H));
  out.push(row(27, 1, 'Primeira Análise', '5 tarefas em 3 dias.', 'Conclua 5 tarefas em 3 dias diferentes.', 85, { kind: 'total_and_days', totalTasks: 5, distinctDays: 3 }, E));
  out.push(row(27, 2, 'Mestre dos Dados', '50 tarefas em 10 dias.', 'Conclua 50 tarefas em 10 dias diferentes.', 220, { kind: 'total_and_days', totalTasks: 50, distinctDays: 10 }, M));
  out.push(row(27, 3, 'Grande Teórico', 'Nível 8 e 100 tarefas.', 'Atinja o nível 8 e conclua 100 tarefas.', 600, { kind: 'total_tasks_and_level', totalTasks: 100, level: 8 }, H));
  out.push(row(28, 1, 'Primeiro Lançamento', '5 tarefas em 3 pastas.', 'Conclua tarefas em 3 pastas diferentes.', 100, { kind: 'distinct_folders', distinctFolders: 3 }, E));
  out.push(row(28, 2, 'Exploradora Espacial', '30 tarefas em 6 pastas.', 'Conclua 30 tarefas em 6 pastas diferentes.', 270, { kind: 'total_and_folders', totalTasks: 30, distinctFolders: 6 }, M));
  out.push(row(28, 3, 'Comandante da Estação', 'Nível 9 e 120 tarefas.', 'Atinja o nível 9 e conclua 120 tarefas.', 720, { kind: 'total_tasks_and_level', totalTasks: 120, level: 9 }, H));
  // 29 Zen – 34 Eternal (Zen fase 2 e 3 calibrados)
  out.push(row(29, 1, 'Primeira Meditação', '5 tarefas em 3 dias.', 'Conclua 5 tarefas em 3 dias diferentes.', 80, { kind: 'total_and_days', totalTasks: 5, distinctDays: 3 }, E));
  out.push(row(29, 2, 'Mestre Espiritual', '14 dias de streak.', 'Mantenha 14 dias consecutivos com pelo menos 1 tarefa.', 200, { kind: 'streak_days', streakDays: 14 }, H));
  out.push(row(29, 3, 'Buda Iluminado', 'Nível 10 e 400 tarefas.', 'Atinja o nível 10 e conclua 400 tarefas.', 900, { kind: 'total_tasks_and_level', totalTasks: 400, level: 10 }, H));
  out.push(row(30, 1, 'Primeiro Ritual', '5 tarefas em 3 pastas.', 'Conclua tarefas em 3 pastas diferentes.', 90, { kind: 'distinct_folders', distinctFolders: 3 }, E));
  out.push(row(30, 2, 'Andarilho Astral', '40 tarefas em 7 dias.', 'Conclua 40 tarefas em 7 dias diferentes.', 240, { kind: 'total_and_days', totalTasks: 40, distinctDays: 7 }, M));
  out.push(row(30, 3, 'Grande Xamã', 'Nível 8 e 150 tarefas.', 'Atinja o nível 8 e conclua 150 tarefas.', 700, { kind: 'total_tasks_and_level', totalTasks: 150, level: 8 }, H));
  out.push(row(31, 1, 'Primeira Profecia', '7 tarefas em 4 dias.', 'Conclua 7 tarefas em 4 dias diferentes.', 95, { kind: 'total_and_days', totalTasks: 7, distinctDays: 4 }, E));
  out.push(row(31, 2, 'Vidente Certeira', '50 tarefas em 10 dias.', 'Conclua 50 tarefas em 10 dias diferentes.', 260, { kind: 'total_and_days', totalTasks: 50, distinctDays: 10 }, M));
  out.push(row(31, 3, 'Oráculo de Delfos', 'Nível 9 e 180 tarefas.', 'Atinja o nível 9 e conclua 180 tarefas.', 780, { kind: 'total_tasks_and_level', totalTasks: 180, level: 9 }, H));
  out.push(row(32, 1, 'Primeira Aparição', '5 tarefas em 3 dias.', 'Conclua 5 tarefas em 3 dias diferentes.', 100, { kind: 'total_and_days', totalTasks: 5, distinctDays: 3 }, E));
  out.push(row(32, 2, 'Espectro Noturno', '50 tarefas em 10 dias.', 'Conclua 50 tarefas em 10 dias diferentes.', 280, { kind: 'total_and_days', totalTasks: 50, distinctDays: 10 }, M));
  out.push(row(32, 3, 'Rei dos Mortos', 'Nível 8 e 200 tarefas.', 'Atinja o nível 8 e conclua 200 tarefas.', 750, { kind: 'total_tasks_and_level', totalTasks: 200, level: 8 }, H));
  out.push(row(33, 1, 'Primeiro Passo', '5 tarefas de trabalho.', 'Conclua 5 tarefas em pasta Trabalho.', 110, { kind: 'tasks_by_folder_type', tasksByFolderType: 5, folderType: 'trabalho' }, M));
  out.push(row(33, 2, 'Gigante de Pedra', '30 tarefas em 5 dias.', 'Conclua 30 tarefas em 5 dias diferentes.', 300, { kind: 'total_and_days', totalTasks: 30, distinctDays: 5 }, M));
  out.push(row(33, 3, 'Deus da Força', 'Nível 9 e 300 tarefas.', 'Atinja o nível 9 e conclua 300 tarefas.', 900, { kind: 'total_tasks_and_level', totalTasks: 300, level: 9 }, H));
  out.push(row(34, 1, 'Primeira Era', '10 tarefas em 5 dias.', 'Conclua 10 tarefas em 5 dias diferentes.', 120, { kind: 'total_and_days', totalTasks: 10, distinctDays: 5 }, M));
  out.push(row(34, 2, 'Guardião do Tempo', '60 tarefas em 15 dias.', 'Conclua 60 tarefas em 15 dias diferentes.', 350, { kind: 'total_and_days', totalTasks: 60, distinctDays: 15 }, H));
  out.push(row(34, 3, 'Ser Atemporal', 'Nível 10 e 500 tarefas.', 'Atinja o nível 10 e conclua 500 tarefas.', 2000, { kind: 'total_tasks_and_level', totalTasks: 500, level: 10 }, H));

  return out;
}

export function getAvatarMissionId(avatarIndex: number, phase: AvatarMissionPhase): string {
  return `avatar_${avatarIndex}_${phase}`;
}

/** IDs das 3 missões do arco de um avatar (fases 1, 2, 3). */
export function getAvatarArcMissionIds(avatarIndex: number): string[] {
  return [getAvatarMissionId(avatarIndex, 1), getAvatarMissionId(avatarIndex, 2), getAvatarMissionId(avatarIndex, 3)];
}

export function getAvatarUnlockId(avatarIndex: number): string {
  return `personagem${avatarIndex}`;
}

export function getTitleBadgeId(avatarIndex: number): string {
  return TITLE_BADGE_IDS[avatarIndex - 1] ?? '';
}
