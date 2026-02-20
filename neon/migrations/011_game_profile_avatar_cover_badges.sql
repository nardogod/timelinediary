-- Migration: Avatar, capa e medalhas no perfil do jogo (Meu Mundo)
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-011.mjs

-- Foto de perfil (URL ou path relativo, ex: /game/assets/avatar/default.png)
ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS avatar_image_url VARCHAR(500);

-- Id da capa de fundo escolhida (chave em game_covers ou path, ex: 'nature', 'city')
ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS cover_id VARCHAR(80);

-- IDs das medalhas já conquistadas (array), ex: ['primeira_semana', 'maratonista']
ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS earned_badges JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN game_profiles.avatar_image_url IS 'URL ou path da foto de perfil pixel art do usuário (ex: /game/assets/avatar/meu.png).';
COMMENT ON COLUMN game_profiles.cover_id IS 'Id da capa de fundo pixel art escolhida (lista em lib/game/profile-covers.ts).';
COMMENT ON COLUMN game_profiles.earned_badges IS 'Array de ids de medalhas conquistadas (badges em lib/game/badges.ts).';
