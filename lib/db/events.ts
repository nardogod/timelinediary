import { getNeon } from '@/lib/neon';
import { Event } from './types';

/** Normaliza valor de data para YYYY-MM-DD (sem horário). */
function toDateOnly(val: unknown): string {
  if (val == null) return '';
  const str = String(val).trim();
  // Se já é YYYY-MM-DD, retorna direto
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Se tem T (ISO), pega só a parte da data
  const datePart = str.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  // Tenta parsear como Date e converter para YYYY-MM-DD
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {}
  // Fallback: retorna string original
  return str;
}

function rowToEvent(row: Record<string, unknown>): Event {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title),
    date: toDateOnly(row.date),
    end_date: row.end_date != null ? toDateOnly(row.end_date) : null,
    type: row.type as Event['type'],
    link: row.link != null ? String(row.link) : null,
    folder_id: row.folder_id != null ? String(row.folder_id) : null,
    task_id: row.task_id != null ? String(row.task_id) : null,
    created_at: String(row.created_at),
  };
}

export async function getEventsByUserId(userId: string): Promise<Event[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM events
    WHERE user_id = ${userId}
    ORDER BY date DESC
  `;
  return (rows as Record<string, unknown>[]).map(rowToEvent);
}

export async function getEventsByUsername(username: string): Promise<Event[]> {
  const sql = getNeon();
  const userRows = await sql`
    SELECT id FROM users WHERE username = ${username} LIMIT 1
  `;
  const user = (userRows as Record<string, unknown>[])[0];
  if (!user) return [];
  return getEventsByUserId(String(user.id));
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM events WHERE id = ${eventId} LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToEvent(row) : null;
}

export async function createEvent(eventData: {
  user_id: string;
  title: string;
  date: string;
  end_date?: string | null;
  type: 'simple' | 'medium' | 'important';
  link?: string | null;
  folder_id?: string | null;
  task_id?: string | null;
}): Promise<Event | null> {
  const sql = getNeon();
  const dateOnly = toDateOnly(eventData.date);
  const endDateOnly = eventData.end_date != null ? toDateOnly(eventData.end_date) : null;
  const rows = await sql`
    INSERT INTO events (user_id, title, date, end_date, type, link, folder_id, task_id)
    VALUES (
      ${eventData.user_id},
      ${eventData.title.trim()},
      ${dateOnly},
      ${endDateOnly},
      ${eventData.type},
      ${eventData.link ?? null},
      ${eventData.folder_id ?? null},
      ${eventData.task_id ?? null}
    )
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToEvent(row) : null;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<Event, 'id' | 'user_id' | 'created_at'>>
): Promise<Event | null> {
  const existing = await getEventById(eventId);
  if (!existing) return null;
  const title = updates.title ?? existing.title;
  const date = toDateOnly(updates.date ?? existing.date);
  const end_date = updates.end_date !== undefined ? (updates.end_date != null ? toDateOnly(updates.end_date) : null) : existing.end_date;
  const type = updates.type ?? existing.type;
  const link = updates.link !== undefined ? updates.link : existing.link;
  const folder_id = updates.folder_id !== undefined ? updates.folder_id : existing.folder_id;
  const task_id = updates.task_id !== undefined ? updates.task_id : existing.task_id;

  const sql = getNeon();
  const rows = await sql`
    UPDATE events
    SET title = ${title}, date = ${date}, end_date = ${end_date}, type = ${type}, link = ${link}, folder_id = ${folder_id}, task_id = ${task_id}
    WHERE id = ${eventId}
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToEvent(row) : null;
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const sql = getNeon();
    const rows = await sql`DELETE FROM events WHERE id = ${eventId} RETURNING id`;
    const result = rows as Array<{ id: string }>;
    return result.length > 0;
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    throw error;
  }
}

/**
 * Cria múltiplos eventos de uma vez (útil para eventos recorrentes)
 */
export async function createMultipleEvents(eventsData: Array<{
  user_id: string;
  title: string;
  date: string;
  end_date?: string | null;
  type: 'simple' | 'medium' | 'important';
  link?: string | null;
  folder_id?: string | null;
  task_id?: string | null;
}>): Promise<Event[]> {
  if (eventsData.length === 0) return [];

  const sql = getNeon();
  const createdEvents: Event[] = [];

  // Cria eventos um por um para garantir que todos sejam criados mesmo se algum falhar
  for (const eventData of eventsData) {
    try {
      const dateOnly = toDateOnly(eventData.date);
      const endDateOnly = eventData.end_date != null ? toDateOnly(eventData.end_date) : null;
      const rows = await sql`
        INSERT INTO events (user_id, title, date, end_date, type, link, folder_id, task_id)
        VALUES (
          ${eventData.user_id},
          ${eventData.title.trim()},
          ${dateOnly},
          ${endDateOnly},
          ${eventData.type},
          ${eventData.link ?? null},
          ${eventData.folder_id ?? null},
          ${eventData.task_id ?? null}
        )
        RETURNING *
      `;
      const row = (rows as Record<string, unknown>[])[0];
      if (row) {
        createdEvents.push(rowToEvent(row));
      }
    } catch (error) {
      console.error(`Error creating recurring event for date ${eventData.date}:`, error);
      // Continua criando os outros eventos mesmo se um falhar
    }
  }

  return createdEvents;
}

/** Busca eventos do usuário por título (case-insensitive, parcial). */
export async function searchEventsByUserId(userId: string, query: string): Promise<Event[]> {
  if (!query || query.trim().length === 0) {
    return getEventsByUserId(userId);
  }
  const sql = getNeon();
  const pattern = `%${query.trim().toLowerCase()}%`;
  const rows = await sql`
    SELECT * FROM events
    WHERE user_id = ${userId}
      AND LOWER(title) LIKE ${pattern}
    ORDER BY date DESC
    LIMIT 50
  `;
  return (rows as Record<string, unknown>[]).map(rowToEvent);
}
