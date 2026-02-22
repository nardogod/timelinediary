/**
 * Executa a migration 020 (relax/work cooldown: last_relax_at e last_work_bonus_at TIMESTAMPTZ) no Neon.
 * Uso: node scripts/run-neon-migration-020.mjs
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

const sql = neon(DATABASE_URL);
const migrationPath = join(root, 'neon', 'migrations', '020_relax_work_cooldown_timestamptz.sql');
const fullSql = readFileSync(migrationPath, 'utf8');

const lines = fullSql.split('\n').filter((line) => !line.trim().startsWith('--'));
const cleaned = lines.join('\n');
const statements = cleaned
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log('Executando migration 020 (relax/work cooldown timestamptz)...');
for (let i = 0; i < statements.length; i++) {
  const st = statements[i];
  const preview = st.slice(0, 55).replace(/\s+/g, ' ');
  try {
    await sql([st.endsWith(';') ? st : st + ';']);
    console.log(`  [${i + 1}] OK: ${preview}...`);
  } catch (err) {
    console.error('  Erro:', err?.message);
    process.exit(1);
  }
}
console.log('Migration 020 concluída.');
process.exit(0);
