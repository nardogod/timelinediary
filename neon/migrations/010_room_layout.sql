-- Migration: Layout da sala de trabalho (posições arrastáveis) por usuário
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-010.mjs

-- Coluna JSONB em game_profiles: { itemId: { left, bottom }, ... } em pixels (área 380x340)
ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS room_layout_trabalho JSONB;

COMMENT ON COLUMN game_profiles.room_layout_trabalho IS 'Posições dos itens na sala de trabalho (left/bottom px). Chaves: mesa, cadeira, personagem, estante, luminaria, plantinha.';
