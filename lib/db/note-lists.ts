import { getNeon } from '@/lib/neon';
import { NoteList } from './types';

function rowToNoteList(row: Record<string, unknown>): NoteList {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    folder_id: String(row.folder_id),
    name: String(row.name),
    color: String(row.color),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getNoteListsByFolderId(folderId: string, userId: string): Promise<NoteList[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM note_lists
    WHERE folder_id = ${folderId} AND user_id = ${userId}
    ORDER BY name ASC
  `;
  return (rows as Record<string, unknown>[]).map(rowToNoteList);
}

export async function getNoteListById(listId: string): Promise<NoteList | null> {
  const sql = getNeon();
  const rows = await sql`SELECT * FROM note_lists WHERE id = ${listId} LIMIT 1`;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToNoteList(row) : null;
}

export async function createNoteList(listData: {
  user_id: string;
  folder_id: string;
  name: string;
  color?: string;
}): Promise<NoteList | null> {
  const sql = getNeon();
  const rows = await sql`
    INSERT INTO note_lists (user_id, folder_id, name, color)
    VALUES (
      ${listData.user_id},
      ${listData.folder_id},
      ${listData.name.trim()},
      ${listData.color || '#64748b'}
    )
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToNoteList(row) : null;
}

export async function updateNoteList(
  listId: string,
  updates: Partial<{
    name: string;
    color: string;
  }>
): Promise<NoteList | null> {
  const existing = await getNoteListById(listId);
  if (!existing) return null;

  const name = updates.name !== undefined ? updates.name.trim() : existing.name;
  const color = updates.color !== undefined ? updates.color : existing.color;

  const sql = getNeon();
  const rows = await sql`
    UPDATE note_lists
    SET name = ${name},
        color = ${color}
    WHERE id = ${listId}
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToNoteList(row) : null;
}

export async function deleteNoteList(listId: string): Promise<boolean> {
  const sql = getNeon();
  const rows = await sql`DELETE FROM note_lists WHERE id = ${listId} RETURNING id`;
  return (rows as unknown[]).length > 0;
}
