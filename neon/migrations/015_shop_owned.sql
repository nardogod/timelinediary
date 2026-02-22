-- Migration: Loja – itens possuídos (capas, avatares, pets)
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-015.mjs

CREATE TABLE IF NOT EXISTS game_owned_items (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL,
  item_id VARCHAR(80) NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_game_owned_items_user ON game_owned_items(user_id);
COMMENT ON TABLE game_owned_items IS 'Itens comprados na loja (capas, avatares, pets). item_type: cover, avatar, pet.';
