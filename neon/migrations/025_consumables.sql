-- Consumíveis: estoque por usuário e uso por dia (não acumulativo)
-- Execute no Neon SQL Editor ou via script.

CREATE TABLE IF NOT EXISTS game_consumable_owned (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consumable_id VARCHAR(80) NOT NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0 AND quantity <= 10),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, consumable_id)
);

CREATE INDEX IF NOT EXISTS idx_game_consumable_owned_user ON game_consumable_owned(user_id);

CREATE TABLE IF NOT EXISTS game_consumable_use (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consumable_id VARCHAR(80) NOT NULL,
  used_date DATE NOT NULL,
  PRIMARY KEY (user_id, consumable_id, used_date)
);

CREATE INDEX IF NOT EXISTS idx_game_consumable_use_user_date ON game_consumable_use(user_id, used_date);
