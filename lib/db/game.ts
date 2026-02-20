import { getNeon } from '@/lib/neon';
import type { GameProfile, GameActivity, GameActivityType, RoomLayoutTrabalho } from '@/lib/db/game-types';

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
  return {
    user_id: String(row.user_id),
    profession: row.profession != null ? String(row.profession) : null,
    coins: Number(row.coins),
    level: Number(row.level),
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
  await sql`
    INSERT INTO game_profiles (user_id, profession, work_hours_start, work_hours_end)
    VALUES (
      ${userId},
      ${defaults?.profession ?? null},
      ${defaults?.work_hours_start ?? null},
      ${defaults?.work_hours_end ?? null}
    )
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
      stress = GREATEST(0, LEAST(100, COALESCE(${updates.stress ?? null}, stress))),
      work_hours_start = COALESCE(${updates.work_hours_start ?? null}, work_hours_start),
      work_hours_end = COALESCE(${updates.work_hours_end ?? null}, work_hours_end),
      avatar_image_url = COALESCE(${updates.avatar_image_url ?? null}, avatar_image_url),
      cover_id = COALESCE(${updates.cover_id ?? null}, cover_id),
      cover_position_y = ${coverPositionY},
      earned_badges = ${earnedBadgesJson}::jsonb,
      pet_id = COALESCE(${updates.pet_id ?? null}, pet_id),
      updated_at = NOW()
    WHERE user_id = ${userId}
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToGameProfile(row) : null;
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
