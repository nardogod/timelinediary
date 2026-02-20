# 📱 Tutorial: Configurar Notificações Telegram para Notas

Este tutorial explica como configurar e ativar as notificações Telegram para o sistema de notas/tarefas.

---

## ✅ O que já está implementado

- ✅ Campo `due_date` nas tarefas (migration executada)
- ✅ UI para definir data de vencimento nas notas
- ✅ Sistema de envio de mensagens Telegram (`lib/telegram-send.ts`)
- ✅ Lógica das três notificações (`lib/notifications/task-notifications.ts`)
- ✅ Endpoint de cron (`/api/cron/telegram-notifications`)
- ✅ Configuração no `vercel.json` (cron diário às 12:00 UTC)

---

## 🔧 O que você precisa fazer

### 1. Configurar variável de ambiente `CRON_SECRET`

O endpoint de notificações precisa de um secret para autorização. Gere uma string aleatória:

**PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**Ou Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Adicione no `.env.local`:**
```env
CRON_SECRET=sua_string_secreta_aqui
```

**Na Vercel (produção):**
1. Vá em **Settings** → **Environment Variables**
2. Adicione `CRON_SECRET` com o mesmo valor gerado acima
3. Faça redeploy se necessário

---

### 2. Configurar o Cron Job

Você tem duas opções:

#### Opção A: Vercel Cron (recomendado se tiver plano Pro)

O `vercel.json` já está configurado com:
```json
"crons": [
  {
    "path": "/api/cron/telegram-notifications",
    "schedule": "0 12 * * *"
  }
]
```

**Limitações:**
- Vercel Hobby (free) **não suporta cron jobs nativos**
- Vercel Pro suporta, mas precisa configurar manualmente no dashboard

**Se usar Vercel Pro:**
1. Vá em **Settings** → **Cron Jobs**
2. Adicione um novo cron job:
   - **Path**: `/api/cron/telegram-notifications`
   - **Schedule**: `0 12 * * *` (diário às 12:00 UTC)
   - **Headers**: Adicione `Authorization: Bearer <seu_CRON_SECRET>`

#### Opção B: Cron externo (recomendado para Hobby)

Use um serviço externo como **cron-job.org** ou **EasyCron**:

**Passo a passo (cron-job.org):**

1. Acesse https://cron-job.org e crie uma conta
2. Clique em **Create cronjob**
3. Configure:
   - **Title**: `Timeline Diary - Notificações Telegram`
   - **Address**: `https://seu-dominio.vercel.app/api/cron/telegram-notifications`
   - **Schedule**: `0 12 * * *` (diário às 12:00 UTC)
   - **Request method**: `GET`
   - **Request headers**: Adicione:
     ```
     Authorization: Bearer seu_CRON_SECRET_aqui
     ```
     Ou use:
     ```
     x-cron-secret: seu_CRON_SECRET_aqui
     ```
4. Salve e ative o cron job

**Nota:** O horário `0 12 * * *` é 12:00 UTC. Para ajustar:
- **Brasil (UTC-3)**: `0 15 * * *` = 12:00 horário de Brasília
- **Brasil (UTC-3)**: `0 9 * * *` = 06:00 horário de Brasília

---

### 3. Testar manualmente (opcional)

Antes de configurar o cron, teste o endpoint manualmente:

**PowerShell:**
```powershell
$headers = @{
    "Authorization" = "Bearer seu_CRON_SECRET_aqui"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/cron/telegram-notifications" -Method GET -Headers $headers
```

**Ou curl:**
```bash
curl -H "Authorization: Bearer seu_CRON_SECRET_aqui" http://localhost:3000/api/cron/telegram-notifications
```

**Resposta esperada:**
```json
{
  "ok": true,
  "sent": 2,
  "skipped": 1,
  "total": 3,
  "results": [
    {
      "userId": "...",
      "pending": true,
      "dueTomorrow": false,
      "weeklyCongrats": false
    }
  ]
}
```

---

## 📋 Resumo das notificações

O sistema envia três tipos de notificações:

### 1. Pendentes por pasta
**Quando:** Diariamente (via cron)
**Mensagem:** `Você tem 3 tarefas pendentes em 'Trabalho'.`
**Condição:** Usuário tem Telegram vinculado + há tarefas não concluídas

### 2. Vence amanhã
**Quando:** Diariamente (via cron)
**Mensagem:** `Lembrete: 'Postar reels' vence amanhã`
**Condição:** Usuário tem Telegram vinculado + há tarefas com `due_date` = amanhã (timezone America/Sao_Paulo)

### 3. Parabéns semanal
**Quando:** Apenas aos domingos (via cron)
**Mensagem:** `Parabéns! Você concluiu 5 tarefas esta semana 🎉`
**Condição:** Usuário tem Telegram vinculado + concluiu pelo menos 1 tarefa na semana atual

---

## 🔍 Troubleshooting

### Notificações não estão sendo enviadas

1. **Verifique se o usuário tem Telegram vinculado:**
   - No site: Configurações → Telegram → deve mostrar "Conta vinculada"
   - No banco: tabela `telegram_users` deve ter registro do usuário

2. **Verifique os logs do cron:**
   - Se usar cron externo, veja os logs no painel do serviço
   - Se usar Vercel Cron, veja em **Functions** → logs do endpoint

3. **Teste o endpoint manualmente** (veja seção 3 acima)

4. **Verifique se `CRON_SECRET` está configurado:**
   - Local: `.env.local`
   - Produção: Vercel Environment Variables

### Erro 401 Unauthorized

- Verifique se o header `Authorization: Bearer <CRON_SECRET>` está sendo enviado
- Confirme que o `CRON_SECRET` no cron job é igual ao do `.env.local` / Vercel

### Notificações duplicadas

- O sistema evita spam: uma mensagem por usuário por tipo de notificação
- Se receber múltiplas, verifique se há múltiplos cron jobs configurados

---

## 📝 Checklist final

- [ ] `CRON_SECRET` configurado no `.env.local`
- [ ] `CRON_SECRET` configurado na Vercel (produção)
- [ ] Cron job configurado (Vercel Pro ou serviço externo)
- [ ] Header de autorização configurado no cron job
- [ ] Teste manual do endpoint funcionando
- [ ] Usuários têm Telegram vinculado
- [ ] Tarefas criadas com `due_date` (para testar "vence amanhã")

---

## 🎯 Próximos passos (opcional)

Após configurar o básico, você pode:

1. **Ajustar horário do cron:** Mude `0 12 * * *` para o horário desejado
2. **Adicionar mais notificações:** Edite `lib/notifications/task-notifications.ts`
3. **Personalizar mensagens:** Edite as strings em `task-notifications.ts`
4. **Adicionar notificação imediata:** Enviar "Parabéns" ao concluir tarefa (edite `app/api/tasks/route.ts`)

---

## 📚 Arquivos relevantes

- `lib/telegram-send.ts` - Helper para enviar mensagens
- `lib/notifications/task-notifications.ts` - Lógica das notificações
- `app/api/cron/telegram-notifications/route.ts` - Endpoint do cron
- `vercel.json` - Configuração do cron (Vercel Pro)
- `.env.local.example` - Exemplo de variáveis de ambiente

---

**Pronto!** Após seguir este tutorial, as notificações Telegram estarão funcionando. 🎉
