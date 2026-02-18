-- Criar tabela de eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  end_date DATE,
  type TEXT NOT NULL CHECK (type IN ('simple', 'medium', 'important')),
  link TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_folder_id ON events(folder_id);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, date DESC);

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver eventos próprios e públicos de outros usuários
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id OR true); -- Permitir leitura pública

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);
