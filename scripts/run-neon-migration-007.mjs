/**
 * Executa a migration 007 (note_lists e task color) no Neon.
 * Cria tabela note_lists e adiciona campos color e note_list_id em tasks.
 * Usa DATABASE_URL do .env.local.
 *
 * Uso: node scripts/run-neon-migration-007.mjs
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
const migrationPath = join(root, 'neon', 'migrations', '007_note_lists_and_task_color.sql');
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
let statements = fullSql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

// Insere a função antes dos triggers que a usam
if (functionSql) {
  // Encontra a posição do primeiro CREATE TRIGGER
  const triggerIndex = statements.findIndex(s => s.toUpperCase().includes('CREATE TRIGGER'));
  if (triggerIndex >= 0) {
    statements.splice(triggerIndex, 0, functionSql);
  } else {
    statements.push(functionSql);
  }
}

console.log('Executando migration 007 (note_lists e task color)...');
let ok = 0;
for (let i = 0; i < statements.length; i++) {
  const st = statements[i];
  const preview = st.slice(0, 60).replace(/\s+/g, ' ');
  try {
    const statement = st.endsWith(';') ? st : st + ';';
    await sql([statement]);
    ok++;
    console.log(`  [${i + 1}/${statements.length}] OK: ${preview}...`);
  } catch (err) {
    if (err.message?.includes('already exists') || err.message?.includes('duplicate') || err.message?.includes('already exists')) {
      console.log(`  [${i + 1}/${statements.length}] JÁ EXISTE: ${preview}...`);
      ok++;
    } else {
      console.error(`  [${i + 1}/${statements.length}] ERRO: ${preview}...`);
      console.error('  Mensagem:', err.message);
      process.exit(1);
    }
  }
}
console.log(`\nMigration 007 concluída: ${ok} statements executados.`);
process.exit(0);
