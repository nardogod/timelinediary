/**
 * Dispara o envio real de notificações para todos os usuários vinculados ao Telegram.
 * Cada usuário recebe o resumo com os dados cadastrados dele (tarefas pendentes, vence amanhã, eventos da timeline).
 * Usa o mesmo endpoint do cron: GET /api/cron/telegram-notifications
 *
 * Uso: node scripts/send-telegram-test-all.mjs
 * Requer: CRON_SECRET e NEXT_PUBLIC_APP_URL (ou APP_URL) no .env.local
 *
 * Ex.: com app rodando em localhost:3000 ou use NEXT_PUBLIC_APP_URL=https://timelinediary.vercel.app
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

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';

if (!CRON_SECRET) {
  console.error('CRON_SECRET não definida em .env.local');
  process.exit(1);
}

const url = `${APP_URL.replace(/\/$/, '')}/api/cron/telegram-notifications`;

async function main() {
  console.log('Disparando notificações reais (dados cadastrados dos usuários)...');
  console.log('URL:', url);
  console.log('');

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Erro:', data.error || res.status, data);
      process.exit(1);
    }

    console.log('Resposta:', JSON.stringify(data, null, 2));
    console.log('');
    console.log(`Enviadas: ${data.sent ?? 0} | Sem conteúdo para enviar: ${data.skipped ?? 0} | Total usuários vinculados: ${data.total ?? 0}`);
  } catch (err) {
    console.error('Falha na requisição:', err.message);
    console.error('Dica: o app precisa estar rodando (npm run dev) ou use NEXT_PUBLIC_APP_URL=https://timelinediary.vercel.app para produção.');
    process.exit(1);
  }
}

main();
