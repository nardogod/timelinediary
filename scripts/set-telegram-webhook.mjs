/**
 * Configura o webhook do Telegram usando as variáveis do .env.local.
 * A URL do webhook será: NEXT_PUBLIC_APP_URL + /api/telegram/webhook
 *
 * Uso: node scripts/set-telegram-webhook.mjs
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
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

async function main() {
  console.log('--- Configurar webhook Telegram ---\n');

  if (!TOKEN || TOKEN === 'your-bot-token') {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env.local');
    process.exit(1);
  }
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'your-webhook-secret-token') {
    console.error('❌ TELEGRAM_WEBHOOK_SECRET não configurado no .env.local');
    process.exit(1);
  }
  if (!APP_URL || !APP_URL.startsWith('https://')) {
    console.error('❌ NEXT_PUBLIC_APP_URL deve ser uma URL HTTPS (ex.: https://timelinediary.vercel.app)');
    process.exit(1);
  }

  const baseUrl = APP_URL.replace(/\/$/, '');
  const webhookUrl = baseUrl + '/api/telegram/webhook';
  console.log('URL do webhook:', webhookUrl);

  const apiUrl = `https://api.telegram.org/bot${TOKEN}/setWebhook`;
  const body = JSON.stringify({
    url: webhookUrl,
    secret_token: WEBHOOK_SECRET,
  });

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await res.json();

    if (!data.ok) {
      console.error('\n❌ Erro ao configurar webhook:', data.description || JSON.stringify(data));
      process.exit(1);
    }

    console.log('\n✅ Webhook configurado com sucesso.');
    console.log('   O bot passará a receber mensagens em:', webhookUrl);
    console.log('\n   Rode "npm run telegram:test" para confirmar.');
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  }
}

main();
