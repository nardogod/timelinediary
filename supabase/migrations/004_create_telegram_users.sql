-- Criar tabela de vinculação Telegram
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, telegram_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);

-- RLS Policies
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas suas próprias vinculações
CREATE POLICY "Users can view own telegram link"
  ON telegram_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram link"
  ON telegram_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram link"
  ON telegram_users FOR DELETE
  USING (auth.uid() = user_id);
