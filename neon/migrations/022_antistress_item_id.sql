-- Migration: Slot de item anti-stress (Guardião) equipado no perfil
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-022.mjs

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS antistress_item_id VARCHAR(80);

COMMENT ON COLUMN game_profiles.antistress_item_id IS 'Item de Guardião equipado no slot anti-stress (lib/game/guardian-items.ts). Apenas se comprado na loja após desbloquear pela missão.';

-- Permitir item_type guardian_item em game_owned_items (já aceita qualquer VARCHAR)
-- Nenhuma alteração em game_owned_items necessária.
