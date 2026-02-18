/**
 * Define os comandos do bot no menu do Telegram (aparecem ao tocar em "/").
 * Deixa o uso mais intuitivo e evita cadastro incorreto.
 * Usa TELEGRAM_BOT_TOKEN do .env.local.
 *
 * Uso: node scripts/set-telegram-commands.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const COMMANDS = [
  { command: 'start', description: 'Iniciar e ver como usar o bot' },
  { command: 'link', description: 'Vincular conta (pegue o token no site)' },
  { command: 'desvincular', description: 'Desvincular esta conta do site' },
  { command: 'help', description: 'Ver ajuda e formatos para criar eventos' },
  { command: 'evento', description: 'Criar evento: título, data e tipo' },
  { command: 'eventos', description: 'Ver meus últimos 5 eventos' },
];

async function main() {
  console.log('--- Configurar comandos do menu Telegram ---\n');

  if (!TOKEN || TOKEN === 'your-bot-token') {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env.local');
    process.exit(1);
  }

  const apiUrl = `https://api.telegram.org/bot${TOKEN}/setMyCommands`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: COMMANDS }),
    });
    const data = await res.json();

    if (!data.ok) {
      console.error('❌ Erro:', data.description || JSON.stringify(data));
      process.exit(1);
    }

    console.log('✅ Comandos do menu configurados:\n');
    COMMANDS.forEach((c) => console.log(`   /${c.command} - ${c.description}`));
    console.log('\n   No Telegram, ao tocar em "/" o usuário verá essa lista.');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

main();
