-- Migration: Casas e salas de trabalho (Fase 6) — compra, seleção ativa, bônus diferentes
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-017.mjs

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS current_house_id VARCHAR(50);

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS current_work_room_id VARCHAR(50);

CREATE TABLE IF NOT EXISTS game_owned_rooms (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_type VARCHAR(20) NOT NULL,
  room_id VARCHAR(50) NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, room_type, room_id)
);

CREATE INDEX IF NOT EXISTS idx_game_owned_rooms_user ON game_owned_rooms(user_id);
COMMENT ON COLUMN game_profiles.current_house_id IS 'Casa ativa (ex: casa_1). Bônus ao relaxar varia por casa.';
COMMENT ON COLUMN game_profiles.current_work_room_id IS 'Sala de trabalho ativa (ex: sala_1). Bônus ao ativar Trabalhar varia por sala.';
