-- Migration: Missões do Meu Mundo (desbloqueio de itens por requisitos)
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-016.mjs

CREATE TABLE IF NOT EXISTS game_user_missions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id VARCHAR(80) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_game_user_missions_user ON game_user_missions(user_id);
COMMENT ON TABLE game_user_missions IS 'Missões concluídas pelo usuário (recompensa já concedida).';
