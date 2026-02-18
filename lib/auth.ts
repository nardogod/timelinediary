/**
 * Autenticação com Neon (API routes + cookie de sessão).
 * Login/registro chamam /api/auth/* e a sessão é mantida por cookie.
 */
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar: string;
}

export async function loginClient(email: string, password: string): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.hint ? `${err.error || 'Erro ao fazer login'}. ${err.hint}` : (err.error || 'Email ou senha incorretos.');
    throw new Error(msg);
  }
  const data = await res.json();
  const user = data.user as AuthUser;
  if (user && typeof window !== 'undefined') {
    localStorage.setItem('timeline_user', JSON.stringify(user));
  }
  return user ?? null;
}

export async function registerClient(
  email: string,
  password: string,
  username: string,
  name: string
): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.hint ? `${err.error || 'Erro ao registrar'}. ${err.hint}` : (err.error || 'Erro ao registrar');
    throw new Error(msg);
  }
  const data = await res.json();
  const user = data.user as AuthUser;
  if (user && typeof window !== 'undefined') {
    localStorage.setItem('timeline_user', JSON.stringify(user));
  }
  return user ?? null;
}

export async function getCurrentUserClient(): Promise<AuthUser | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    if (data.user) {
      localStorage.setItem('timeline_user', JSON.stringify(data.user));
      return data.user as AuthUser;
    }
    localStorage.removeItem('timeline_user');
    return null;
  } catch {
    const saved = localStorage.getItem('timeline_user');
    if (saved) {
      try {
        return JSON.parse(saved) as AuthUser;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function logoutClient(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('timeline_user');
    await fetch('/api/auth/logout', { method: 'POST' });
  }
}

const getFollowsKey = (userId: string): string => `timeline_follows_${userId}`;

export function followUser(userId: string, targetUserId: string): void {
  if (typeof window === 'undefined') return;
  const follows = getFollows(userId);
  if (!follows.includes(targetUserId)) {
    follows.push(targetUserId);
    localStorage.setItem(getFollowsKey(userId), JSON.stringify(follows));
  }
}

export function unfollowUser(userId: string, targetUserId: string): void {
  if (typeof window === 'undefined') return;
  const follows = getFollows(userId);
  const index = follows.indexOf(targetUserId);
  if (index > -1) {
    follows.splice(index, 1);
    localStorage.setItem(getFollowsKey(userId), JSON.stringify(follows));
  }
}

export function isFollowing(userId: string, targetUserId: string): boolean {
  if (typeof window === 'undefined') return false;
  return getFollows(userId).includes(targetUserId);
}

function getFollows(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getFollowsKey(userId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getFollowedUsers(userId: string): string[] {
  return getFollows(userId);
}
