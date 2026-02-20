-- Migration: Criar tabela note_lists e adicionar campos color e note_list_id em tasks
-- Execute no Neon SQL Editor

-- 1. Criar tabela note_lists (listas de notas independentes de folders)
CREATE TABLE IF NOT EXISTS note_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_note_lists_user_id ON note_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_note_lists_user_name ON note_lists(user_id, name);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_note_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER note_lists_updated_at
  BEFORE UPDATE ON note_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_note_lists_updated_at();

-- 2. Adicionar campo color em tasks (cor personalizada para cada tarefa)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS color TEXT;

-- 3. Adicionar campo note_list_id em tasks (opcional, mantém compatibilidade com folder_id)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS note_list_id UUID REFERENCES note_lists(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_note_list_id ON tasks(note_list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_note_list ON tasks(user_id, note_list_id) WHERE note_list_id IS NOT NULL;

COMMENT ON COLUMN tasks.color IS 'Cor personalizada da tarefa (hex, ex: #ec4899)';
COMMENT ON COLUMN tasks.note_list_id IS 'ID da lista de notas (opcional, pode usar folder_id ou note_list_id)';
