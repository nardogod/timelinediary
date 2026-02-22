/**
 * Aplica status de morte (reset do jogo) ao usuário com o username dado.
 * Uso: node scripts/apply-death-to-user.mjs [username]
 * Ex.: node scripts/apply-death-to-user.mjs teste_teste
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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

const username = process.argv[2] || 'teste_teste';
const sql = neon(DATABASE_URL);

const INITIAL_COINS_ON_RESET = 200;
const DEFAULT_HOUSE_ID = 'casa_1';
const DEFAULT_WORK_ROOM_ID = 'sala_1';
const DEFAULT_AVATAR_URL = '/game/assets/avatar/personagem9.png';
const DEFAULT_COVER_ID = 'default';

async function main() {
  const rows = await sql`SELECT id FROM users WHERE username = ${username} LIMIT 1`;
  const user = rows[0];
  if (!user) {
    console.error(`Usuário com username "${username}" não encontrado.`);
    process.exit(1);
  }
  const userId = user.id;

  await sql`DELETE FROM game_owned_items WHERE user_id = ${userId}`;
  await sql`DELETE FROM game_owned_rooms WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO game_owned_rooms (user_id, room_type, room_id)
    VALUES (${userId}, 'house', ${DEFAULT_HOUSE_ID}), (${userId}, 'work', ${DEFAULT_WORK_ROOM_ID})
    ON CONFLICT (user_id, room_type, room_id) DO NOTHING
  `;
  await sql`
    UPDATE game_profiles
    SET
      coins = ${INITIAL_COINS_ON_RESET},
      experience = 0,
      level = 1,
      health = 100,
      stress = 0,
      cover_id = ${DEFAULT_COVER_ID},
      avatar_image_url = ${DEFAULT_AVATAR_URL},
      cover_position_y = 50,
      earned_badges = '[]'::jsonb,
      pet_id = null,
      last_relax_at = null,
      last_work_bonus_at = null,
      current_house_id = ${DEFAULT_HOUSE_ID},
      current_work_room_id = ${DEFAULT_WORK_ROOM_ID},
      room_layout_trabalho = null,
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;

  console.log(`Status de morte aplicado a @${username} (user_id: ${userId}). Perfil resetado: nível 1, 200 moedas, saúde 100, stress 0, sem itens.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
