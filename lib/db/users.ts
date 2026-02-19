import { getNeon } from '@/lib/neon';
import { User } from './types';

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email),
    username: String(row.username),
    name: String(row.name),
    avatar: row.avatar != null ? String(row.avatar) : null,
    created_at: String(row.created_at),
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT id, email, username, name, avatar, created_at
    FROM users WHERE id = ${userId} LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToUser(row) : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT id, email, username, name, avatar, created_at
    FROM users WHERE username = ${username} LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToUser(row) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT id, email, username, name, avatar, created_at
    FROM users WHERE email = ${email} LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToUser(row) : null;
}

/** Lista usuários para descoberta (perfil público: id, username, name, avatar). */
export async function getAllUsers(): Promise<Pick<User, 'id' | 'username' | 'name' | 'avatar'>[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT id, username, name, avatar FROM users ORDER BY created_at DESC
  `;
  return (rows as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    username: String(row.username),
    name: String(row.name),
    avatar: row.avatar != null ? String(row.avatar) : null,
  }));
}

/** Usuários em destaque na página inicial (Leo1, teste@teste, Loid). */
export async function getFeaturedUsers(): Promise<Pick<User, 'id' | 'username' | 'name' | 'avatar'>[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT id, username, name, avatar FROM users
    WHERE LOWER(TRIM(username)) = ${'leo1'}
       OR LOWER(TRIM(username)) = ${'teste@teste'}
       OR LOWER(TRIM(username)) = ${'loid'}
    ORDER BY username
  `;
  return (rows as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    username: String(row.username),
    name: String(row.name),
    avatar: row.avatar != null ? String(row.avatar) : null,
  }));
}

/** Retorna usuários pelos ids (para lista "quem você segue"). */
export async function getUsersByIds(ids: string[]): Promise<Pick<User, 'id' | 'username' | 'name' | 'avatar'>[]> {
  if (ids.length === 0) return [];
  const sql = getNeon();
  const rows = await sql`
    SELECT id, username, name, avatar FROM users
    WHERE id = ANY(${ids})
  `;
  const order = new Map(ids.map((id, i) => [id, i]));
  return (rows as Record<string, unknown>[])
    .map((row) => ({
      id: String(row.id),
      username: String(row.username),
      name: String(row.name),
      avatar: row.avatar != null ? String(row.avatar) : null,
    }))
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

/** Busca usuários por nome ou username (case-insensitive, parcial). Query vazia retorna []. */
export async function searchUsers(query: string): Promise<Pick<User, 'id' | 'username' | 'name' | 'avatar'>[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  const sql = getNeon();
  const pattern = `%${query.trim().toLowerCase()}%`;
  const rows = await sql`
    SELECT id, username, name, avatar FROM users
    WHERE LOWER(name) LIKE ${pattern}
       OR LOWER(username) LIKE ${pattern}
    ORDER BY username
    LIMIT 20
  `;
  return (rows as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    username: String(row.username),
    name: String(row.name),
    avatar: row.avatar != null ? String(row.avatar) : null,
  }));
}

/** Para login: retorna id + password_hash (não expor em API pública). */
export async function getUserAuthByEmail(email: string): Promise<{ id: string; password_hash: string } | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT id, password_hash FROM users WHERE email = ${email} LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  if (!row) return null;
  return { id: String(row.id), password_hash: String(row.password_hash) };
}

export async function createUser(userData: {
  email: string;
  username: string;
  name: string;
  avatar?: string;
  password_hash: string;
  id?: string;
}): Promise<User | null> {
  const sql = getNeon();
  const id = userData.id ?? crypto.randomUUID();
  await sql`
    INSERT INTO users (id, email, username, name, avatar, password_hash)
    VALUES (
      ${id},
      ${userData.email},
      ${userData.username},
      ${userData.name},
      ${userData.avatar ?? null},
      ${userData.password_hash}
    )
  `;
  return getUserById(id);
}

export async function updateUser(userId: string, updates: Partial<Pick<User, 'email' | 'username' | 'name' | 'avatar'>>): Promise<User | null> {
  const existing = await getUserById(userId);
  if (!existing) return null;
  const email = updates.email ?? existing.email;
  const username = updates.username ?? existing.username;
  const name = updates.name ?? existing.name;
  const avatar = updates.avatar !== undefined ? updates.avatar : existing.avatar;

  const sql = getNeon();
  await sql`
    UPDATE users
    SET email = ${email}, username = ${username}, name = ${name}, avatar = ${avatar}
    WHERE id = ${userId}
  `;
  return getUserById(userId);
}
