// Sistema de vinculação Telegram mockado (localStorage)

export interface TelegramLink {
  userId: string;
  telegramId: number;
  telegramUsername: string | null;
  linkedAt: string;
}

export interface TelegramToken {
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

const STORAGE_KEY_TELEGRAM_LINKS = 'timeline_telegram_links';
const STORAGE_KEY_TELEGRAM_TOKENS = 'timeline_telegram_tokens';

// Função para obter links salvos
function getTelegramLinks(): TelegramLink[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_TELEGRAM_LINKS);
  return stored ? JSON.parse(stored) : [];
}

// Função para salvar links
function saveTelegramLinks(links: TelegramLink[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TELEGRAM_LINKS, JSON.stringify(links));
}

// Função para obter tokens salvos
function getTelegramTokens(): TelegramToken[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_TELEGRAM_TOKENS);
  return stored ? JSON.parse(stored) : [];
}

// Função para salvar tokens
function saveTelegramTokens(tokens: TelegramToken[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TELEGRAM_TOKENS, JSON.stringify(tokens));
}

// Buscar link por telegram_id
export function getTelegramLinkByTelegramId(telegramId: number): TelegramLink | null {
  const links = getTelegramLinks();
  return links.find(link => link.telegramId === telegramId) || null;
}

// Buscar link por user_id
export function getTelegramLinkByUserId(userId: string): TelegramLink | null {
  const links = getTelegramLinks();
  return links.find(link => link.userId === userId) || null;
}

// Vincular conta Telegram
export function linkTelegramAccount(data: {
  userId: string;
  telegramId: number;
  telegramUsername?: string | null;
}): TelegramLink {
  const links = getTelegramLinks();
  
  // Remover link existente se houver
  const filtered = links.filter(link => 
    link.userId !== data.userId && link.telegramId !== data.telegramId
  );
  
  const newLink: TelegramLink = {
    userId: data.userId,
    telegramId: data.telegramId,
    telegramUsername: data.telegramUsername || null,
    linkedAt: new Date().toISOString(),
  };
  
  filtered.push(newLink);
  saveTelegramLinks(filtered);
  
  return newLink;
}

// Desvincular conta Telegram
export function unlinkTelegramAccount(userId: string): boolean {
  const links = getTelegramLinks();
  const filtered = links.filter(link => link.userId !== userId);
  saveTelegramLinks(filtered);
  return filtered.length < links.length;
}

// Gerar token de vinculação
export function generateLinkToken(userId: string, expiresInHours: number = 24): string {
  const tokens = getTelegramTokens();
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);
  
  const newToken: TelegramToken = {
    userId,
    token,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  };
  
  tokens.push(newToken);
  saveTelegramTokens(tokens);
  
  return token;
}

// Validar e usar token
export function validateAndUseToken(token: string): { userId: string } | null {
  const tokens = getTelegramTokens();
  const now = new Date().toISOString();
  
  const tokenData = tokens.find(t => 
    t.token === token && t.expiresAt > now
  );
  
  if (!tokenData) return null;
  
  // Remover token usado
  const filtered = tokens.filter(t => t.token !== token);
  saveTelegramTokens(filtered);
  
  return { userId: tokenData.userId };
}

// Limpar tokens expirados
export function cleanupExpiredTokens(): void {
  const tokens = getTelegramTokens();
  const now = new Date().toISOString();
  const filtered = tokens.filter(t => t.expiresAt > now);
  saveTelegramTokens(filtered);
}
