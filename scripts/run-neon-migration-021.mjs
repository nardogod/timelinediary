/**
 * Executa a migration 021 (reset das missões de avatar) no Neon.
 * Remove todas as conclusões de missões avatar_* para que os avatares voltem a ser desbloqueados só ao completar tarefas.
 * Uso: node scripts/run-neon-migration-021.mjs
 */
import { existsSync, readFileSync } from 'fs';
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

console.log('Executando migration 021 (reset missões de avatar)...');
try {
  await sql`DELETE FROM game_user_missions WHERE mission_id LIKE 'avatar_%'`;
  console.log('  Conclusões de missões avatar_* removidas.');
} catch (err) {
  console.error('  Erro:', err?.message);
  process.exit(1);
}
console.log('Migration 021 concluída. Avatares passam a ser desbloqueados apenas ao completar as missões (ao concluir tarefas).');
process.exit(0);
