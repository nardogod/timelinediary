-- Migration: Reset do Meu Mundo para TODOS os usuários (nível inicial, sem itens)
-- Execute no Neon SQL Editor ou: node scripts/run-neon-migration-023.mjs
-- Afeta APENAS o jogo (game_profiles, game_owned_items, game_owned_rooms). Não altera usuários, eventos ou timeline.

-- 1. Remove todos os itens comprados/desbloqueados (capas, pets, itens anti-stress; avatares desbloqueados por missão continuam só na lógica de missões)
DELETE FROM game_owned_items;

-- 2. Remove todas as salas/casas compradas
DELETE FROM game_owned_rooms;

-- 3. Reinsere apenas casa_1 e sala_1 para cada usuário que tem perfil de jogo
INSERT INTO game_owned_rooms (user_id, room_type, room_id)
SELECT user_id, 'house', 'casa_1' FROM game_profiles
ON CONFLICT (user_id, room_type, room_id) DO NOTHING;

INSERT INTO game_owned_rooms (user_id, room_type, room_id)
SELECT user_id, 'work', 'sala_1' FROM game_profiles
ON CONFLICT (user_id, room_type, room_id) DO NOTHING;

-- 4. Reseta perfil de jogo: nível 1, 200 moedas, saúde 100, stress 0, capa default, avatar personagem9, sem pet, sem item anti-stress, sem medalhas
UPDATE game_profiles
SET
  coins = 200,
  experience = 0,
  level = 1,
  health = 100,
  stress = 0,
  cover_id = 'default',
  avatar_image_url = '/game/assets/avatar/personagem9.png',
  cover_position_y = 50,
  earned_badges = '[]'::jsonb,
  pet_id = null,
  antistress_item_id = null,
  last_relax_at = null,
  last_work_bonus_at = null,
  current_house_id = 'casa_1',
  current_work_room_id = 'sala_1',
  room_layout_trabalho = null,
  updated_at = NOW();
