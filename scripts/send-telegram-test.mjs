/**
 * Envia uma mensagem de teste do sistema para um usuário específico via Telegram.
 * O usuário precisa ter a conta Telegram vinculada (telegram_users).
 *
 * Uso: node scripts/send-telegram-test.mjs <user_id> "Sua mensagem aqui"
 * Ex.: node scripts/send-telegram-test.mjs a1b2c3d4-e5f6-7890-abcd-ef1234567890 "Teste de notificação"
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
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não definida em .env.local');
  process.exit(1);
}
if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'your-bot-token') {
  console.error('TELEGRAM_BOT_TOKEN não configurado em .env.local');
  process.exit(1);
}

const userId = process.argv[2];
const message = process.argv[3];
const listOnly = process.argv[2] === '--list';

const sql = neon(DATABASE_URL);

async function listLinked() {
  const rows = await sql`SELECT user_id, telegram_id, telegram_username FROM telegram_users ORDER BY user_id`;
  if (rows.length === 0) {
    console.log('Nenhum usuário com Telegram vinculado.');
    return;
  }
  console.log('Usuários com Telegram vinculado:\n');
  for (const r of rows) {
    console.log('  user_id:', r.user_id, '| telegram_id:', r.telegram_id, r.telegram_username ? `| @${r.telegram_username}` : '');
  }
  console.log('\nUse: node scripts/send-telegram-test.mjs <user_id> "Mensagem"');
}

async function main() {
  if (listOnly) {
    await listLinked();
    return;
  }

  if (!userId || !message) {
    console.log('Uso:');
    console.log('  Listar vinculados: node scripts/send-telegram-test.mjs --list');
    console.log('  Enviar mensagem:   node scripts/send-telegram-test.mjs <user_id> "Mensagem"');
    console.log('Ex.: node scripts/send-telegram-test.mjs a1b2c3d4-e5f6-7890-abcd-ef1234567890 "Olá, teste!"');
    process.exit(1);
  }

  const rows = await sql`
    SELECT telegram_id, telegram_username FROM telegram_users WHERE user_id = ${userId} LIMIT 1
  `;
  if (!rows || rows.length === 0) {
    console.error('Usuário não encontrado ou não tem Telegram vinculado. user_id:', userId);
    process.exit(1);
  }
  const chatId = rows[0].telegram_id;
  console.log('Enviando para telegram_id:', chatId, rows[0].telegram_username ? `(@${rows[0].telegram_username})` : '');

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });
  const data = await res.json().catch(() => ({}));

  if (!data.ok) {
    console.error('Erro Telegram:', data.description || res.status, data);
    process.exit(1);
  }
  console.log('Mensagem enviada com sucesso.');
}

main();
