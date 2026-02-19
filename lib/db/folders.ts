import { getNeon } from '@/lib/neon';
import { Folder } from './types';

function rowToFolder(row: Record<string, unknown>): Folder {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    color: String(row.color),
    is_private: row.is_private != null ? Boolean(row.is_private) : false,
    created_at: String(row.created_at),
  };
}

export async function getFoldersByUserId(userId: string): Promise<Folder[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM folders
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
  `;
  return (rows as Record<string, unknown>[]).map(rowToFolder);
}

export async function getFolderById(folderId: string): Promise<Folder | null> {
  const sql = getNeon();
  const rows = await sql`SELECT * FROM folders WHERE id = ${folderId} LIMIT 1`;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToFolder(row) : null;
}

export async function createFolder(folderData: {
  user_id: string;
  name: string;
  color: string;
  is_private?: boolean;
}): Promise<Folder | null> {
  const sql = getNeon();
  const rows = await sql`
    INSERT INTO folders (user_id, name, color, is_private)
    VALUES (${folderData.user_id}, ${folderData.name.trim()}, ${folderData.color}, ${folderData.is_private ?? false})
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToFolder(row) : null;
}

export async function updateFolder(
  folderId: string,
  updates: Partial<Omit<Folder, 'id' | 'user_id' | 'created_at'>>
): Promise<Folder | null> {
  const existing = await getFolderById(folderId);
  if (!existing) return null;
  const name = updates.name ?? existing.name;
  const color = updates.color ?? existing.color;
  const is_private = updates.is_private !== undefined ? updates.is_private : existing.is_private ?? false;

  const sql = getNeon();
  const rows = await sql`
    UPDATE folders SET name = ${name}, color = ${color}, is_private = ${is_private}
    WHERE id = ${folderId}
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToFolder(row) : null;
}

export async function deleteFolder(folderId: string): Promise<boolean> {
  const sql = getNeon();
  const rows = await sql`DELETE FROM folders WHERE id = ${folderId} RETURNING id`;
  return (rows as unknown[]).length > 0;
}
