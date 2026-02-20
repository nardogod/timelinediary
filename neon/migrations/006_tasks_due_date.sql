-- Migration: Adicionar data de vencimento opcional em tasks (para lembretes "vence amanhã")
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS due_date DATE;

CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;

COMMENT ON COLUMN tasks.due_date IS 'Data de vencimento opcional; usada para notificações Telegram "vence amanhã"';
