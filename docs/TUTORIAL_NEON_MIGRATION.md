# Tutorial: Rodar a migration no Neon (sem erro de sintaxe)

O erro **`syntax error at or near "UUID"`** com **`EXPLAIN (FORMAT JSON, ...) CREATE TABLE`** aparece quando o **SQL Editor do Neon** (ou outro cliente) executa seu script com **EXPLAIN** na frente. `EXPLAIN` não pode ser usado com `CREATE TABLE` dessa forma.

---

## Solução: executar sem EXPLAIN

### 1. Abrir o SQL Editor no Neon

1. Acesse [Neon Console](https://console.neon.tech).
2. Abra seu projeto.
3. No menu lateral, clique em **SQL Editor**.

### 2. Não usar “Explain” / “EXPLAIN”

- **Não** marque opções do tipo “Explain”, “EXPLAIN” ou “Analyze” antes de rodar.
- Cole **só** o conteúdo do arquivo de migration e execute o script “normal”.

### 3. Colar e executar o script em partes (recomendado)

Em vez de colar o arquivo inteiro de uma vez, rode **um bloco por vez** (cada `CREATE TABLE` / `CREATE INDEX` / função separado). Assim fica mais fácil ver qual comando falhou, se algum falhar.

**Passo A – Tabela `users`:**
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```
Clique em **Run**.

**Passo B – Tabela `folders`:**
```sql
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
```
Run.

**Passo C – Tabela `events`:**
```sql
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  end_date DATE,
  type TEXT NOT NULL CHECK (type IN ('simple', 'medium', 'important')),
  link TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_folder_id ON events(folder_id);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, date DESC);
```
Run.

**Passo D – Tabela `telegram_users`:**
```sql
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, telegram_id)
);
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);
```
Run.

**Passo E – Tabela `telegram_link_tokens`:**
```sql
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telegram_tokens_token ON telegram_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_telegram_tokens_user_id ON telegram_link_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_tokens_expires ON telegram_link_tokens(expires_at);
```
Run.

**Passo F – Função opcional:**
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM telegram_link_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```
Run.

---

## Se ainda der erro em “UUID”

Alguns clientes antigos ou modos “compat” podem não reconhecer `UUID` ou `gen_random_uuid()`. No Neon isso é raro. Se acontecer:

1. Confirme que está no **SQL Editor** do Neon (não em outro cliente com modo diferente).
2. Execute **só o bloco do Passo A** (tabela `users`) e veja a mensagem de erro exata.
3. Se o Neon pedir extensão, no mesmo SQL Editor rode antes:  
   `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`  
   (para `gen_random_uuid()`; em versões recentes do Postgres já vem built-in.)

**Passo G – Tabela `telegram_bot_state` (fluxo conversacional do bot):**

Se usar o bot com fluxo passo a passo, rode também:

```sql
CREATE TABLE IF NOT EXISTS telegram_bot_state (
  telegram_id BIGINT PRIMARY KEY,
  step TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telegram_bot_state_updated ON telegram_bot_state(updated_at);
```

---

## Conferir se deu certo

No SQL Editor, rode:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

Você deve ver: `events`, `folders`, `telegram_link_tokens`, `telegram_users`, `users` (e opcionalmente `telegram_bot_state`).

Depois disso, o registro e login do app (com `DATABASE_URL` e `AUTH_SECRET` configurados) devem funcionar.
