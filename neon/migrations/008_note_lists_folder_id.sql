-- Migration: Adicionar folder_id em note_lists para vincular listas a pastas específicas
-- Execute no Neon SQL Editor

-- 1. Adicionar campo folder_id em note_lists
ALTER TABLE note_lists
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE CASCADE;

-- 2. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_note_lists_folder_id ON note_lists(folder_id);
CREATE INDEX IF NOT EXISTS idx_note_lists_user_folder ON note_lists(user_id, folder_id);

-- 3. Atualizar constraint UNIQUE para incluir folder_id (permite mesmo nome em pastas diferentes)
ALTER TABLE note_lists
DROP CONSTRAINT IF EXISTS note_lists_user_id_name_key;

ALTER TABLE note_lists
ADD CONSTRAINT note_lists_user_folder_name_unique UNIQUE(user_id, folder_id, name);

COMMENT ON COLUMN note_lists.folder_id IS 'ID da pasta à qual a lista pertence (obrigatório)';
