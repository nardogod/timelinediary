-- Migration: Ações diárias (Relaxar em casa, Trabalhar) — 1x por dia
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-014.mjs

-- Data (YYYY-MM-DD) do último uso de "Relaxar em casa" (timezone America/Sao_Paulo)
ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS last_relax_at DATE;

-- Data (YYYY-MM-DD) do último uso do bônus "Trabalhar" na sala (mesmo dia = bônus ativo)
ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS last_work_bonus_at DATE;

COMMENT ON COLUMN game_profiles.last_relax_at IS 'Última data em que o usuário usou Relaxar em casa (1x/dia).';
COMMENT ON COLUMN game_profiles.last_work_bonus_at IS 'Data em que o usuário ativou o bônus Trabalhar (naquele dia: mais moedas, menos stress).';
