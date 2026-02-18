/**
 * Testa a conexão com o Telegram: valida TELEGRAM_BOT_TOKEN e mostra o webhook atual.
 * Usa variáveis do .env.local.
 *
 * Uso: node scripts/test-telegram.mjs
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
  console.log('--- Teste de conexão Telegram ---\n');

  if (!TOKEN || TOKEN === 'your-bot-token') {
    console.log('❌ TELEGRAM_BOT_TOKEN não configurado ou ainda é o placeholder.');
    console.log('   Configure no .env.local (veja docs/TELEGRAM_CONFIG.md).');
    process.exit(1);
  }

  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'your-webhook-secret-token') {
    console.log('⚠️  TELEGRAM_WEBHOOK_SECRET não configurado ou ainda é o placeholder.');
    console.log('   O webhook do Telegram não será aceito pelo app até configurar.');
  } else {
    console.log('✅ TELEGRAM_WEBHOOK_SECRET configurado.');
  }

  if (APP_URL) {
    console.log('✅ NEXT_PUBLIC_APP_URL:', APP_URL);
  } else {
    console.log('⚠️  NEXT_PUBLIC_APP_URL não definido (webhook precisa de URL pública).');
  }

  // 1. getMe – valida o token
  const getMeUrl = `https://api.telegram.org/bot${TOKEN}/getMe`;
  try {
    const res = await fetch(getMeUrl);
    const data = await res.json();
    if (!data.ok) {
      console.log('\n❌ Token inválido. Resposta da API:', data.description || JSON.stringify(data));
      process.exit(1);
    }
    const bot = data.result;
    console.log('\n✅ Conexão com a API do Telegram OK.');
    console.log('   Bot:', bot.username, '| id:', bot.id, '| nome:', bot.first_name);
  } catch (err) {
    console.error('\n❌ Erro ao chamar a API do Telegram:', err.message);
    process.exit(1);
  }

  // 2. getWebhookInfo – mostra webhook atual
  const webhookUrl = `https://api.telegram.org/bot${TOKEN}/getWebhookInfo`;
  try {
    const res = await fetch(webhookUrl);
    const data = await res.json();
    if (!data.ok) {
      console.log('\n⚠️  Não foi possível obter webhook:', data.description || '');
      return;
    }
    const url = data.result?.url;
    if (url) {
      console.log('\n✅ Webhook configurado:', url);
    } else {
      console.log('\n⚠️  Nenhum webhook definido. O bot não receberá mensagens até você chamar setWebhook.');
      if (APP_URL && APP_URL.startsWith('https://')) {
        const base = APP_URL.replace(/\/$/, '');
        console.log('   Exemplo:');
        console.log('   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \\');
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"url": "' + base + '/api/telegram/webhook", "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"}\'');
      }
    }
  } catch (err) {
    console.error('\n⚠️  Erro ao obter webhook:', err.message);
  }

  console.log('\n--- Fim do teste ---');
}

main();
