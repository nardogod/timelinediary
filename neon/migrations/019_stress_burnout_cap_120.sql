-- Burnout: permitir stress acima de 100% até 120% (piora a situação até o jogador relaxar).
-- Remove o limite 100 e passa a aceitar 0..120.
-- Se o nome do constraint for outro, descubra com: SELECT conname FROM pg_constraint WHERE conrelid = 'game_profiles'::regclass AND contype = 'c';

ALTER TABLE game_profiles
  DROP CONSTRAINT IF EXISTS game_profiles_stress_check;

ALTER TABLE game_profiles
  ADD CONSTRAINT game_profiles_stress_check CHECK (stress >= 0 AND stress <= 120);

COMMENT ON COLUMN game_profiles.stress IS '0-100 normal, 100-120 estado Burnout (trabalho/estudos não dão XP nem moedas até reduzir).';
