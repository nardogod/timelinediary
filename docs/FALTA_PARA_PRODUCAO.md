# O que falta para colocar em produção

**Build:** ✅ `npm run build` passando  
**Código:** pronto para deploy  

Só falta **configurar** e **publicar**. Segue a ordem para ir para produção o quanto antes.

---

## ⚠️ Sobre a página do Neon "Custom authentication providers"

A página [Custom authentication providers](https://neon.com/docs/data-api/custom-authentication-providers) do Neon é para quem usa a **Neon Data API** (API REST/HTTP) com login por JWT (Auth0, Clerk, etc.).  

**Este projeto não usa isso.** Usamos a **connection string** (PostgreSQL) com o driver `@neondatabase/serverless`. Você **não precisa** configurar nenhum provider nessa página. Só precisa da connection string no passo 1 abaixo.

---

## 1. Variáveis de ambiente (ter em mãos)

Antes de abrir a Vercel, tenha estes valores:

| Variável | Onde obter |
|----------|------------|
| **DATABASE_URL** | [Neon Console](https://console.neon.tech) → seu projeto → Connection string (copiar) |
| **AUTH_SECRET** | Gerar: `openssl rand -base64 24` (ou no PowerShell: `[Convert]::ToBase64String((1..24 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])`) |
| **TELEGRAM_BOT_TOKEN** | Telegram → @BotFather → criar bot ou /mybots → copiar token |
| **TELEGRAM_WEBHOOK_SECRET** | Qualquer string longa e aleatória (ex.: mesma do AUTH_SECRET ou gerar outra) |
| **NEXT_PUBLIC_APP_URL** | Só depois do primeiro deploy: `https://seu-dominio.vercel.app` |

---

## 2. Banco de dados (Neon)

- [ ] Migration já rodou no Neon?  
  - Se **não**: no Neon Console → **SQL Editor** → colar o conteúdo de `neon/migrations/001_neon_schema.sql` → Run.  
  - Ou local: `npm run db:migrate` (com `DATABASE_URL` no `.env.local`).
- [ ] Teste rápido: com o app rodando (`npm run dev`), abrir `http://localhost:3000/api/health/db` → deve retornar 200.

---

## 3. Subir o código para o GitHub

O repositório [github.com/nardogod/timelinediary](https://github.com/nardogod/timelinediary) está vazio. É preciso enviar o código do projeto para lá:

- [ ] Na pasta do projeto (onde está o `package.json`), abrir o terminal.
- [ ] Se ainda não inicializou Git: `git init`.
- [ ] Adicionar o remote (se ainda não tiver):
  ```bash
  git remote add origin https://github.com/nardogod/timelinediary.git
  ```
  Se já existir outro `origin`, use: `git remote set-url origin https://github.com/nardogod/timelinediary.git`
- [ ] Commit e push:
  ```bash
  git add .
  git commit -m "App pronto para produção"
  git branch -M main
  git push -u origin main
  ```
- [ ] Conferir que `.env.local` **não** está no repositório (deve estar no `.gitignore`). Nunca faça commit da connection string ou de senhas.

---

## 4. Deploy na Vercel

- [ ] [vercel.com](https://vercel.com) → **Add New** → **Project** → importar o repositório **nardogod/timelinediary**.
- [ ] Framework: **Next.js** (detectado automaticamente).
- [ ] Em **Environment Variables** adicionar:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_APP_URL` → deixar em branco no primeiro deploy.
- [ ] **Deploy**.
- [ ] Copiar a URL do projeto (ex.: `https://timelinediary-xxx.vercel.app`).

---

## 5. Ajuste pós-deploy

- [ ] Na Vercel: **Settings** → **Environment Variables** → editar `NEXT_PUBLIC_APP_URL` = URL do deploy (ex.: `https://timelinediary-xxx.vercel.app`).
- [ ] **Redeploy** (Deployments → ⋮ no último deploy → Redeploy) para a app usar a URL correta.

---

## 6. Telegram webhook

- [ ] Configurar o webhook (substituir `<BOT_TOKEN>` e `<WEBHOOK_SECRET>` e a URL):

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://SUA-URL.vercel.app/api/telegram/webhook\", \"secret_token\": \"<WEBHOOK_SECRET>\"}"
```

- [ ] Verificar:  
  `https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo`  
  Deve mostrar a URL do seu app.

---

## 7. Testes rápidos em produção

- [ ] `https://sua-url.vercel.app/api/health` → 200.
- [ ] `https://sua-url.vercel.app/api/health/db` → 200.
- [ ] Abrir a URL no navegador → página inicial.
- [ ] Criar conta → login → criar um evento.
- [ ] No Telegram: `/start` e, se já vinculou, enviar uma mensagem de evento para testar.

---

## Resumo (checklist mínimo)

1. Variáveis prontas (DATABASE_URL, AUTH_SECRET, Telegram).
2. Migration no Neon (SQL Editor ou `npm run db:migrate`).
3. **Push do código** para `https://github.com/nardogod/timelinediary.git`.
4. Deploy na Vercel (importar repo, configurar as 4 variáveis; NEXT_PUBLIC_APP_URL em branco no 1º deploy).
5. Definir `NEXT_PUBLIC_APP_URL` = URL do deploy e redeploy.
6. Setar webhook do Telegram.
7. Testar health, login e bot.

Nada disso exige mudança de código; é só configuração e deploy.  
Para o passo a passo completo com troubleshooting, use `docs/CHECKLIST_DEPLOY.md`.
