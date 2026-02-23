-- Migration: Garantir que todos os usuários tenham capa default e nenhum pet
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-024.mjs
-- Não altera nível, moedas, saúde, stress ou outros dados; apenas capa e pet.

-- 1. Remove da lista de itens possuídos qualquer capa ou pet (todos ficam só com o padrão)
DELETE FROM game_owned_items
WHERE item_type IN ('cover', 'pet');

-- 2. Em todos os perfis de jogo: capa = default, pet = null
UPDATE game_profiles
SET
  cover_id = 'default',
  pet_id = null,
  updated_at = NOW();
