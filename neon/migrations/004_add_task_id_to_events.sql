-- Migration: Adicionar campo task_id em events para relacionar eventos de tarefas concluídas
-- Execute no Neon SQL Editor

-- Adicionar campo task_id na tabela events (opcional, para eventos de tarefas concluídas)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_task_id ON events(task_id);
