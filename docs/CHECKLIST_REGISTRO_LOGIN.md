# Checklist: Registro e login em produção (500/503)

Se ao **criar conta** ou **entrar** você recebe erro 500 ou a mensagem menciona configuração do servidor, confira:

---

## 1. Variáveis na Vercel

Vercel → **Settings** → **Environment Variables**:

| Variável        | Obrigatória | Descrição |
|-----------------|-------------|-----------|
| `DATABASE_URL`  | Sim         | Connection string do Neon (PostgreSQL). Ex.: `postgresql://user:pass@ep-xxx.gwc.azure.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET`   | Sim         | Mínimo 16 caracteres. Ex.: gerar com `openssl rand -base64 24` |

Sem essas duas, registro e login retornam **503** e a mensagem na tela pede para verificar a Vercel.

---

## 2. Migration no Neon

A tabela `users` precisa existir no banco.

- **Neon Console** → seu projeto → **SQL Editor**.
- Cole todo o conteúdo de **`neon/migrations/001_neon_schema.sql`** e execute (Run).
- Isso cria as tabelas: `users`, `folders`, `events`, `telegram_users`, `telegram_link_tokens`.

Se a migration não foi rodada, o registro pode retornar **500** e a mensagem sugere conferir a migration.

---

## 3. Testar conexão com o banco

No navegador, abra:

```
https://timelinediary.vercel.app/api/health/db
```

- **200** e `{"ok": true, ...}`: banco acessível.
- **503** ou erro: confira `DATABASE_URL` e se a migration foi executada.

---

## 4. Redeploy após alterar variáveis

Sempre que adicionar ou alterar variáveis de ambiente na Vercel, faça **Redeploy** (Deployments → ⋮ → Redeploy) para as funções usarem os novos valores.

---

## Resumo

1. `DATABASE_URL` e `AUTH_SECRET` configuradas na Vercel.  
2. Migration `001_neon_schema.sql` executada no Neon.  
3. `/api/health/db` retorna 200.  
4. Redeploy após mudar env.

Depois disso, criar conta e login devem funcionar em **https://timelinediary.vercel.app**.
