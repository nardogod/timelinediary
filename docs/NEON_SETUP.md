# Conexão Neon + Cursor (acesso total)

Para **conectar o Cursor ao banco** (ver tabelas, rodar SQL na IDE), veja **[CURSOR_NEON_ACESSO.md](./CURSOR_NEON_ACESSO.md)** — extensão PostgreSQL ou SQL Editor no navegador.

---

## 1. Projeto no Neon

- Projeto: [wispy-voice-66273074](https://console.neon.tech/app/projects/wispy-voice-66273074)
- REST API (opcional): `https://ep-quiet-violet-a9c64kqx.apirest.gwc.azure.neon.tech/neondb/rest/v1`

Para o app usamos a **connection string** (driver serverless), não só a REST API.

## 2. Obter a connection string

1. Abra o [Neon Console](https://console.neon.tech/app/projects/wispy-voice-66273074).
2. No projeto, vá em **Connection details** ou **Dashboard**.
3. Copie a **Connection string** (ex.: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).

## 3. Variáveis de ambiente

Crie ou edite `.env.local` na raiz do projeto (nunca commite este arquivo):

```env
# Obrigatório
DATABASE_URL=postgresql://...cole_a_connection_string_aqui...
AUTH_SECRET=uma_string_longa_aleatoria_min_16_chars

# Telegram (se usar bot)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...

# App URL (webhook)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Gerar um `AUTH_SECRET` seguro:

```bash
openssl rand -base64 24
```

## 4. Rodar a migration no Neon

**Opção A – Diretamente no Cursor (recomendado)**  
Com `DATABASE_URL` já em `.env.local`:

```bash
npm run db:migrate
```

Ou:

```bash
node scripts/run-neon-migration.mjs
```

**Opção B – Pelo navegador**  
1. No [Neon Console](https://console.neon.tech), abra **SQL Editor**.  
2. Copie todo o conteúdo de `neon/migrations/001_neon_schema.sql`.  
3. Cole no editor e execute (Run).

Isso cria as tabelas: `users`, `folders`, `events`, `telegram_users`, `telegram_link_tokens`.

## 5. Conectar o Cursor ao Neon

- **Acesso “total”** = o app (Next.js) acessa o banco com a `DATABASE_URL` em `.env.local`.
- O Cursor usa o mesmo projeto ao rodar `npm run dev` e as API routes; não é preciso configurar nada extra no Cursor além do `.env.local`.
- Para consultar o banco direto no Cursor, use o **SQL Editor** do Neon no navegador ou uma extensão de PostgreSQL no VS Code/Cursor apontando para a mesma connection string (usuário/senha em `.env.local`).

## 6. Verificar conexão com o Neon

Com o app rodando (`npm run dev`):

- **GET** `http://localhost:3000/api/health` — deve retornar **200** (app no ar).
- **GET** `http://localhost:3000/api/health/db` — deve retornar **200** se `DATABASE_URL` estiver correta e o banco responder. Se retornar **503**, confira a connection string e a execução da migration.

## 7. Testar o fluxo

1. Acesse `http://localhost:3000`.
2. Crie uma conta (registro) — isso insere em `users` no Neon.
3. Faça login — sessão via cookie + Neon.
4. Crie um evento — salvo em `events` no Neon.
5. Configure o Telegram (gerar token, vincular) — usa `telegram_users` e `telegram_link_tokens`. Passo a passo: **[TELEGRAM_CONFIG.md](./TELEGRAM_CONFIG.md)**.

## 8. Resumo do que foi migrado

- **Banco**: Supabase/mock → Neon (PostgreSQL serverless).
- **Auth**: Mock → API `/api/auth/login`, `/api/auth/register` + cookie de sessão + tabela `users` com `password_hash`.
- **Eventos e pastas**: APIs e webhook usam `lib/db/events` e `lib/db/folders` (Neon).
- **Telegram**: Webhook e rotas usam `lib/db/telegram` (Neon).
- **Frontend**: Home e perfil buscam usuários/eventos/pastas via `/api/users`, `/api/events`, `/api/folders`.

Credenciais e segredos ficam apenas em `.env.local` (e no Neon Console); não foram colocados no código.
