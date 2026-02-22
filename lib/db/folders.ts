import { getNeon } from '@/lib/neon';
import { Folder, type FolderType } from './types';
import { DEFAULT_FOLDER_NAMES, DEFAULT_FOLDER_COLORS } from '@/lib/game/folder-types';

function rowToFolder(row: Record<string, unknown>): Folder {
  const ft = row.folder_type;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    color: String(row.color),
    is_private: row.is_private != null ? Boolean(row.is_private) : false,
    folder_type: ft != null && typeof ft === 'string' && ['trabalho', 'estudos', 'lazer', 'tarefas_pessoais'].includes(ft) ? (ft as FolderType) : null,
    created_at: String(row.created_at),
  };
}

export async function getFoldersByUserId(userId: string): Promise<Folder[]> {
  const sql = getNeon();
  let rows = await sql`
    SELECT * FROM folders
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
  `;
  if ((rows as unknown[]).length === 0) {
    await ensureDefaultFolders(userId);
    rows = await sql`
      SELECT * FROM folders WHERE user_id = ${userId} ORDER BY created_at ASC
    `;
  }
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
  folder_type?: FolderType | null;
}): Promise<Folder | null> {
  const sql = getNeon();
  const rows = await sql`
    INSERT INTO folders (user_id, name, color, is_private, folder_type)
    VALUES (${folderData.user_id}, ${folderData.name.trim()}, ${folderData.color}, ${folderData.is_private ?? false}, ${folderData.folder_type ?? null})
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
  const folder_type = updates.folder_type !== undefined ? updates.folder_type : existing.folder_type;

  const sql = getNeon();
  const rows = await sql`
    UPDATE folders SET name = ${name}, color = ${color}, is_private = ${is_private}, folder_type = ${folder_type ?? null}
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

/** Cria as 4 pastas padrão (Trabalho, Estudos, Lazer, Tarefas pessoais) se o usuário não tiver nenhuma. Chamado por getFoldersByUserId quando a lista está vazia. */
export async function ensureDefaultFolders(userId: string): Promise<void> {
  const sql = getNeon();
  const types: FolderType[] = ['trabalho', 'estudos', 'lazer', 'tarefas_pessoais'];
  for (const t of types) {
    await sql`
      INSERT INTO folders (user_id, name, color, is_private, folder_type)
      VALUES (${userId}, ${DEFAULT_FOLDER_NAMES[t]}, ${DEFAULT_FOLDER_COLORS[t]}, false, ${t})
      ON CONFLICT (user_id, name) DO NOTHING
    `;
  }
}
