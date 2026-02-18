# Setup do Projeto - Timeline Agenda com Bot Telegram

## Pré-requisitos

1. Node.js 18+ instalado
2. Conta no Supabase (https://supabase.com)
3. Bot Telegram criado via @BotFather

## Passo 1: Configurar Supabase

1. Crie um novo projeto no Supabase
2. Vá em Settings > API e copie:
   - Project URL
   - anon/public key
   - service_role key (secret)

3. Execute as migrations SQL:
   - Acesse SQL Editor no Supabase
   - Execute os arquivos em ordem de `supabase/migrations/`:
     - 001_create_users.sql
     - 002_create_folders.sql
     - 003_create_events.sql
     - 004_create_telegram_users.sql
     - 005_create_telegram_link_tokens.sql

## Passo 2: Configurar Bot Telegram

1. Abra o Telegram e procure por @BotFather
2. Envie `/newbot` e siga as instruções
3. Copie o token do bot (formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
4. Gere um secret token para o webhook (pode ser qualquer string aleatória)

## Passo 3: Configurar Variáveis de Ambiente

1. Copie `.env.local.example` para `.env.local`
2. Preencha as variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

TELEGRAM_BOT_TOKEN=seu-token-do-bot
TELEGRAM_WEBHOOK_SECRET=seu-secret-aleatorio

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Passo 4: Instalar Dependências

```bash
npm install
```

## Passo 5: Configurar Webhook do Telegram (Desenvolvimento)

Para desenvolvimento local, você pode usar ngrok:

1. Instale ngrok: https://ngrok.com/
2. Execute: `ngrok http 3000`
3. Copie a URL HTTPS (ex: https://abc123.ngrok.io)
4. Configure o webhook:

```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://abc123.ngrok.io/api/telegram/webhook",
    "secret_token": "seu-secret-aleatorio"
  }'
```

Para produção (Vercel), configure o webhook com a URL do seu deploy:

```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-app.vercel.app/api/telegram/webhook",
    "secret_token": "seu-secret-aleatorio"
  }'
```

## Passo 6: Executar o Projeto

```bash
npm run dev
```

Acesse http://localhost:3000

## Como Usar o Bot Telegram

1. Crie uma conta no site
2. Vá em Configurações > Telegram
3. Gere um token de vinculação
4. Abra o bot no Telegram e envie: `/link <token>`
5. Agora você pode criar eventos enviando mensagens para o bot!

### Comandos do Bot

- `/start` - Iniciar o bot
- `/link <token>` - Vincular conta
- `/evento <título> <data> [tipo]` - Criar evento rápido
- `/eventos` - Listar últimos eventos
- `/help` - Ajuda

### Criar Evento via Mensagem

Envie uma mensagem de texto no formato:
```
Título | Data | Tipo | Link
```

Exemplo:
```
Reunião importante | 2026-02-05 | important | https://example.com
```

Ou simplesmente envie o título para criar um evento simples com a data de hoje.

## Estrutura do Banco de Dados

- `users` - Usuários do sistema
- `events` - Eventos da timeline
- `folders` - Pastas/categorias
- `telegram_users` - Vinculação Telegram ↔ Usuário
- `telegram_link_tokens` - Tokens temporários para vinculação

## Troubleshooting

### Erro ao criar evento
- Verifique se está autenticado
- Verifique as permissões RLS no Supabase

### Bot não responde
- Verifique se o webhook está configurado corretamente
- Verifique o TELEGRAM_BOT_TOKEN no .env.local
- Verifique os logs do servidor

### Erro de autenticação
- Verifique as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
- Verifique se as migrations foram executadas
