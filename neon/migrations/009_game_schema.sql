-- Migration: Schema do jogo (Meu Mundo) - perfis, tipos de atividade, atividades, histórico saúde/stress
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-009.mjs

-- 1. Perfil do jogo (moedas, nível, saúde, stress, profissão, horários)
CREATE TABLE IF NOT EXISTS game_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profession VARCHAR(50),
  coins INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  health INTEGER NOT NULL DEFAULT 100 CHECK (health >= 0 AND health <= 100),
  stress INTEGER NOT NULL DEFAULT 0 CHECK (stress >= 0 AND stress <= 100),
  work_hours_start TIME,
  work_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_profiles_user_id ON game_profiles(user_id);

-- 2. Tipos de atividade e efeitos (tabelado)
CREATE TABLE IF NOT EXISTS game_activity_types (
  id VARCHAR(50) PRIMARY KEY,
  label_pt VARCHAR(100) NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  health_change INTEGER NOT NULL DEFAULT 0,
  stress_change INTEGER NOT NULL DEFAULT 0
);

INSERT INTO game_activity_types (id, label_pt, coins, xp, health_change, stress_change) VALUES
  ('trabalho', 'Trabalho', 150, 50, 0, 20),
  ('cafe_manha', 'Café da manhã', 0, 5, 5, 0),
  ('frutas', 'Frutas', 0, 5, 3, 0),
  ('refeicao', 'Refeição', 0, 10, 10, -5),
  ('academia', 'Academia', 0, 20, 10, -15),
  ('leitura', 'Leitura', 0, 15, 0, -10),
  ('meditacao', 'Meditação', 0, 10, 5, -20),
  ('sono', 'Sono', 0, 0, 20, -30)
ON CONFLICT (id) DO NOTHING;

-- 3. Atividades do usuário (vinculadas a eventos da timeline)
CREATE TABLE IF NOT EXISTS game_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL REFERENCES game_activity_types(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  health_change INTEGER NOT NULL DEFAULT 0,
  stress_change INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_activities_user_date ON game_activities(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_game_activities_event ON game_activities(event_id) WHERE event_id IS NOT NULL;

-- 4. Histórico saúde/stress (para gráficos e debug)
CREATE TABLE IF NOT EXISTS health_stress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  health INTEGER NOT NULL,
  stress INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_stress_user_time ON health_stress_history(user_id, recorded_at);

-- 5. Trigger updated_at para game_profiles
CREATE OR REPLACE FUNCTION update_game_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS game_profiles_updated_at ON game_profiles;
CREATE TRIGGER game_profiles_updated_at
  BEFORE UPDATE ON game_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_game_profiles_updated_at();
