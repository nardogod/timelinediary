// Versão mockada das funções DB para funcionar sem Supabase
// Usa localStorage e estruturas em memória

import { Event, User, Folder, TelegramUser, TelegramLinkToken } from './types';

// Armazenamento em memória (será sincronizado com localStorage)
let mockEvents: Event[] = [];
let mockUsers: User[] = [];
let mockFolders: Folder[] = [];
let mockTelegramUsers: TelegramUser[] = [];
let mockTelegramTokens: TelegramLinkToken[] = [];

// Carregar dados do localStorage ao iniciar
if (typeof window !== 'undefined') {
  try {
    const storedEvents = localStorage.getItem('timeline_events');
    if (storedEvents) mockEvents = JSON.parse(storedEvents);

    const storedUsers = localStorage.getItem('timeline_db_users');
    if (storedUsers) mockUsers = JSON.parse(storedUsers);

    const storedFolders = localStorage.getItem('timeline_db_folders');
    if (storedFolders) mockFolders = JSON.parse(storedFolders);

    const storedTelegramUsers = localStorage.getItem('timeline_telegram_users');
    if (storedTelegramUsers) mockTelegramUsers = JSON.parse(storedTelegramUsers);

    const storedTelegramTokens = localStorage.getItem('timeline_telegram_tokens');
    if (storedTelegramTokens) mockTelegramTokens = JSON.parse(storedTelegramTokens);
  } catch (e) {
    console.error('Error loading mock data:', e);
  }
}

// Função helper para salvar no localStorage
function saveToStorage(key: string, data: any) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }
}

// ===== USERS =====
export async function getUserById(userId: string): Promise<User | null> {
  return mockUsers.find(u => u.id === userId) || null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  return mockUsers.find(u => u.username === username) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return mockUsers.find(u => u.email === email) || null;
}

export async function createUser(userData: {
  id?: string;
  email: string;
  username: string;
  name: string;
  avatar?: string | null;
  password_hash: string;
}): Promise<User | null> {
  const newUser: User = {
    id: userData.id || `user-${Date.now()}`,
    email: userData.email,
    username: userData.username,
    name: userData.name,
    avatar: userData.avatar || null,
    created_at: new Date().toISOString(),
  };

  mockUsers.push(newUser);
  saveToStorage('timeline_db_users', mockUsers);
  return newUser;
}

// ===== EVENTS =====
export async function getEventsByUserId(userId: string): Promise<Event[]> {
  return mockEvents
    .filter(e => e.user_id === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getEventsByUsername(username: string): Promise<Event[]> {
  const user = await getUserByUsername(username);
  if (!user) return [];
  return getEventsByUserId(user.id);
}

export async function createEvent(eventData: {
  user_id: string;
  title: string;
  date: string;
  end_date?: string | null;
  type: 'simple' | 'medium' | 'important';
  link?: string | null;
  folder_id?: string | null;
}): Promise<Event | null> {
  const newEvent: Event = {
    id: `event-${Date.now()}`,
    user_id: eventData.user_id,
    title: eventData.title.trim(),
    date: eventData.date,
    end_date: eventData.end_date || null,
    type: eventData.type,
    link: eventData.link || null,
    folder_id: eventData.folder_id || null,
    created_at: new Date().toISOString(),
  };

  mockEvents.push(newEvent);
  saveToStorage('timeline_events', mockEvents);
  return newEvent;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<Event, 'id' | 'user_id' | 'created_at'>>
): Promise<Event | null> {
  const index = mockEvents.findIndex(e => e.id === eventId);
  if (index === -1) return null;

  mockEvents[index] = { ...mockEvents[index], ...updates };
  saveToStorage('timeline_events', mockEvents);
  return mockEvents[index];
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const index = mockEvents.findIndex(e => e.id === eventId);
  if (index === -1) return false;

  mockEvents.splice(index, 1);
  saveToStorage('timeline_events', mockEvents);
  return true;
}

// ===== FOLDERS =====
export async function getFoldersByUserId(userId: string): Promise<Folder[]> {
  return mockFolders
    .filter(f => f.user_id === userId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function createFolder(folderData: {
  user_id: string;
  name: string;
  color: string;
}): Promise<Folder | null> {
  const newFolder: Folder = {
    id: `folder-${Date.now()}`,
    user_id: folderData.user_id,
    name: folderData.name.trim(),
    color: folderData.color,
    folder_type: null,
    created_at: new Date().toISOString(),
  };

  mockFolders.push(newFolder);
  saveToStorage('timeline_db_folders', mockFolders);
  return newFolder;
}

export async function updateFolder(
  folderId: string,
  updates: Partial<Omit<Folder, 'id' | 'user_id' | 'created_at'>>
): Promise<Folder | null> {
  const index = mockFolders.findIndex(f => f.id === folderId);
  if (index === -1) return null;

  mockFolders[index] = { ...mockFolders[index], ...updates };
  saveToStorage('timeline_db_folders', mockFolders);
  return mockFolders[index];
}

export async function deleteFolder(folderId: string): Promise<boolean> {
  const index = mockFolders.findIndex(f => f.id === folderId);
  if (index === -1) return false;

  mockFolders.splice(index, 1);
  saveToStorage('timeline_db_folders', mockFolders);
  return true;
}

// ===== TELEGRAM =====
export async function getTelegramUserByTelegramId(telegramId: number): Promise<TelegramUser | null> {
  return mockTelegramUsers.find(tu => tu.telegram_id === telegramId) || null;
}

export async function getTelegramUserByUserId(userId: string): Promise<TelegramUser | null> {
  return mockTelegramUsers.find(tu => tu.user_id === userId) || null;
}

export async function linkTelegramUser(data: {
  user_id: string;
  telegram_id: number;
  telegram_username?: string | null;
}): Promise<TelegramUser | null> {
  // Verificar se já existe vinculação
  const existing = mockTelegramUsers.find(tu => tu.user_id === data.user_id);
  if (existing) {
    // Atualizar existente
    existing.telegram_id = data.telegram_id;
    existing.telegram_username = data.telegram_username || null;
    existing.linked_at = new Date().toISOString();
    saveToStorage('timeline_telegram_users', mockTelegramUsers);
    return existing;
  }

  const newLink: TelegramUser = {
    id: `telegram-${Date.now()}`,
    user_id: data.user_id,
    telegram_id: data.telegram_id,
    telegram_username: data.telegram_username || null,
    linked_at: new Date().toISOString(),
  };

  mockTelegramUsers.push(newLink);
  saveToStorage('timeline_telegram_users', mockTelegramUsers);
  return newLink;
}

export async function unlinkTelegramUser(userId: string): Promise<boolean> {
  const index = mockTelegramUsers.findIndex(tu => tu.user_id === userId);
  if (index === -1) return false;

  mockTelegramUsers.splice(index, 1);
  saveToStorage('timeline_telegram_users', mockTelegramUsers);
  return true;
}

export async function generateLinkToken(userId: string, expiresInHours: number = 24): Promise<string | null> {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const newToken: TelegramLinkToken = {
    id: `token-${Date.now()}`,
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
  };

  mockTelegramTokens.push(newToken);
  saveToStorage('timeline_telegram_tokens', mockTelegramTokens);
  return token;
}

export async function validateAndUseToken(token: string): Promise<{ user_id: string } | null> {
  const now = new Date().toISOString();
  const tokenData = mockTelegramTokens.find(
    t => t.token === token && t.expires_at > now
  );

  if (!tokenData) return null;

  // Remover token após uso
  const index = mockTelegramTokens.findIndex(t => t.id === tokenData.id);
  if (index !== -1) {
    mockTelegramTokens.splice(index, 1);
    saveToStorage('timeline_telegram_tokens', mockTelegramTokens);
  }

  return { user_id: tokenData.user_id };
}

export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date().toISOString();
  mockTelegramTokens = mockTelegramTokens.filter(t => t.expires_at > now);
  saveToStorage('timeline_telegram_tokens', mockTelegramTokens);
}
