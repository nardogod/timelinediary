// Tipos compartilhados para o banco de dados

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar: string | null;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  date: string;
  end_date: string | null;
  type: 'simple' | 'medium' | 'important';
  link: string | null;
  folder_id: string | null;
  created_at: string;
}

export interface TelegramUser {
  id: string;
  user_id: string;
  telegram_id: number;
  telegram_username: string | null;
  linked_at: string;
}

export interface TelegramLinkToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}
