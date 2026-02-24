-- Permite até 2 usos por dia do mesmo consumível (usa coluna uses_count)

ALTER TABLE game_consumable_use
  ADD COLUMN IF NOT EXISTS uses_count INT NOT NULL DEFAULT 1 CHECK (uses_count >= 1 AND uses_count <= 2);
