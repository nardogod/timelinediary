/**
 * Remove avatares desbloqueados do usuário, deixando apenas o ícone padrão (personagem9).
 * Uso: node scripts/reset-avatars-to-default.mjs [username]
 * Ex.: node scripts/reset-avatars-to-default.mjs teste_teste
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

async function main() {
  const rows = await sql`SELECT id FROM users WHERE username = ${username} LIMIT 1`;
  const user = rows[0];
  if (!user) {
    console.error(`Usuário com username "${username}" não encontrado.`);
    process.exit(1);
  }
  const userId = user.id;

  await sql`
    DELETE FROM game_owned_items
    WHERE user_id = ${userId} AND item_type = 'avatar'
  `;

  console.log(`@${username}: avatares removidos. Apenas o ícone padrão (personagem9) permanece.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
