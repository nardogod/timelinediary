-- Posição vertical da capa (0 = topo, 100 = base; 50 = centro). Permite ajustar a foto de fundo para cima ou para baixo.
ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS cover_position_y INTEGER DEFAULT 50 CHECK (cover_position_y >= 0 AND cover_position_y <= 100);

COMMENT ON COLUMN game_profiles.cover_position_y IS 'Posição vertical da imagem da capa em % (0=topo, 100=base). object-position: center cover_position_y%.';
