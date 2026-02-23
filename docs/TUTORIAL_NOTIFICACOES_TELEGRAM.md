# 📱 Tutorial: Configurar Notificações Telegram para Notas

Este tutorial explica como configurar e ativar as notificações Telegram para o sistema de notas/tarefas.

**App em produção:** [https://timelinediary.vercel.app](https://timelinediary.vercel.app)

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

Use um serviço externo como **cron-job.org** ou **EasyCron**. Abaixo o passo a passo para o [cron-job.org](https://cron-job.org).

**URL do app (produção):** [https://timelinediary.vercel.app](https://timelinediary.vercel.app)

**Passo a passo (cron-job.org):**

1. Acesse https://cron-job.org e crie uma conta (ou faça login).
2. Clique em **Create cronjob**.
3. **Aba COMMON:**
   - **Title:** `Timeline Diary - Notificações Telegram`
   - **URL:** use a URL **completa** do endpoint (não só o domínio):
     ```
     https://timelinediary.vercel.app/api/cron/telegram-notifications
     ```
   - **Enable job:** deixe ligado (on).
   - **Schedule:** escolha **"Every day at 12:00"** (crontab `0 12 * * *` = 12:00 UTC).
   - Se quiser horário de Brasília: em **Time zone** (aba ADVANCED) use `America/Sao_Paulo`; 12:00 UTC = 09:00 BRT.
4. **Aba ADVANCED:**
   - **Request method:** `GET` (já é o padrão).
   - Em **Headers**, clique em **"+ ADD"** e adicione um header de autorização:
     - **Name:** `Authorization`  
     - **Value:** `Bearer SEU_CRON_SECRET_AQUI`  
     (substitua `SEU_CRON_SECRET_AQUI` pelo valor de `CRON_SECRET` configurado na Vercel.)
     - Alternativa: **Name** `x-cron-secret`, **Value** `SEU_CRON_SECRET_AQUI`.
5. Clique em **CREATE** (ou use **TEST RUN** para testar antes).

**Nota sobre horário:** O crontab `0 12 * * *` é 12:00 UTC. Para disparar em horário de Brasília (UTC-3):
- `0 15 * * *` = 12:00 em Brasília
- `0 9 * * *` = 06:00 em Brasília

---

### 3. Testar manualmente (opcional)

Antes de confiar no cron, teste o endpoint:

**Produção (Vercel):**
```bash
curl -H "Authorization: Bearer SEU_CRON_SECRET" https://timelinediary.vercel.app/api/cron/telegram-notifications
```

**PowerShell (produção):**
```powershell
$headers = @{ "Authorization" = "Bearer SEU_CRON_SECRET" }
Invoke-RestMethod -Uri "https://timelinediary.vercel.app/api/cron/telegram-notifications" -Method GET -Headers $headers
```

**Local (npm run dev):**
```bash
curl -H "Authorization: Bearer SEU_CRON_SECRET" http://localhost:3000/api/cron/telegram-notifications
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

Todas rodam no **mesmo horário** em que o cron está agendado (ex.: todo dia às 12:00 UTC, ou ao horário que você definiu no cron-job.org). Para cada usuário com Telegram vinculado, o sistema verifica as três condições abaixo e envia **no máximo uma mensagem por tipo** (pendentes, vence amanhã, parabéns).

| Tipo | Frequência | Condição | Conteúdo |
|------|------------|----------|----------|
| **Resumo diário** | Todo dia (quando o cron roda) | Pendentes, vence amanhã ou eventos esta semana | Tarefas pendentes (títulos por pasta), tarefas que vencem amanhã (títulos), eventos da timeline (amanhã até domingo) |
| **Parabéns semanal** | Só aos **domingos** (quando o cron roda) | Concluiu ≥ 1 tarefa na semana | Ver abaixo |

### 1. Resumo diário (uma mensagem)
**Quando:** Diariamente, no horário do cron.  
**Condição:** Usuário tem Telegram vinculado e pelo menos um dos itens: tarefas pendentes, tarefas que vencem amanhã, ou eventos na timeline (amanhã ou esta semana).  
**Conteúdo real:** o sistema envia **apenas dados reais** do usuário (nomes das pastas, títulos das tarefas e eventos tal como foram cadastrados). Não há mensagens de teste genéricas. O formato da mensagem é:

```
📋 Pendentes:
Em 'trabalho':
  • Revisar relatório
  • Enviar e-mail para o cliente
Em 'lazer':
  • Academia

⏰ Amanhã vence:
  • Revisar relatório vence amanhã

📅 Amanhã e esta semana na timeline:
  • Reunião com equipe (21/02)
  • Entrega do projeto (23/02)
```

- **Pendentes:** lista o **título exato** de cada tarefa não concluída, agrupada por pasta (ex.: em "lazer" as tarefas "klkl,I," e "a" aparecem com esses nomes).  
- **Vence amanhã:** lista o título de cada tarefa com data de vencimento = amanhã.  
- **Timeline:** eventos cadastrados na timeline cuja data é amanhã ou ainda esta semana (até domingo), com título e data (dd/MM).

### 2. Parabéns semanal
**Quando:** Apenas aos domingos, no horário do cron.  
**Condição:** Usuário tem Telegram vinculado + concluiu pelo menos 1 tarefa na semana atual.  
**Mensagem (exemplo):**
```
🎉 Parabéns! Você concluiu 5 tarefas esta semana.
```

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
