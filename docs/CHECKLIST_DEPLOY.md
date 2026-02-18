# ✅ Checklist de Deploy - Timeline Agenda

## 📋 Pré-Deploy

### 1. Variáveis de Ambiente

- [ ] **DATABASE_URL**
  - Obter do Neon Console: https://console.neon.tech/app/projects/wispy-voice-66273074
  - Formato: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

- [ ] **AUTH_SECRET**
  - Gerar com: `openssl rand -base64 24`
  - Mínimo 16 caracteres

- [ ] **TELEGRAM_BOT_TOKEN**
  - Obter do @BotFather no Telegram
  - Formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

- [ ] **TELEGRAM_WEBHOOK_SECRET**
  - String aleatória segura (ex: gerar com `openssl rand -base64 32`)

- [ ] **NEXT_PUBLIC_APP_URL**
  - Será preenchido após deploy: `https://seu-app.vercel.app`

### 2. Banco de Dados

- [ ] Migration executada no Neon
  ```bash
  npm run db:migrate
  ```
  Ou executar manualmente `neon/migrations/001_neon_schema.sql` no Neon SQL Editor

- [ ] Verificar conexão:
  ```bash
  npm run dev
  # Acessar: http://localhost:3000/api/health/db
  # Deve retornar 200
  ```

### 3. Build Local

- [ ] Testar build:
  ```bash
  npm run build
  npm start
  ```

- [ ] Verificar se não há erros de build
- [ ] Testar funcionalidades básicas:
  - [ ] Registro de usuário
  - [ ] Login
  - [ ] Criação de evento
  - [ ] Visualização da timeline

---

## 🚀 Deploy na Vercel

### 1. Preparar Repositório

- [ ] Fazer commit de todas as alterações
- [ ] Push para GitHub/GitLab/Bitbucket
- [ ] Verificar que `.env.local` está no `.gitignore`

### 2. Conectar na Vercel

- [ ] Acessar https://vercel.com
- [ ] Conectar repositório
- [ ] Framework Preset: **Next.js**
- [ ] Root Directory: `/` (padrão)

### 3. Configurar Variáveis de Ambiente

Na Vercel Dashboard → Settings → Environment Variables:

- [ ] `DATABASE_URL` = connection string do Neon
- [ ] `AUTH_SECRET` = secret gerado
- [ ] `TELEGRAM_BOT_TOKEN` = token do bot
- [ ] `TELEGRAM_WEBHOOK_SECRET` = secret do webhook
- [ ] `NEXT_PUBLIC_APP_URL` = deixar vazio por enquanto (será preenchido após primeiro deploy)

### 4. Deploy

- [ ] Clicar em "Deploy"
- [ ] Aguardar build completar
- [ ] Verificar logs de build (sem erros)
- [ ] Copiar URL do deploy (ex: `https://timeline-agenda-xxx.vercel.app`)

### 5. Atualizar Variável NEXT_PUBLIC_APP_URL

- [ ] Vercel Dashboard → Settings → Environment Variables
- [ ] Editar `NEXT_PUBLIC_APP_URL`
- [ ] Valor: URL do deploy (ex: `https://timeline-agenda-xxx.vercel.app`)
- [ ] Salvar
- [ ] Fazer novo deploy (ou aguardar redeploy automático)

---

## 🤖 Configurar Telegram Webhook

### 1. Configurar Webhook

```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-app.vercel.app/api/telegram/webhook",
    "secret_token": "<SEU_TELEGRAM_WEBHOOK_SECRET>"
  }'
```

### 2. Verificar Webhook

```bash
curl "https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo"
```

**Deve retornar:**
```json
{
  "ok": true,
  "result": {
    "url": "https://seu-app.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## ✅ Testes Pós-Deploy

### 1. Health Checks

- [ ] `GET https://seu-app.vercel.app/api/health`
  - Deve retornar: `{"ok": true, "service": "timeline-agenda", ...}`

- [ ] `GET https://seu-app.vercel.app/api/health/db`
  - Deve retornar: `{"ok": true, "database": "neon", ...}`

### 2. Frontend

- [ ] Acessar `https://seu-app.vercel.app`
  - Página inicial carrega
  - Sem erros no console

- [ ] Criar conta
  - Registro funciona
  - Redireciona após registro

- [ ] Fazer login
  - Login funciona
  - Sessão mantida

- [ ] Criar evento
  - Formulário funciona
  - Evento aparece na timeline

### 3. Telegram Bot

- [ ] Enviar `/start` ao bot
  - Bot responde com boas-vindas

- [ ] Vincular conta:
  1. Acessar app → Configurações → Telegram
  2. Gerar token
  3. Enviar `/link <token>` ao bot
  4. Bot confirma vinculação

- [ ] Criar evento via Telegram:
  - Enviar: `Reunião | 2026-02-20 | important`
  - Bot confirma criação
  - Evento aparece no app

- [ ] Testar comando `/eventos`
  - Lista últimos eventos

---

## 🔍 Monitoramento

### 1. Vercel Dashboard

- [ ] Verificar logs de deploy
- [ ] Verificar logs de runtime (se houver erros)
- [ ] Verificar Analytics (tráfego, performance)

### 2. Neon Dashboard

- [ ] Verificar uso do banco
- [ ] Verificar queries executadas
- [ ] Verificar conexões ativas

### 3. Telegram Bot

- [ ] Testar todos os comandos
- [ ] Verificar respostas do bot
- [ ] Verificar logs de webhook (se disponível)

---

## 🐛 Troubleshooting

### Erro: "DATABASE_URL não definida"

**Solução:**
- Verificar se variável está configurada na Vercel
- Verificar se nome está correto (case-sensitive)
- Fazer redeploy após adicionar variável

### Erro: "Unauthorized" no webhook

**Solução:**
- Verificar se `TELEGRAM_WEBHOOK_SECRET` está correto
- Verificar se header `x-telegram-bot-api-secret-token` está sendo enviado
- Verificar configuração do webhook no Telegram

### Erro: "Migration não executada"

**Solução:**
- Executar migration no Neon SQL Editor
- Ou rodar `npm run db:migrate` localmente (se DATABASE_URL apontar para produção)

### Bot não responde

**Solução:**
- Verificar se webhook está configurado corretamente
- Verificar logs na Vercel
- Testar endpoint `/api/telegram/webhook` manualmente (POST)

---

## 📝 Notas Finais

- ✅ Sistema está pronto para deploy
- ✅ Todas as dependências estão instaladas
- ✅ Banco de dados configurado
- ✅ Bot Telegram completo
- ✅ Frontend completo

**Tempo estimado:** 30-60 minutos (incluindo testes)

**Próximos passos após deploy:**
1. Monitorar uso e performance
2. Coletar feedback dos usuários
3. Implementar melhorias baseadas em uso real
4. Considerar adicionar analytics (Vercel Analytics, Google Analytics)
