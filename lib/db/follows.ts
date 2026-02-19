import { getNeon } from '@/lib/neon';

export async function getFollowedIds(userId: string): Promise<string[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT target_user_id FROM user_follows
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
  `;
  return (rows as { target_user_id: string }[]).map((r) => String(r.target_user_id));
}

export async function addFollow(userId: string, targetUserId: string): Promise<boolean> {
  if (userId === targetUserId) return false;
  const sql = getNeon();
  try {
    await sql`
      INSERT INTO user_follows (user_id, target_user_id)
      VALUES (${userId}, ${targetUserId})
      ON CONFLICT (user_id, target_user_id) DO NOTHING
    `;
    return true;
  } catch {
    return false;
  }
}

export async function removeFollow(userId: string, targetUserId: string): Promise<void> {
  const sql = getNeon();
  await sql`
    DELETE FROM user_follows
    WHERE user_id = ${userId} AND target_user_id = ${targetUserId}
  `;
}
