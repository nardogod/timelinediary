# Configurar o Telegram (bot + webhook)

Este guia explica como configurar o bot do Telegram para o Timeline Agenda: criar o bot, obter o token, configurar o webhook e vincular a conta.

---

## 1. Criar o bot no Telegram

1. Abra o Telegram e procure por **@BotFather**.
2. Envie: `/newbot`.
3. Siga as instruções:
   - **Nome do bot** (ex.: Timeline Diary).
   - **Username do bot** (deve terminar em `bot`, ex.: `timelinediary_bot`).
4. O BotFather vai enviar uma mensagem com o **token** (ex.: `7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
5. **Copie e guarde o token** — você vai usar como `TELEGRAM_BOT_TOKEN`.

Dica: depois você pode ver o token em `/mybots` → escolher o bot → **API Token**.

---

## 2. Gerar o secret do webhook

O Telegram envia um header `x-telegram-bot-api-secret-token` nas requisições do webhook. O app só aceita o webhook se esse valor for igual a `TELEGRAM_WEBHOOK_SECRET`.

Gere uma string longa e aleatória (não use a mesma do `AUTH_SECRET` por segurança):

**PowerShell:**
```powershell
[Convert]::ToBase64String((1..24 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**Ou com Node:**
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

Use o resultado como `TELEGRAM_WEBHOOK_SECRET` no `.env.local` (e na Vercel, se for usar em produção).

---

## 3. Variáveis de ambiente

No **`.env.local`** (raiz do projeto), configure:

```env
# Telegram Bot (obrigatório para o bot funcionar)
TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_WEBHOOK_SECRET=a_string_longa_que_voce_gerou_no_passo_2

# URL do app (o webhook será esta URL + /api/telegram/webhook)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- **Local:** `NEXT_PUBLIC_APP_URL=http://localhost:3000` — o webhook **só funciona** se o Telegram conseguir acessar essa URL. Em máquina local isso não é possível; veja a seção **Desenvolvimento local** abaixo.
- **Produção (Vercel):** use a URL do deploy, ex.: `NEXT_PUBLIC_APP_URL=https://timelinediary.vercel.app`.

---

## 4. Desenvolvimento local (opcional)

O Telegram só envia updates para uma **URL pública**. Em localhost o bot não recebe mensagens até você expor a URL.

**Opção A – Usar ngrok (ou similar)**

1. Instale o [ngrok](https://ngrok.com/) e inicie um túnel para a porta do Next (ex.: 3000):
   ```bash
   ngrok http 3000
   ```
2. Copie a URL HTTPS que o ngrok mostrar (ex.: `https://abc123.ngrok.io`).
3. No `.env.local`, **não** precisa mudar `NEXT_PUBLIC_APP_URL` para o ngrok (o webhook usa a URL que você passar no `setWebhook`).
4. Defina o webhook para a URL do ngrok:
   ```bash
   curl -X POST "https://api.telegram.org/bot<SEU_TELEGRAM_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"https://abc123.ngrok.io/api/telegram/webhook\", \"secret_token\": \"<SEU_TELEGRAM_WEBHOOK_SECRET>\"}"
   ```
5. Rode o app: `npm run dev`. As mensagens do Telegram serão recebidas pelo seu localhost via ngrok.

**Opção B – Só testar em produção**

Deixe o webhook apontando para a URL da Vercel e teste o bot apenas depois do deploy. Em local você pode testar registro, login e a tela de “Gerar token de vinculação”; a vinculação e a criação de eventos via Telegram funcionam quando o webhook estiver na URL pública.

---

## 5. Configurar o webhook (produção)

Quando o app estiver no ar (ex.: Vercel), defina o webhook para a URL do deploy.

Substitua:
- `<SEU_TELEGRAM_BOT_TOKEN>` pelo valor de `TELEGRAM_BOT_TOKEN`.
- `<SEU_TELEGRAM_WEBHOOK_SECRET>` pelo valor de `TELEGRAM_WEBHOOK_SECRET`.
- `https://seu-app.vercel.app` pela URL real do app (a mesma de `NEXT_PUBLIC_APP_URL`).

**Definir webhook:**
```bash
curl -X POST "https://api.telegram.org/bot<SEU_TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://seu-app.vercel.app/api/telegram/webhook\", \"secret_token\": \"<SEU_TELEGRAM_WEBHOOK_SECRET>\"}"
```

**Verificar:**
```bash
curl "https://api.telegram.org/bot<SEU_TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

A resposta deve conter `"url": "https://seu-app.vercel.app/api/telegram/webhook"`.

---

## 6. Vincular a conta Telegram à conta web

1. No app (local ou produção), faça **login**.
2. Vá em **Configurações** (ou perfil) → aba **Telegram**.
3. Clique em **Gerar Token de Vinculação**.
4. Copie o token que aparecer.
5. No Telegram, abra o **seu bot** e envie:
   ```
   /link SEU_TOKEN_COPIADO
   ```
6. O bot deve responder confirmando que a conta foi vinculada.

Depois disso você pode criar eventos enviando mensagens para o bot (veja `/help` no Telegram).

---

## 7. Testar o bot

- **/start** — mensagem de boas-vindas e instruções.
- **/help** — lista de comandos e formato de mensagens para criar eventos.
- **Mensagem simples** — ex.: `Reunião amanhã` (cria evento com título e data de amanhã).
- **Formato estruturado** — ex.: `Reunião | 2026-02-20 | important`.

Se algo falhar, confira:
- `TELEGRAM_BOT_TOKEN` e `TELEGRAM_WEBHOOK_SECRET` no ambiente (local e/ou Vercel).
- Webhook configurado com `getWebhookInfo`.
- Conta vinculada (Configurações → Telegram → token → `/link` no bot).

---

## Resumo rápido

| Passo | O que fazer |
|-------|-------------|
| 1 | Criar bot no @BotFather e copiar o token |
| 2 | Gerar uma string aleatória para `TELEGRAM_WEBHOOK_SECRET` |
| 3 | Colocar `TELEGRAM_BOT_TOKEN` e `TELEGRAM_WEBHOOK_SECRET` no `.env.local` (e na Vercel) |
| 4 | (Local) Usar ngrok e setar webhook para a URL do ngrok, ou testar só em produção |
| 5 | (Produção) Chamar `setWebhook` com a URL do app (ex.: Vercel) |
| 6 | No app: Configurações → Telegram → Gerar token → no bot: `/link <token>` |
| 7 | Testar com `/start`, `/help` e uma mensagem de evento |

Para deploy completo (Vercel + variáveis + webhook), use também `docs/CHECKLIST_DEPLOY.md` e `docs/FALTA_PARA_PRODUCAO.md`.
