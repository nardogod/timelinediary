-- Migration: Tipo de pasta (trabalho, estudos, lazer, tarefas_pessoais) para recompensas do jogo
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-018.mjs

ALTER TABLE folders
  ADD COLUMN IF NOT EXISTS folder_type VARCHAR(30);

COMMENT ON COLUMN folders.folder_type IS 'trabalho | estudos | lazer | tarefas_pessoais — define recompensas ao concluir tarefa (XP, moedas, saúde, stress).';

-- Tipos de atividade para cada pasta (recompensas vêm do código; aqui só referência)
INSERT INTO game_activity_types (id, label_pt, coins, xp, health_change, stress_change) VALUES
  ('estudos', 'Estudos', 0, 55, -3, 8),
  ('lazer', 'Lazer', 0, 0, 12, -8),
  ('tarefas_pessoais', 'Tarefas pessoais', 0, 0, 5, -4)
ON CONFLICT (id) DO NOTHING;
