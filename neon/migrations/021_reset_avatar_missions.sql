-- Migration: Reset das missões de avatar — ninguém deve ter avatares desbloqueados por missão.
-- A partir de agora as missões de avatar (avatar_1_1, avatar_1_2, ...) só são concedidas ao completar tarefas.
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-021.mjs

DELETE FROM game_user_missions
WHERE mission_id LIKE 'avatar_%';

COMMENT ON TABLE game_user_missions IS 'Missões concluídas pelo usuário (recompensa já concedida). Avatar missions granted only on task completion.';
