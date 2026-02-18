# Setup do Projeto - Timeline Agenda com Bot Telegram (Sem Supabase)

## Status

O projeto está configurado para funcionar **sem Supabase**, usando:
- Dados mockados em memória (`lib/mockData.ts`)
- localStorage para autenticação e vinculação Telegram
- Sistema completo de bot Telegram funcionando

## Pré-requisitos

1. Node.js 18+ instalado
2. Bot Telegram criado via @BotFather

## Passo 1: Configurar Bot Telegram

1. Abra o Telegram e procure por @BotFather
2. Envie `/newbot` e siga as instruções
3. Copie o token do bot (formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
4. Gere um secret token para o webhook (pode ser qualquer string aleatória)

## Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
TELEGRAM_BOT_TOKEN=seu-token-do-bot
TELEGRAM_WEBHOOK_SECRET=seu-secret-aleatorio

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Passo 3: Instalar Dependências

```bash
npm install
```

## Passo 4: Configurar Webhook do Telegram (Desenvolvimento)

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

## Passo 5: Executar o Projeto

```bash
npm run dev
```

Acesse http://localhost:3000

## Como Usar o Bot Telegram

1. Crie uma conta no site (ou use a conta de teste: `usuario@exemplo.com` / `senha123`)
2. Vá em Configurações > Telegram
3. Gere um token de vinculação
4. Abra o bot no Telegram e envie: `/link <token>`
5. Agora você pode criar eventos enviando mensagens para o bot!

### Comandos do Bot

- `/start` - Iniciar o bot
- `/link <token>` - Vincular conta Telegram
- `/evento <título> <data> [tipo]` - Criar evento rápido
- `/eventos` - Listar últimos 5 eventos
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

## Estrutura de Dados (Mockado)

### Autenticação
- Usuários salvos em `lib/mockData.ts` (MOCK_AUTH_USERS)
- Sessão salva em `localStorage` como `timeline_user`

### Vinculação Telegram
- Links salvos em `localStorage` como `timeline_telegram_links`
- Tokens salvos em `localStorage` como `timeline_telegram_tokens`

### Eventos
- Eventos salvos em `lib/mockData.ts` (MOCK_EVENTS)
- Persistem apenas durante a sessão do servidor

## Limitações (Sem Supabase)

1. **Dados não persistem**: Eventos criados via bot são perdidos ao reiniciar o servidor
2. **Sem sincronização**: Dados não são sincronizados entre dispositivos
3. **Sem Realtime**: Não há atualizações em tempo real
4. **Apenas desenvolvimento**: Não recomendado para produção

## Migração Futura para Supabase

Quando estiver pronto para migrar para Supabase:

1. Execute as migrations SQL em `supabase/migrations/`
2. Configure as variáveis de ambiente do Supabase
3. Substitua as chamadas mockadas por funções do Supabase
4. Os componentes já estão preparados para a migração

## Troubleshooting

### Bot não responde
- Verifique se o webhook está configurado corretamente
- Verifique o TELEGRAM_BOT_TOKEN no .env.local
- Verifique os logs do servidor

### Token de vinculação não funciona
- Verifique se o token não expirou (24 horas)
- Gere um novo token se necessário
- Limpe o localStorage se houver problemas

### Eventos não aparecem
- Verifique se está logado com a conta correta
- Verifique se a conta Telegram está vinculada
- Recarregue a página
