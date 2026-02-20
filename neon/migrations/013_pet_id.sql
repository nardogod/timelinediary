-- Migration: Pet escolhido no perfil (Meu Mundo)
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-013.mjs

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS pet_id VARCHAR(80);

COMMENT ON COLUMN game_profiles.pet_id IS 'Id do pet escolhido (ex pet1, pet2 - lista em lib/game/pet-assets.ts).';
