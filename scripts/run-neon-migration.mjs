/**
 * Executa a migration Neon a partir do Cursor/terminal.
 * Usa DATABASE_URL do .env.local (não commitar .env.local).
 *
 * Uso: node scripts/run-neon-migration.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Carrega .env.local
function loadEnvLocal() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) {
    console.error('Arquivo .env.local não encontrado. Crie com DATABASE_URL (veja .env.local.example).');
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
const migrationPath = join(root, 'neon', 'migrations', '001_neon_schema.sql');
let fullSql = readFileSync(migrationPath, 'utf8');

// Remove comentários no início de linha
fullSql = fullSql.replace(/^\s*--[^\n]*\n/gm, '');

// Extrai a função (contém ; no corpo) para rodar como um bloco
const functionMatch = fullSql.match(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$ LANGUAGE plpgsql;/);
let functionSql = null;
if (functionMatch) {
  functionSql = functionMatch[0];
  fullSql = fullSql.replace(functionMatch[0], '');
}

// Separa statements pelo padrão ; seguido de quebra de linha
const statements = fullSql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

if (functionSql) statements.push(functionSql);

console.log('Executando migration Neon (001_neon_schema.sql)...');
let ok = 0;
for (let i = 0; i < statements.length; i++) {
  const st = statements[i];
  const preview = st.slice(0, 50).replace(/\s+/g, ' ');
  try {
    const statement = st.endsWith(';') ? st : st + ';';
    await sql([statement]);
    ok++;
    console.log(`  [${i + 1}/${statements.length}] OK: ${preview}...`);
  } catch (err) {
    console.error(`  [${i + 1}/${statements.length}] ERRO: ${preview}...`);
    console.error(err.message);
    process.exit(1);
  }
}
console.log(`\nMigration concluída: ${ok} statements executados.`);
process.exit(0);
