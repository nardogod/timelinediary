# Análise: O que alterar para usar Neon

## Situação atual do projeto

- **Persistência em uso**: `lib/mockData.ts` (eventos/usuários em memória) + `lib/telegram-mock.ts` (localStorage).
- **Auth em uso**: `lib/auth.ts` (mock: login/registro com `MOCK_AUTH_USERS`).
- **Webhook Telegram**: usa `getEventsByUserId` e `createEvent` de **mockData** e `telegram-mock`.
- **Frontend**: 
  - Páginas usam `getUserByUsername`, `getEventsByUsername`, `createEvent` etc. de **mockData** (dados em memória).
  - Apenas a página de criar evento chama `/api/events` e `/api/folders`; essas rotas usam **Supabase** (`createClient` + `supabase.auth.getUser()`). Como não há sessão Supabase, o POST em `/api/events` tende a retornar 401.
- **Código “Supabase” existente**: clientes em `lib/supabase/*`, camada em `lib/db/*` (events, users, folders, telegram) e migrations em `supabase/migrations/` estão preparados para Supabase (Postgres + Auth + RLS), mas **não são o fluxo ativo**; o fluxo ativo é mock + localStorage.

Ou seja: hoje o app funciona com mock/localStorage. Para usar **Neon**, é preciso trocar essa persistência (e opcionalmente o auth) por Postgres no Neon e passar a usar a camada de banco em todo o fluxo.

---

## Diferença Supabase x Neon

| Aspecto | Supabase | Neon |
|--------|----------|------|
| Banco | PostgreSQL | PostgreSQL (serverless) |
| Auth | Supabase Auth (sessão, JWT) | Não tem; precisa de outra solução |
| RLS | Usa `auth.uid()` | Não existe; controle na aplicação |
| Cliente | `@supabase/supabase-js` (REST/Realtime) | Driver Postgres (`@neondatabase/serverless` ou `pg`) |
| Storage / Realtime | Incluídos | Não; usar outros serviços se precisar |

Conclusão: **Neon só substitui o Postgres**. Auth, RLS e qualquer uso de “Supabase Auth” precisam ser substituídos por algo que funcione com Neon (ex.: auth na aplicação ou NextAuth/Clerk + tabelas no Neon).

---

## 1. Alterações nas migrations (Supabase → Neon)

As migrations atuais dependem de **Supabase Auth** e **RLS**. Para Neon é preciso:

- Remover dependência de `auth.users`.
- Trocar RLS por checagens na aplicação (ou remover RLS).

### 1.1 `001_create_users.sql`

- **Problema**: `id UUID PRIMARY KEY REFERENCES auth.users(id)` e políticas com `auth.uid()`.
- **Alterar**:
  - `users.id` como `UUID PRIMARY KEY DEFAULT gen_random_uuid()` (sem `REFERENCES auth.users`).
  - Incluir algo como `password_hash TEXT` (ou o que seu auth usar).
  - Remover RLS ou substituir por políticas que não usem `auth.uid()` (ex.: sem RLS e controle só nas APIs).

Exemplo de usuários “standalone” para Neon:

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
-- Sem RLS ou com políticas que não dependam de auth.uid()
```

### 1.2 Demais migrations

- **002_create_folders.sql**, **003_create_events.sql**, **004_create_telegram_users.sql**, **005_create_telegram_link_tokens.sql**:
  - Manter `REFERENCES users(id)` (agora referenciando a nova tabela `users` sem Supabase).
  - Remover **todas** as políticas RLS que usam `auth.uid()` ou desabilitar RLS nessas tabelas e garantir que apenas as API routes (com sessão da sua aplicação) acessem os dados.

Resumo: criar um conjunto de migrations “Neon” (por exemplo em `supabase/migrations-neon/` ou `migrations/`) com schema compatível com o que a aplicação vai usar, sem Supabase Auth e sem RLS dependente de `auth.uid()`.

---

## 2. Cliente de banco (Supabase → Neon)

- **Remover** (ou deixar de usar):
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/admin.ts`
- **Adicionar** um cliente Neon para uso em server/API, por exemplo:

```ts
// lib/neon.ts ou lib/db/neon.ts
import { neon } from '@neondatabase/serverless';

export function getNeon() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  return neon(url);
}
```

- **Variáveis de ambiente**:
  - Remover (ou ignorar): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
  - Adicionar: `DATABASE_URL` (connection string do Neon).

---

## 3. Camada de dados `lib/db/*`

Hoje todos usam `createClient()` do Supabase e métodos como `.from('events').select()`, etc. Com Neon, as operações são em SQL.

### 3.1 `lib/db/events.ts`

- Trocar `createClient()` por `getNeon()`.
- Trocar cada operação por SQL parametrizado, por exemplo:
  - `getEventsByUserId`: `SELECT * FROM events WHERE user_id = $1 ORDER BY date DESC`.
  - `getEventsByUsername`: primeiro `SELECT id FROM users WHERE username = $1`, depois `getEventsByUserId(id)`.
  - `getEventById`, `createEvent`, `updateEvent`, `deleteEvent`: SQL equivalente (INSERT/UPDATE/DELETE com retorno quando precisar).

A assinatura das funções (parâmetros e retornos) pode ser mantida para não quebrar quem já chama `lib/db/events`.

### 3.2 `lib/db/users.ts`

- Mesma ideia: usar Neon + SQL para:
  - Buscar por id, username, email.
  - Inserir usuário (registro).
  - Atualizar perfil, etc.
- Se usar `password_hash`, criar/atualizar usuário com hash gerado no auth (nunca salvar senha em texto plano).

### 3.3 `lib/db/folders.ts`

- Substituir todas as chamadas Supabase por SQL via Neon (SELECT/INSERT/UPDATE/DELETE em `folders`).

### 3.4 `lib/db/telegram.ts`

- Idem: operações em `telegram_users` e `telegram_link_tokens` em SQL via Neon.
- Manter a mesma interface (funções exportadas) para quem usa hoje (webhook e futuras API routes).

---

## 4. Autenticação (sem Supabase Auth)

Como o Neon não tem auth:

- **Opção A – Manter auth “manual” (como hoje, mas persistido no Neon)**  
  - Continuar com login/registro por email+senha na aplicação.
  - Em `lib/auth.ts`:
    - Registrar: chamar `lib/db/users` para inserir em `users` (com `password_hash`).
    - Login: buscar usuário por email em `lib/db/users`, comparar senha com hash (bcrypt/argon2).
    - Sessão: manter em cookie (JWT assinado ou session id) e, nas API routes, obter `userId` a partir desse cookie/JWT.
  - Remover uso de `MOCK_AUTH_USERS` e qualquer dependência de Supabase Auth.

- **Opção B – NextAuth (ou Auth.js) com Credentials + Neon**  
  - Configurar NextAuth com provider Credentials que valida email/senha contra a tabela `users` no Neon (via `lib/db/users`).
  - Usar adapter do NextAuth para Neon (se quiser sessões no banco).
  - Nas API routes, usar `getServerSession()` (ou equivalente) em vez de `supabase.auth.getUser()`.

Em ambos os casos, o ponto importante é: **todas as rotas que hoje usam `supabase.auth.getUser()` devem passar a obter o usuário da sua sessão (cookie/JWT ou NextAuth)**.

---

## 5. API Routes

### 5.1 `app/api/events/route.ts`

- Deixar de usar `createClient()` e `supabase.auth.getUser()`.
- Obter usuário autenticado pela sessão (cookie/JWT ou NextAuth).
- Usar `getEventsByUserId` e `createEvent` de `@/lib/db/events` (já apontando para Neon).

### 5.2 `app/api/folders/route.ts`

- Mesmo padrão: sessão da aplicação + funções de `lib/db/folders` usando Neon.

### 5.3 `app/api/users/route.ts`

- Idem: sessão + `lib/db/users` com Neon.

### 5.4 Rotas Telegram

- `app/api/telegram/webhook/route.ts`: hoje usa `lib/telegram-mock` e `lib/mockData`.  
  - Trocar para:
    - `lib/db/telegram` (já adaptado para Neon) para vincular conta e validar token.
    - `lib/db/events` para `getEventsByUserId` e `createEvent`.
- `app/api/telegram/link/route.ts`, `status/route.ts`, `generate-token/route.ts`: passar a usar apenas `lib/db/telegram` (Neon), em vez de `telegram-mock`.

---

## 6. Frontend e dados em memória (mockData)

Hoje várias páginas usam diretamente:

- `getUserByUsername`, `getEventsByUsername`, `getEventsByUserId`, `createEvent`, etc. de `mockData`.

Para usar Neon de fato:

- **Opção 1 – Tudo via API**  
  - Criar (ou estender) APIs que exponham usuário e eventos por username/userId.
  - Nas páginas, trocar chamadas a `mockData` por `fetch('/api/...')` (ou hooks que chamem essas APIs).
  - Garantir que essas APIs usem apenas `lib/db/*` (Neon) e sessão da aplicação.

- **Opção 2 – Server Components + Neon**  
  - Em páginas que podem ser server components, chamar `lib/db/users` e `lib/db/events` diretamente no servidor (com sessão) e passar dados como props.
  - Onde for client component, continuar via API ou passar dados do server.

Em qualquer caso, **remover ou desativar o uso de `mockData`** para usuários, eventos e criação de eventos, e **não usar mais `telegram-mock`** para vinculação Telegram; tudo deve ir para Neon via `lib/db/*`.

---

## 7. Resumo de arquivos a alterar

| Onde | O que fazer |
|------|-------------|
| **Migrations** | Nova pasta/set de migrations sem `auth.users` e sem RLS com `auth.uid()`; tabela `users` com `password_hash`; rodar no Neon. |
| **lib/supabase/** | Deixar de usar; opcionalmente remover ou manter só se houver outro uso. |
| **lib/neon.ts** (novo) | Cliente Neon (`@neondatabase/serverless` + `DATABASE_URL`). |
| **lib/db/events.ts** | Reescrever para SQL via Neon; manter assinaturas. |
| **lib/db/users.ts** | Idem; incluir suporte a `password_hash` para auth. |
| **lib/db/folders.ts** | Reescrever para SQL via Neon. |
| **lib/db/telegram.ts** | Reescrever para SQL via Neon (já hoje usa Supabase; trocar por Neon). |
| **lib/auth.ts** | Trocar mock por leitura/escrita em `lib/db/users` + hash de senha; definir como a sessão é criada (cookie/JWT). |
| **contexts/AuthContext.tsx** | Manter uso de `lib/auth`; auth passa a ser “real” contra Neon. |
| **app/api/events/route.ts** | Sessão da app + `lib/db/events` (Neon). |
| **app/api/folders/route.ts** | Sessão + `lib/db/folders` (Neon). |
| **app/api/users/route.ts** | Sessão + `lib/db/users` (Neon). |
| **app/api/telegram/webhook/route.ts** | Usar `lib/db/telegram` e `lib/db/events` (Neon); parar de usar `telegram-mock` e `mockData`. |
| **app/api/telegram/link, status, generate-token** | Usar apenas `lib/db/telegram` (Neon). |
| **Páginas e componentes** | Trocar uso de `mockData` (e, se existir, de `telegram-mock`) por dados vindos de API ou de server components que usem `lib/db/*`. |
| **package.json** | Adicionar `@neondatabase/serverless`; opcionalmente remover `@supabase/supabase-js` e `@supabase/ssr` se não forem mais usados. |
| **.env** | `DATABASE_URL` (Neon); remover variáveis Supabase se não forem mais usadas. |

---

## 8. Ordem sugerida de implementação

1. Criar projeto no Neon e obter `DATABASE_URL`.
2. Adaptar migrations (usuários sem Supabase Auth, sem RLS com `auth.uid()`) e rodar no Neon.
3. Adicionar `lib/neon.ts` e dependência `@neondatabase/serverless`.
4. Migrar `lib/db/events.ts`, `lib/db/users.ts`, `lib/db/folders.ts`, `lib/db/telegram.ts` para Neon (SQL).
5. Decidir e implementar auth (manual com hash + cookie/JWT ou NextAuth) usando `users` no Neon.
6. Atualizar API routes (events, folders, users, telegram) para usar sessão da app + `lib/db/*`.
7. Atualizar webhook e rotas Telegram para usar `lib/db/*` em vez de mock.
8. Atualizar frontend para consumir APIs (ou server components) em vez de `mockData`/`telegram-mock`.
9. Testar fluxo completo (registro, login, eventos, Telegram) com Neon.
10. Remover ou deprecar `mockData` e `telegram-mock` para os fluxos que passaram a usar Neon.

Com isso, o projeto fica usando apenas Neon como banco (PostgreSQL na nuvem), sem Supabase, e com auth e autorização tratados na aplicação.

---

## 9. Cabe no free tier do Neon?

**Free tier (Basic):**  
100 projetos · 100 CU-hrs/projeto · 0,5 GB de armazenamento/projeto · Auth 60k MAU · branching, autoscaling.

### Estimativa de uso do nosso sistema

| Recurso | Limite free | Uso estimado (nosso app) | Cabe? |
|--------|-------------|---------------------------|-------|
| **Storage (0,5 GB)** | 512 MB/projeto | **~5–50 MB** (veja abaixo) | ✅ Sim |
| **Compute (100 CU-hrs/projeto)** | 100 h/mês | **bem menos** (app pequeno/médio) | ✅ Sim |
| **Auth (60k MAU)** | 60.000 usuários/mês | **dezenas a centenas** típico para MVP | ✅ Sim |
| **Projetos** | 100 | 1 projeto = este app | ✅ Sim |

### Armazenamento aproximado (só dados, sem índices)

- **users**: ~300 bytes/linha → 1.000 usuários ≈ 0,3 MB  
- **events**: ~250 bytes/linha → 10.000 eventos ≈ 2,5 MB · 100.000 eventos ≈ 25 MB  
- **folders**, **telegram_***: poucos MB no total  

Cenários típicos:

- **Uso pessoal / MVP**: 1–50 usuários, 500–5.000 eventos → **~2–10 MB**.
- **Pequena base**: 100–500 usuários, 20k–50k eventos → **~15–25 MB**.
- **Crescimento**: 1.000 usuários, 100k eventos → **~30–50 MB** (índices podem levar a ~80–100 MB).

Ou seja: mesmo em cenário de crescimento, ficamos **bem abaixo de 0,5 GB**. O free tier de storage **serve** para este sistema.

### Compute (100 CU-hrs)

- Com autosuspend, só conta quando o banco está ativo.
- App com poucas centenas de requests/dia usa segundos de compute por dia; 100 CU-hrs/mês dá margem grande.
- Só começaria a ser preocupante com tráfego alto (dezenas de milhares de requests/dia ou mais).

### Conclusão

Para uso básico (MVP, uso pessoal, pequena equipe ou comunidade pequena), o **free tier do Neon é suficiente**: storage, compute e 60k MAU cobrem com folga o que este sistema tende a usar. Vale monitorar o uso no dashboard do Neon se o tráfego ou o volume de dados crescer.
