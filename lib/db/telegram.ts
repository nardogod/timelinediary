import { getNeon } from '@/lib/neon';
import { TelegramUser, TelegramLinkToken } from './types';
import { randomBytes } from 'crypto';

function rowToTelegramUser(row: Record<string, unknown>): TelegramUser {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    telegram_id: Number(row.telegram_id),
    telegram_username: row.telegram_username != null ? String(row.telegram_username) : null,
    linked_at: String(row.linked_at),
  };
}

export async function getTelegramUserByTelegramId(telegramId: number): Promise<TelegramUser | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM telegram_users WHERE telegram_id = ${telegramId} LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToTelegramUser(row) : null;
}

export async function getTelegramUserByUserId(userId: string): Promise<TelegramUser | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM telegram_users WHERE user_id = ${userId} LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToTelegramUser(row) : null;
}

/** Lista todos os usuários com Telegram vinculado (para notificações em lote) */
export async function getAllLinkedTelegramUsers(): Promise<TelegramUser[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM telegram_users ORDER BY user_id
  `;
  return (rows as Record<string, unknown>[]).map(rowToTelegramUser);
}

export async function linkTelegramUser(data: {
  user_id: string;
  telegram_id: number;
  telegram_username?: string | null;
}): Promise<TelegramUser | null> {
  const sql = getNeon();
  const rows = await sql`
    INSERT INTO telegram_users (user_id, telegram_id, telegram_username)
    VALUES (${data.user_id}, ${data.telegram_id}, ${data.telegram_username ?? null})
    ON CONFLICT (user_id, telegram_id) DO UPDATE SET telegram_username = EXCLUDED.telegram_username
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToTelegramUser(row) : null;
}

export async function unlinkTelegramUser(userId: string): Promise<boolean> {
  const sql = getNeon();
  const rows = await sql`DELETE FROM telegram_users WHERE user_id = ${userId} RETURNING id`;
  return (rows as unknown[]).length > 0;
}

export async function generateLinkToken(userId: string, expiresInHours: number = 24): Promise<string | null> {
  const sql = getNeon();
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  await sql`
    INSERT INTO telegram_link_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `;
  return token;
}

export async function validateAndUseToken(token: string): Promise<{ user_id: string } | null> {
  const sql = getNeon();
  const now = new Date().toISOString();
  const rows = await sql`
    SELECT user_id FROM telegram_link_tokens
    WHERE token = ${token} AND expires_at > ${now}
    LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  if (!row) return null;

  await sql`DELETE FROM telegram_link_tokens WHERE token = ${token}`;
  return { user_id: String(row.user_id) };
}

export async function cleanupExpiredTokens(): Promise<void> {
  const sql = getNeon();
  await sql`DELETE FROM telegram_link_tokens WHERE expires_at < NOW()`;
}
