/**
 * Verifica se as tabelas do schema Neon já existem no banco.
 * Usa DATABASE_URL do .env.local.
 *
 * Uso: node scripts/check-neon-tables.mjs
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

const EXPECTED_TABLES = ['users', 'folders', 'events', 'telegram_users', 'telegram_link_tokens'];

async function main() {
  const sql = neon(DATABASE_URL);
  try {
    const rows = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const existing = (rows || []).map((r) => r.table_name);
    const missing = EXPECTED_TABLES.filter((t) => !existing.includes(t));
    const ok = missing.length === 0;

    console.log('Tabelas no schema public:');
    existing.forEach((t) => console.log('  ✓', t));
    if (missing.length) {
      console.log('\nFaltam (rode a migration):');
      missing.forEach((t) => console.log('  ✗', t));
      console.log('\n→ Execute neon/migrations/001_neon_schema.sql no Neon SQL Editor (sem EXPLAIN).');
      process.exit(1);
    }
    console.log('\n✓ Todas as tabelas esperadas existem. Migration já foi aplicada.');
  } catch (err) {
    console.error('Erro ao conectar no banco:', err.message);
    process.exit(1);
  }
}

main();
