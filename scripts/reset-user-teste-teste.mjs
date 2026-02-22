/**
 * Reset do usuário teste_teste: nível inicial, sem itens comprados, sem dinheiro.
 * - Remove itens da loja (game_owned_items)
 * - Mantém apenas casa_1 e sala_1 (remove outras casas/salas compradas)
 * - Perfil: coins=200, experience=0, level=1, health=100, stress=0, capa default, avatar personagem9, sem pet, medalhas vazias
 * Uso: node scripts/reset-user-teste-teste.mjs
 */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) {
    console.error('Arquivo .env.local não encontrado.');
    process.exit(1);
  }
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1).replace(/\\"/g, '"');
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1).replace(/\\'/g, "'");
        process.env[key] = value;
      }
    }
  }
}

loadEnvLocal();
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL não definida em .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const USERNAME = 'teste_teste';
const INITIAL_COINS = 200;

async function main() {
  const users = await sql`SELECT id FROM users WHERE username = ${USERNAME}`;
  if (!users.length) {
    console.error(`Usuário "${USERNAME}" não encontrado.`);
    process.exit(1);
  }
  const userId = users[0].id;
  console.log(`Resetando usuário ${USERNAME} (${userId})...`);

  await sql`DELETE FROM game_owned_items WHERE user_id = ${userId}`;
  console.log('  game_owned_items: itens removidos');

  await sql`
    DELETE FROM game_owned_rooms
    WHERE user_id = ${userId}
      AND ( (room_type = 'house' AND room_id <> 'casa_1')
         OR (room_type = 'work' AND room_id <> 'sala_1') )
  `;
  console.log('  game_owned_rooms: mantidas apenas casa_1 e sala_1');

  await sql`
    DELETE FROM game_user_missions WHERE user_id = ${userId}
  `;
  console.log('  game_user_missions: progresso de missões resetado');

  await sql`
    UPDATE game_profiles
    SET
      coins = ${INITIAL_COINS},
      experience = 0,
      level = 1,
      health = 100,
      stress = 0,
      cover_id = 'default',
      avatar_image_url = '/game/assets/avatar/personagem9.png',
      pet_id = null,
      earned_badges = '[]'::jsonb,
      current_house_id = 'casa_1',
      current_work_room_id = 'sala_1',
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;
  console.log('  game_profiles: perfil definido para estado inicial');

  console.log('Reset concluído.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
