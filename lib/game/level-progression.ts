/**
 * Progressão de nível (1–50) com tabela de XP progressiva.
 * Meta: uso intenso (~8h/dia) deve levar ao menos ~30 dias para nível 50.
 *
 * Cálculo:
 * - XP total para nível 50 ≈ 7840 (progressivo: cada nível exige um pouco mais que o anterior).
 * - 7840 / 30 dias ≈ 261 XP/dia em média.
 * - Uso intenso: ~3–4 tarefas trabalho/estudos por dia com importância e bônus ≈ 250–300 XP/dia.
 */

export const MAX_LEVEL = 50;

/** XP necessário para subir do nível N para N+1 (índice 0 = nível 1→2). Progressivo: +3 XP por nível. */
const XP_FOR_NEXT_LEVEL: number[] = (() => {
  const base = 88;
  const increment = 3;
  const arr: number[] = [];
  for (let i = 0; i < MAX_LEVEL - 1; i++) {
    arr.push(base + i * increment);
  }
  return arr;
})();

/** XP total acumulado para atingir cada nível (nível 1 = 0, nível 2 = XP_FOR_NEXT_LEVEL[0], ...). */
const CUMULATIVE_XP: number[] = (() => {
  const arr = [0];
  for (let i = 0; i < XP_FOR_NEXT_LEVEL.length; i++) {
    arr.push(arr[arr.length - 1] + XP_FOR_NEXT_LEVEL[i]);
  }
  return arr;
})();

/** XP total necessário para estar no nível 50. */
export const TOTAL_XP_FOR_MAX_LEVEL = CUMULATIVE_XP[MAX_LEVEL];

/**
 * Retorna o nível (1–50) correspondente à experiência total.
 */
export function levelFromExperience(experience: number): number {
  if (experience <= 0) return 1;
  for (let L = MAX_LEVEL - 1; L >= 0; L--) {
    if (experience >= CUMULATIVE_XP[L]) return L + 1;
  }
  return 1;
}

/**
 * XP necessário para subir do nível atual para o próximo (ou 0 se já está no nível máximo).
 */
export function xpRequiredForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return 0;
  return XP_FOR_NEXT_LEVEL[currentLevel - 1] ?? 0;
}

/**
 * XP total mínimo para estar no nível N.
 */
export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > MAX_LEVEL) return CUMULATIVE_XP[MAX_LEVEL];
  return CUMULATIVE_XP[level - 1] ?? 0;
}

/**
 * Progresso no nível atual (0–1): quanto do XP necessário para o próximo nível já foi preenchido.
 */
export function progressInCurrentLevel(experience: number): number {
  const level = levelFromExperience(experience);
  if (level >= MAX_LEVEL) return 1;
  const minForCurrent = totalXpForLevel(level);
  const minForNext = totalXpForLevel(level + 1);
  const needed = minForNext - minForCurrent;
  const have = experience - minForCurrent;
  return Math.min(1, Math.max(0, have / needed));
}
