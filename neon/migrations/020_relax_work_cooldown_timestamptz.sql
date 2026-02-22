-- Migration: Relaxar e Trabalhar com cooldown de 3 horas (timestamp)
-- Converte last_relax_at e last_work_bonus_at de DATE para TIMESTAMPTZ.
-- Valores existentes (data apenas) são interpretados como meia-noite em America/Sao_Paulo.

ALTER TABLE game_profiles
  ALTER COLUMN last_relax_at TYPE TIMESTAMPTZ
  USING (
    CASE
      WHEN last_relax_at IS NULL THEN NULL
      ELSE (last_relax_at::text || ' 00:00:00')::timestamp AT TIME ZONE 'America/Sao_Paulo'
    END
  );

ALTER TABLE game_profiles
  ALTER COLUMN last_work_bonus_at TYPE TIMESTAMPTZ
  USING (
    CASE
      WHEN last_work_bonus_at IS NULL THEN NULL
      ELSE (last_work_bonus_at::text || ' 00:00:00')::timestamp AT TIME ZONE 'America/Sao_Paulo'
    END
  );

COMMENT ON COLUMN game_profiles.last_relax_at IS 'Timestamp do último uso de Relaxar em casa (cooldown 3h).';
COMMENT ON COLUMN game_profiles.last_work_bonus_at IS 'Timestamp do último uso do bônus Trabalhar (cooldown 3h).';
