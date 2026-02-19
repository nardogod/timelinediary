import { getNeon } from '@/lib/neon';

/** Registra que o usuário viewerUserId clicou no link do evento eventId (dono do evento = owner do event) */
export async function recordLinkView(eventId: string, viewerUserId: string): Promise<boolean> {
  const sql = getNeon();
  try {
    await sql`
      INSERT INTO link_views (event_id, viewer_user_id)
      VALUES (${eventId}, ${viewerUserId})
      ON CONFLICT (event_id, viewer_user_id) DO NOTHING
    `;
    return true;
  } catch (e) {
    console.error('recordLinkView error:', e);
    return false;
  }
}

/** Conta quantas visualizações um evento teve (por quantas pessoas distintas) */
export async function getLinkViewCountByEventId(eventId: string): Promise<number> {
  const sql = getNeon();
  const rows = await sql`
    SELECT COUNT(DISTINCT viewer_user_id) as count
    FROM link_views
    WHERE event_id = ${eventId}
  ` as Array<{ count: string }>;
  return rows[0] ? Number(rows[0].count) : 0;
}

/** Para o dono da timeline: eventos que têm pelo menos uma visualização (para mostrar "Visualizado") */
export async function getEventIdsWithViews(ownerUserId: string): Promise<Set<string>> {
  const sql = getNeon();
  const rows = await sql`
    SELECT DISTINCT lv.event_id
    FROM link_views lv
    INNER JOIN events e ON e.id = lv.event_id
    WHERE e.user_id = ${ownerUserId}
  ` as Array<{ event_id: string }>;
  return new Set(rows.map(r => r.event_id));
}

/** Ranking de fãs: usuários que clicaram em links da timeline do owner, ordenados pela 1ª visualização (Fan #1, #2, ...) */
export async function getFanRank(ownerUserId: string, limit = 50): Promise<Array<{ viewer_user_id: string; first_viewed_at: string; view_count: number }>> {
  const sql = getNeon();
  const rows = await sql`
    SELECT
      lv.viewer_user_id,
      MIN(lv.viewed_at) AS first_viewed_at,
      COUNT(*) AS view_count
    FROM link_views lv
    INNER JOIN events e ON e.id = lv.event_id
    WHERE e.user_id = ${ownerUserId}
    GROUP BY lv.viewer_user_id
    ORDER BY MIN(lv.viewed_at) ASC
    LIMIT ${limit}
  ` as Array<{ viewer_user_id: string; first_viewed_at: string; view_count: number }>;
  return rows.map(r => ({
    viewer_user_id: r.viewer_user_id,
    first_viewed_at: r.first_viewed_at,
    view_count: Number(r.view_count),
  }));
}
