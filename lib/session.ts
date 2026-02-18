/**
 * Sessão via cookie assinado (Neon auth).
 * Use AUTH_SECRET no .env.local para assinar o cookie.
 */
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'timeline_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET must be set and at least 16 characters (use: openssl rand -base64 24)');
  }
  return secret;
}

function sign(value: string): string {
  const secret = getSecret();
  const hmac = createHmac('sha256', secret);
  hmac.update(value);
  return hmac.digest('hex');
}

function verify(value: string, signature: string): boolean {
  try {
    const expected = sign(value);
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  const [userId, sig] = cookie.value.split('.');
  if (!userId || !sig || !verify(userId, sig)) return null;
  return userId;
}

export function createSessionCookie(userId: string): string {
  const signature = sign(userId);
  return `${userId}.${signature}`;
}

export async function setSessionCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const value = createSessionCookie(userId);
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
