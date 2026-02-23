import { getNeon } from '@/lib/neon';
import type { GameProfile, GameActivity, GameActivityType, RoomLayoutTrabalho } from '@/lib/db/game-types';
import { evaluateBadges } from '@/lib/game/badge-evaluation';
import { getHouseById } from '@/lib/game/rooms-catalog';
import { getWorkRoomById } from '@/lib/game/rooms-catalog';
import { getRewardForFolderType, getImportanceMultiplier } from '@/lib/game/folder-types';
import { getPetStressReductionPercent } from '@/lib/game/pet-assets';
import { getCoverBonus } from '@/lib/game/cover-bonuses';
import { getGuardianItemBonus } from '@/lib/game/guardian-items';
import { levelFromExperience } from '@/lib/game/level-progression';

function parseEarnedBadges(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

function rowToGameProfile(row: Record<string, unknown>): GameProfile {
  const raw = row.room_layout_trabalho;
  let room_layout_trabalho: RoomLayoutTrabalho | null = null;
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, { left?: number; bottom?: number }>;
    room_layout_trabalho = {};
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (v && typeof v.left === 'number' && typeof v.bottom === 'number')
        room_layout_trabalho![k] = { left: v.left, bottom: v.bottom };
    }
  }
  const earnedBadgesRaw = row.earned_badges ?? row.earned_badge_ids;
  const rawLevel = Number(row.level);
  const level = Math.max(1, Math.min(50, rawLevel));
  return {
    user_id: String(row.user_id),
    profession: row.profession != null ? String(row.profession) : null,
    coins: Number(row.coins),
    level,
    experience: Number(row.experience),
    health: Number(row.health),
    stress: Number(row.stress),
    work_hours_start: row.work_hours_start != null ? String(row.work_hours_start) : null,
    work_hours_end: row.work_hours_end != null ? String(row.work_hours_end) : null,
    room_layout_trabalho: Object.keys(room_layout_trabalho || {}).length > 0 ? room_layout_trabalho : null,
    avatar_image_url: row.avatar_image_url != null ? String(row.avatar_image_url) : null,
    cover_id: row.cover_id != null ? String(row.cover_id) : null,
    cover_position_y: row.cover_position_y != null ? Number(row.cover_position_y) : 50,
    earned_badge_ids: parseEarnedBadges(earnedBadgesRaw),
    pet_id: row.pet_id != null ? String(row.pet_id) : null,
    antistress_item_id: row.antistress_item_id != null ? String(row.antistress_item_id) : null,
    last_relax_at: row.last_relax_at != null ? String(row.last_relax_at) : null,
    last_work_bonus_at: row.last_work_bonus_at != null ? String(row.last_work_bonus_at) : null,
    current_house_id: row.current_house_id != null ? String(row.current_house_id) : null,
    current_work_room_id: row.current_work_room_id != null ? String(row.current_work_room_id) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function rowToGameActivity(row: Record<string, unknown>): GameActivity {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    event_id: row.event_id != null ? String(row.event_id) : null,
    task_id: row.task_id != null ? String(row.task_id) : null,
    activity_type: String(row.activity_type),
    scheduled_date: String(row.scheduled_date).split('T')[0],
    scheduled_time: row.scheduled_time != null ? String(row.scheduled_time) : null,
    completed: Boolean(row.completed),
    completed_at: row.completed_at != null ? String(row.completed_at) : null,
    coins_earned: Number(row.coins_earned),
    xp_earned: Number(row.xp_earned),
    health_change: Number(row.health_change),
    stress_change: Number(row.stress_change),
    created_at: String(row.created_at),
  };
}

export async function getGameProfile(userId: string): Promise<GameProfile | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM game_profiles WHERE user_id = ${userId} LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToGameProfile(row) : null;
}

export async function getOrCreateGameProfile(
  userId: string,
  defaults?: {
    profession?: string | null;
    work_hours_start?: string | null;
    work_hours_end?: string | null;
  }
): Promise<GameProfile> {
  const existing = await getGameProfile(userId);
  if (existing) return existing;

  const sql = getNeon();
  const STARTING_COINS = 200;
  const DEFAULT_HOUSE = 'casa_1';
  const DEFAULT_WORK_ROOM = 'sala_1';
  await sql`
    INSERT INTO game_profiles (user_id, profession, work_hours_start, work_hours_end, coins, current_house_id, current_work_room_id)
    VALUES (
      ${userId},
      ${defaults?.profession ?? null},
      ${defaults?.work_hours_start ?? null},
      ${defaults?.work_hours_end ?? null},
      ${STARTING_COINS},
      ${DEFAULT_HOUSE},
      ${DEFAULT_WORK_ROOM}
    )
  `;
  await sql`
    INSERT INTO game_owned_rooms (user_id, room_type, room_id)
    VALUES (${userId}, 'house', ${DEFAULT_HOUSE}), (${userId}, 'work', ${DEFAULT_WORK_ROOM})
    ON CONFLICT (user_id, room_type, room_id) DO NOTHING
  `;
  const created = await getGameProfile(userId);
  if (!created) throw new Error('Failed to create game profile');
  return created;
}

export async function updateGameProfile(
  userId: string,
  updates: Partial<
    Pick<
      GameProfile,
      | 'profession'
      | 'coins'
      | 'level'
      | 'experience'
      | 'health'
      | 'stress'
      | 'work_hours_start'
      | 'work_hours_end'
      | 'avatar_image_url'
      | 'cover_id'
      | 'cover_position_y'
      | 'earned_badge_ids'
      | 'pet_id'
      | 'antistress_item_id'
      | 'last_relax_at'
      | 'last_work_bonus_at'
      | 'current_house_id'
      | 'current_work_room_id'
    >
  >
): Promise<GameProfile | null> {
  const current = await getGameProfile(userId);
  if (!current) return null;

  const sql = getNeon();
  const earnedBadgesJson =
    updates.earned_badge_ids !== undefined
      ? JSON.stringify(updates.earned_badge_ids)
      : JSON.stringify(current.earned_badge_ids);

  const coverPositionY =
    updates.cover_position_y !== undefined
      ? Math.max(0, Math.min(100, updates.cover_position_y))
      : (current.cover_position_y ?? 50);

  const rows = await sql`
    UPDATE game_profiles
    SET
      profession = COALESCE(${updates.profession ?? null}, profession),
      coins = COALESCE(${updates.coins ?? null}, coins),
      level = COALESCE(${updates.level ?? null}, level),
      experience = COALESCE(${updates.experience ?? null}, experience),
      health = GREATEST(0, LEAST(100, COALESCE(${updates.health ?? null}, health))),
      stress = GREATEST(0, LEAST(120, COALESCE(${updates.stress ?? null}, stress))),
      work_hours_start = COALESCE(${updates.work_hours_start ?? null}, work_hours_start),
      work_hours_end = COALESCE(${updates.work_hours_end ?? null}, work_hours_end),
      avatar_image_url = COALESCE(${updates.avatar_image_url ?? null}, avatar_image_url),
      cover_id = COALESCE(${updates.cover_id ?? null}, cover_id),
      cover_position_y = ${coverPositionY},
      earned_badges = ${earnedBadgesJson}::jsonb,
      pet_id = COALESCE(${updates.pet_id ?? null}, pet_id),
      antistress_item_id = COALESCE(${updates.antistress_item_id ?? null}, antistress_item_id),
      last_relax_at = COALESCE(${updates.last_relax_at ?? null}, last_relax_at),
      last_work_bonus_at = COALESCE(${updates.last_work_bonus_at ?? null}, last_work_bonus_at),
      current_house_id = COALESCE(${updates.current_house_id ?? null}, current_house_id),
      current_work_room_id = COALESCE(${updates.current_work_room_id ?? null}, current_work_room_id),
      updated_at = NOW()
    WHERE user_id = ${userId}
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToGameProfile(row) : null;
}

/**
 * Reseta a conta de jogo ao estado inicial (personagem "morreu" — saúde zerou).
 * Remove todos os itens desbloqueados, mantém só casa_1 e sala_1, perfil: nível 1, 200 moedas, saúde 100, stress 0, capa default, avatar personagem9, sem pet, sem medalhas.
 */
export async function resetGameProfileOnDeath(userId: string): Promise<void> {
  const sql = getNeon();
  await sql`DELETE FROM game_owned_items WHERE user_id = ${userId}`;
  await sql`DELETE FROM game_owned_rooms WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO game_owned_rooms (user_id, room_type, room_id)
    VALUES (${userId}, 'house', ${DEFAULT_HOUSE_ID}), (${userId}, 'work', ${DEFAULT_WORK_ROOM_ID})
    ON CONFLICT (user_id, room_type, room_id) DO NOTHING
  `;
  await sql`
    UPDATE game_profiles
    SET
      coins = ${INITIAL_COINS_ON_RESET},
      experience = 0,
      level = 1,
      health = 100,
      stress = 0,
      cover_id = ${DEFAULT_COVER_ID},
      avatar_image_url = ${DEFAULT_AVATAR_URL},
      cover_position_y = 50,
      earned_badges = '[]'::jsonb,
      pet_id = null,
      last_relax_at = null,
      last_work_bonus_at = null,
      current_house_id = ${DEFAULT_HOUSE_ID},
      current_work_room_id = ${DEFAULT_WORK_ROOM_ID},
      room_layout_trabalho = null,
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}

export async function getRoomLayoutTrabalho(userId: string): Promise<RoomLayoutTrabalho | null> {
  const profile = await getGameProfile(userId);
  return profile?.room_layout_trabalho ?? null;
}

export async function setRoomLayoutTrabalho(
  userId: string,
  layout: RoomLayoutTrabalho
): Promise<boolean> {
  const sql = getNeon();
  const rows = await sql`
    UPDATE game_profiles
    SET room_layout_trabalho = ${JSON.stringify(layout)}::jsonb, updated_at = NOW()
    WHERE user_id = ${userId}
    RETURNING user_id
  `;
  return (rows as unknown[]).length > 0;
}

export async function getActivityTypes(): Promise<GameActivityType[]> {
  const sql = getNeon();
  const rows = await sql`SELECT * FROM game_activity_types ORDER BY id`;
  return rows as GameActivityType[];
}

export async function getActivityType(id: string): Promise<GameActivityType | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM game_activity_types WHERE id = ${id} LIMIT 1
  `;
  const row = (rows as GameActivityType[])[0];
  return row ?? null;
}

/** Data de hoje em America/Sao_Paulo (YYYY-MM-DD) para checagem 1x/dia */
export function getTodayBrazilDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

/** Cooldown após usar Relaxar em casa ou Trabalhar (3 horas). */
const COOLDOWN_RELAX_MS = 3 * 60 * 60 * 1000;
const COOLDOWN_WORK_BONUS_MS = 3 * 60 * 60 * 1000;

/** Retorna data (YYYY-MM-DD) em America/Sao_Paulo a partir de um timestamp ISO. */
export function getBrazilDateFromIso(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

/** Retorna a última data (YYYY-MM-DD, Brazil) em que o usuário concluiu alguma atividade. */
export async function getLastActivityDate(userId: string): Promise<string | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT (completed_at AT TIME ZONE 'America/Sao_Paulo')::date as d
    FROM game_activities
    WHERE user_id = ${userId} AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 1
  `;
  const row = (rows as { d: string }[])[0];
  return row ? String(row.d).slice(0, 10) : null;
}

/** Quantas atividades o usuário já concluiu hoje (antes desta). */
export async function getActivitiesCountToday(userId: string): Promise<number> {
  const sql = getNeon();
  const today = getTodayBrazilDate();
  const rows = await sql`
    SELECT COUNT(*) as c
    FROM game_activities
    WHERE user_id = ${userId}
      AND (completed_at AT TIME ZONE 'America/Sao_Paulo')::date = ${today}::date
  `;
  const row = (rows as { c: number }[])[0];
  return row ? Number(row.c) : 0;
}

/** Dias consecutivos com pelo menos uma atividade, terminando em ontem (hoje ainda não conta). Retorna 0 se não houver atividades ou se ontem não tiver. */
export async function getConsecutiveDaysStreak(userId: string): Promise<number> {
  const sql = getNeon();
  const rows = await sql`
    SELECT DISTINCT (completed_at AT TIME ZONE 'America/Sao_Paulo')::date as d
    FROM game_activities
    WHERE user_id = ${userId} AND completed_at IS NOT NULL
    ORDER BY d DESC
    LIMIT 60
  `;
  const dates = (rows as { d: string }[]).map((r) => String(r.d).slice(0, 10));
  if (dates.length === 0) return 0;
  const today = getTodayBrazilDate();
  const yesterday = new Date(today + 'T12:00:00');
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  let streak = 0;
  let cursor = yesterdayStr;
  for (;;) {
    if (!dates.includes(cursor)) break;
    streak++;
    const next = new Date(cursor + 'T12:00:00');
    next.setDate(next.getDate() - 1);
    cursor = next.toISOString().slice(0, 10);
  }
  return streak;
}

const RELAX_STRESS_REDUCTION = 15;
const WORK_BONUS_COINS_MULTIPLIER = 1.5;
const WORK_BONUS_STRESS_MULTIPLIER = 0.5;
/** Pet: +10% moedas quando a pasta dá moedas; % a menos de stress (por pet) */
const PET_BONUS_COINS_MULTIPLIER = 1.1;
/** Relaxar com pet equipado reduz 20% a mais de stress */
const PET_RELAX_EXTRA = 1.2;

/** Pasta trabalho: stress ≥30% → 60% XP; stress ≥60% e <100% → 30% XP; stress ≥100% (Burnout) → 0% XP e 0 moedas. */
const STRESS_XP_MULTIPLIER_ABOVE_30 = 0.6;
const STRESS_XP_MULTIPLIER_ABOVE_60 = 0.3;
/** Stress pode ultrapassar 100% até este valor (Burnout piora até relaxar). */
const STRESS_CAP_BURNOUT = 120;
/** Saúde ≤50% ou stress >75%: status "doente"; trabalho rende menos, mais stress, menos XP. */
const SICK_HEALTH_THRESHOLD = 50;
const SICK_STRESS_THRESHOLD = 75;
const SICK_COINS_MULTIPLIER = 0.5;
const SICK_XP_MULTIPLIER = 0.5;
const SICK_HEALTH_CHANGE_MULTIPLIER = 1.5;
const SICK_STRESS_CHANGE_MULTIPLIER = 1.5;

const INITIAL_COINS_ON_RESET = 200;
const DEFAULT_HOUSE_ID = 'casa_1';
const DEFAULT_WORK_ROOM_ID = 'sala_1';
const DEFAULT_AVATAR_URL = '/game/assets/avatar/personagem9.png';
const DEFAULT_COVER_ID = 'default';

/** Catch-up: bônus ao voltar após dias sem jogar. Aplicado às primeiras 2 atividades do dia de retorno. */
const CATCHUP_DAYS_1_BONUS = 1.1;   // 1 dia sem jogar: +10%
const CATCHUP_DAYS_2_BONUS = 1.2;   // 2 dias: +20%
const CATCHUP_DAYS_3_PLUS_BONUS = 1.3; // 3+ dias: +30%
const CATCHUP_MAX_ACTIVITIES = 2;   // máx atividades com bônus no dia de retorno

/** Streak: bônus por dias consecutivos (2 dias +5%, 3 +10%, 4 +15%, 5+ +20%). */
const STREAK_BONUS_BY_DAYS: Record<number, number> = { 2: 1.05, 3: 1.10, 4: 1.15, 5: 1.20 };
/** Streak: bônus por atividades no mesmo dia (2ª +5%, 3ª +10%, 4ª +15%, 5ª+ +20%). */
const SAME_DAY_BONUS_BY_COUNT: Record<number, number> = { 2: 1.05, 3: 1.10, 4: 1.15, 5: 1.20 };

/**
 * Cria uma atividade concluída e aplica recompensas conforme o tipo da pasta (trabalho, estudos, lazer, tarefas_pessoais).
 * Pet: % a menos de stress (por pet) e +10% moedas em pastas que dão moedas. Capa: bônus % XP/coins e health_extra.
 * "Trabalhar" hoje: só em pasta trabalho, mais moedas e menos stress.
 */
export async function recordTaskCompletedForGame(
  userId: string,
  taskId: string,
  options: {
    scheduled_date: string;
    scheduled_time?: string | null;
    folder_type?: string | null;
    /** Importância do evento (simple/medium/important): multiplica recompensas da pasta. */
    event_importance?: string | null;
  }
): Promise<{ ok: boolean; error?: string; levelUp?: boolean; newLevel?: number; previousLevel?: number; xpEarned?: number; died?: boolean }> {
  const sql = getNeon();
  const profile = await getOrCreateGameProfile(userId);
  const reward = getRewardForFolderType(options.folder_type);
  const activityType = (options.folder_type && ['trabalho', 'estudos', 'lazer', 'tarefas_pessoais'].includes(options.folder_type))
    ? options.folder_type
    : 'trabalho';

  const importanceMult = getImportanceMultiplier(options.event_importance ?? 'medium');
  let coinsEarned = Math.round(reward.coins * importanceMult);
  let xpEarned = Math.round(reward.xp * importanceMult);
  let healthChange = Math.round(reward.health_change * importanceMult);
  let stressChange = Math.round(reward.stress_change * importanceMult);

  // Pasta trabalho e estudos: stress alto reduz XP; Burnout (≥100%) → 0 XP e 0 moedas
  if (activityType === 'trabalho' || activityType === 'estudos') {
    if (profile.stress >= 100) {
      xpEarned = 0;
      coinsEarned = 0;
    } else if (activityType === 'trabalho') {
      if (profile.stress >= 60) {
        xpEarned = Math.floor(xpEarned * STRESS_XP_MULTIPLIER_ABOVE_60);
      } else if (profile.stress >= 30) {
        xpEarned = Math.floor(xpEarned * STRESS_XP_MULTIPLIER_ABOVE_30);
      }
    }
  }

  const lastWorkBonusDate = getBrazilDateFromIso(profile.last_work_bonus_at);
  const hasWorkBonusToday =
    activityType === 'trabalho' && lastWorkBonusDate === options.scheduled_date;
  if (hasWorkBonusToday) {
    coinsEarned = Math.floor(coinsEarned * WORK_BONUS_COINS_MULTIPLIER);
    stressChange = Math.round(stressChange * WORK_BONUS_STRESS_MULTIPLIER);
  }

  if (profile.pet_id != null && profile.pet_id.trim() !== '') {
    if (coinsEarned > 0) coinsEarned = Math.floor(coinsEarned * PET_BONUS_COINS_MULTIPLIER);
    const petPercent = getPetStressReductionPercent(profile.pet_id);
    if (stressChange > 0 && petPercent > 0) {
      stressChange = Math.max(0, Math.round(stressChange * (1 - petPercent / 100)));
    }
  }

  const coverBonus = getCoverBonus(profile.cover_id ?? null);
  if (coverBonus.xp_percent && xpEarned > 0) {
    xpEarned = Math.floor(xpEarned * (1 + coverBonus.xp_percent / 100));
  }
  if (coverBonus.coins_percent && coinsEarned > 0) {
    coinsEarned = Math.floor(coinsEarned * (1 + coverBonus.coins_percent / 100));
  }
  if (coverBonus.health_extra) {
    healthChange += coverBonus.health_extra;
  }
  if (coverBonus.stress_reduce_percent && stressChange > 0) {
    stressChange = Math.max(0, Math.round(stressChange * (1 - coverBonus.stress_reduce_percent / 100)));
  }

  const guardianBonus = getGuardianItemBonus(profile.antistress_item_id ?? null);
  if (guardianBonus.stress_reduce_percent && stressChange > 0) {
    stressChange = Math.max(0, Math.round(stressChange * (1 - guardianBonus.stress_reduce_percent / 100)));
  }
  if (guardianBonus.xp_percent && xpEarned > 0) {
    xpEarned = Math.floor(xpEarned * (1 + guardianBonus.xp_percent / 100));
  }
  if (guardianBonus.coins_percent && coinsEarned > 0) {
    coinsEarned = Math.floor(coinsEarned * (1 + guardianBonus.coins_percent / 100));
  }

  // Status "doente" (saúde ≤50% ou stress >75%): trabalho rende menos, mais stress, menos XP
  const isSick = profile.health <= SICK_HEALTH_THRESHOLD || profile.stress > SICK_STRESS_THRESHOLD;
  if (activityType === 'trabalho' && isSick) {
    coinsEarned = Math.floor(coinsEarned * SICK_COINS_MULTIPLIER);
    xpEarned = Math.floor(xpEarned * SICK_XP_MULTIPLIER);
    healthChange = Math.round(healthChange * SICK_HEALTH_CHANGE_MULTIPLIER);
    stressChange = Math.round(stressChange * SICK_STRESS_CHANGE_MULTIPLIER);
  }

  // Punição extra +5% em atividades de trabalho (moedas, XP, saúde e stress)
  if (activityType === 'trabalho') {
    coinsEarned = Math.floor(coinsEarned * 0.95);
    xpEarned = Math.floor(xpEarned * 0.95);
    if (healthChange < 0) healthChange = Math.floor(healthChange * 1.05);
    if (stressChange > 0) stressChange = Math.ceil(stressChange * 1.05);
  }

  // Catch-up: bônus nas primeiras atividades ao voltar após 1+ dias sem jogar
  const today = getTodayBrazilDate();
  const lastActivityDate = await getLastActivityDate(userId);
  const activitiesTodayBeforeThis = await getActivitiesCountToday(userId);
  let catchupMult = 1;
  if (lastActivityDate && lastActivityDate < today && activitiesTodayBeforeThis < CATCHUP_MAX_ACTIVITIES) {
    const last = new Date(lastActivityDate + 'T12:00:00');
    const t = new Date(today + 'T12:00:00');
    const daysGap = Math.floor((t.getTime() - last.getTime()) / 86400000);
    if (daysGap >= 3) catchupMult = CATCHUP_DAYS_3_PLUS_BONUS;
    else if (daysGap >= 2) catchupMult = CATCHUP_DAYS_2_BONUS;
    else if (daysGap >= 1) catchupMult = CATCHUP_DAYS_1_BONUS;
  }
  if (catchupMult > 1) {
    xpEarned = Math.floor(xpEarned * catchupMult);
    if (coinsEarned > 0) coinsEarned = Math.floor(coinsEarned * catchupMult);
  }

  // Streak: bônus por dias consecutivos e por atividades no mesmo dia
  const consecutiveDaysBeforeToday = await getConsecutiveDaysStreak(userId);
  const effectiveConsecutiveDays = consecutiveDaysBeforeToday + 1; // esta atividade é hoje
  const streakDaysMult = effectiveConsecutiveDays >= 5 ? STREAK_BONUS_BY_DAYS[5]
    : STREAK_BONUS_BY_DAYS[effectiveConsecutiveDays] ?? 1;
  const sameDayIndex = activitiesTodayBeforeThis + 1; // 1ª, 2ª, 3ª... atividade de hoje
  const sameDayMult = sameDayIndex >= 5 ? SAME_DAY_BONUS_BY_COUNT[5]
    : SAME_DAY_BONUS_BY_COUNT[sameDayIndex] ?? 1;
  const streakMult = Math.max(streakDaysMult, sameDayMult);
  if (streakMult > 1) {
    xpEarned = Math.floor(xpEarned * streakMult);
    if (coinsEarned > 0) coinsEarned = Math.floor(coinsEarned * streakMult);
  }

  const now = new Date().toISOString();

  try {
    await sql`
      INSERT INTO game_activities (
        user_id, task_id, activity_type, scheduled_date, scheduled_time,
        completed, completed_at, coins_earned, xp_earned, health_change, stress_change
      ) VALUES (
        ${userId},
        ${taskId},
        ${activityType},
        ${options.scheduled_date},
        ${options.scheduled_time ?? null},
        true,
        ${now}::timestamptz,
        ${coinsEarned},
        ${xpEarned},
        ${healthChange},
        ${stressChange}
      )
    `;
  } catch (e) {
    console.error('[recordTaskCompletedForGame] insert activity', e);
    return { ok: false, error: 'Failed to create game activity' };
  }

  const newCoins = profile.coins + coinsEarned;
  const newExperience = profile.experience + xpEarned;
  const newHealth = Math.max(0, Math.min(100, profile.health + healthChange));
  const newStress = Math.max(0, Math.min(STRESS_CAP_BURNOUT, profile.stress + stressChange));
  const previousLevel = profile.level;
  const newLevel = levelFromExperience(newExperience);
  const levelUp = newLevel > previousLevel;

  await sql`
    UPDATE game_profiles
    SET
      coins = ${newCoins},
      experience = ${newExperience},
      level = ${newLevel},
      health = ${newHealth},
      stress = ${newStress},
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;

  // Saúde zerou: personagem "morre" — reset completo do jogo (nível 1, sem itens desbloqueados)
  let died = false;
  if (newHealth === 0) {
    await resetGameProfileOnDeath(userId);
    died = true;
  }

  if (!died) await evaluateAndGrantBadges(userId);
  return {
    ok: true,
    levelUp: levelUp || undefined,
    newLevel: levelUp ? newLevel : undefined,
    previousLevel: levelUp ? previousLevel : undefined,
    xpEarned,
    died: died || undefined,
  };
}

/**
 * Usa "Relaxar em casa". Reduz stress. Bônus da casa ativa + pet. Cooldown 3h. Retorna { ok, error: 'already_used', next_available_at? } se ainda em cooldown.
 */
export async function useRelax(
  userId: string
): Promise<{ ok: boolean; error?: string; next_available_at?: string; profile?: GameProfile }> {
  const profile = await getOrCreateGameProfile(userId);
  const now = Date.now();
  if (profile.last_relax_at) {
    const lastMs = new Date(profile.last_relax_at).getTime();
    if (Number.isNaN(lastMs)) {
      // legacy date-only value
    } else if (now - lastMs < COOLDOWN_RELAX_MS) {
      const nextAt = new Date(lastMs + COOLDOWN_RELAX_MS).toISOString();
      return { ok: false, error: 'already_used', next_available_at: nextAt };
    }
  }
  const house = getHouseById(profile.current_house_id ?? null);
  let reduction = RELAX_STRESS_REDUCTION + (house?.relax_extra ?? 0);
  if (profile.pet_id != null && profile.pet_id.trim() !== '') {
    reduction = Math.floor(reduction * PET_RELAX_EXTRA);
  }
  const newStress = Math.max(0, profile.stress - reduction);
  const healthGain = house?.health_bonus ?? 0;
  const newHealth = Math.min(100, profile.health + healthGain);
  const nowIso = new Date().toISOString();
  const updated = await updateGameProfile(userId, {
    last_relax_at: nowIso,
    stress: newStress,
    health: newHealth,
  });
  return { ok: true, profile: updated ?? undefined };
}

/** Ao ativar "Trabalhar" (1x/dia): diminui saúde, aumenta stress, dá dinheiro e XP (temporário). Depois, tarefas do dia dão mais moedas e menos stress. */
const WORK_BONUS_HEALTH_COST = 10;
const WORK_BONUS_STRESS_GAIN = 15;
const WORK_BONUS_COINS_REWARD = 80;
/** XP concedido ao clicar em "Trabalhar" (temporário). */
const WORK_BONUS_XP = 50;

/**
 * Ativa o bônus "Trabalhar". Custa saúde e stress, dá moedas e 50 XP. Cooldown 3h. Retorna { ok, error: 'already_used', next_available_at? } se ainda em cooldown.
 */
export async function useWorkBonus(
  userId: string
): Promise<{ ok: boolean; error?: string; next_available_at?: string; profile?: GameProfile; xpEarned?: number; levelUp?: boolean; newLevel?: number; previousLevel?: number; died?: boolean }> {
  const profile = await getOrCreateGameProfile(userId);
  const now = Date.now();
  if (profile.last_work_bonus_at) {
    const lastMs = new Date(profile.last_work_bonus_at).getTime();
    if (!Number.isNaN(lastMs) && now - lastMs < COOLDOWN_WORK_BONUS_MS) {
      const nextAt = new Date(lastMs + COOLDOWN_WORK_BONUS_MS).toISOString();
      return { ok: false, error: 'already_used', next_available_at: nextAt };
    }
  }
  const room = getWorkRoomById(profile.current_work_room_id ?? null);
  const healthCost = Math.max(0, WORK_BONUS_HEALTH_COST + (room?.work_health_extra ?? 0));
  const coinsReward = WORK_BONUS_COINS_REWARD + (room?.work_coins_extra ?? 0);
  const newHealth = Math.max(0, profile.health - healthCost);
  const newStress = Math.min(STRESS_CAP_BURNOUT, profile.stress + WORK_BONUS_STRESS_GAIN);
  const newCoins = profile.coins + coinsReward;
  const previousLevel = profile.level;
  const newExperience = profile.experience + WORK_BONUS_XP;
  const newLevel = levelFromExperience(newExperience);
  const levelUp = newLevel > previousLevel;

  if (newHealth === 0) {
    await resetGameProfileOnDeath(userId);
    const resetProfile = await getGameProfile(userId);
    return {
      ok: true,
      profile: resetProfile ?? undefined,
      died: true,
    };
  }

  const updatePayload: Parameters<typeof updateGameProfile>[1] = {
    health: newHealth,
    stress: newStress,
    coins: newCoins,
    experience: newExperience,
    level: newLevel,
    last_work_bonus_at: new Date().toISOString(),
  };
  const updated = await updateGameProfile(userId, updatePayload);
  return {
    ok: true,
    profile: updated ?? undefined,
    xpEarned: WORK_BONUS_XP,
    levelUp: levelUp || undefined,
    newLevel: levelUp ? newLevel : undefined,
    previousLevel: levelUp ? previousLevel : undefined,
  };
}

/** Reavalia todas as medalhas e atualiza earned_badge_ids no perfil se houver novas. */
export async function evaluateAndGrantBadges(userId: string): Promise<void> {
  const profile = await getGameProfile(userId);
  if (!profile) return;
  const newEarned = await evaluateBadges(userId);
  const current = new Set(profile.earned_badge_ids ?? []);
  if (newEarned.length === current.size && newEarned.every((id) => current.has(id))) return;
  await updateGameProfile(userId, { earned_badge_ids: newEarned });
}

export async function getActivitiesByUserAndDate(
  userId: string,
  date: string
): Promise<GameActivity[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM game_activities
    WHERE user_id = ${userId} AND scheduled_date = ${date}
    ORDER BY scheduled_time NULLS LAST, created_at
  `;
  return (rows as Record<string, unknown>[]).map(rowToGameActivity);
}
