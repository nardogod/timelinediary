# Dar acesso ao Neon no Cursor

O projeto já usa o Neon nas **API routes** e nos **scripts** através da variável `DATABASE_URL` no `.env.local`. Para **consultar e editar o banco direto no Cursor**, você pode usar uma extensão de PostgreSQL ou o SQL Editor do Neon no navegador.

---

## Opção 1 – Extensão PostgreSQL no Cursor

### 1. Instalar a extensão

1. No Cursor, abra **Extensions** (Ctrl+Shift+X / Cmd+Shift+X).
2. Pesquise por **PostgreSQL** (por exemplo: **PostgreSQL** da Microsoft ou **Database Client**).
3. Instale a extensão.

### 2. Obter os dados de conexão

A connection string está no seu `.env.local`:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST/neondb?sslmode=require
```

Você pode usar de duas formas:

**A) Colar a connection string**  
Se a extensão tiver “Connect with connection string” ou “URI”, cole o valor de `DATABASE_URL` (a linha inteira, sem `DATABASE_URL=`).

**B) Preencher campo a campo**  
Extraia da URL (exemplo):

| Campo    | Onde está na URL |
|----------|-------------------|
| **Host** | Depois de `@` e antes da próxima `/` ou `:`. Ex.: `ep-xxx-pooler.gwc.azure.neon.tech` |
| **Port** | Se não aparecer, use **5432** |
| **User** | Primeiro valor depois de `://`. Ex.: `neondb_owner` |
| **Password** | Depois do `:` e antes do `@` |
| **Database** | Nome antes de `?`. Ex.: `neondb` |
| **SSL** | Marque **SSL required** ou equivalente (a URL tem `sslmode=require`) |

Exemplo de URL:

```
postgresql://neondb_owner:abc123@ep-quiet-violet-xxx-pooler.gwc.azure.neon.tech/neondb?sslmode=require
```

- Host: `ep-quiet-violet-xxx-pooler.gwc.azure.neon.tech`
- User: `neondb_owner`
- Password: `abc123`
- Database: `neondb`
- SSL: ativado

### 3. Criar a conexão no Cursor

1. Abra a view da extensão (ícone do elephant ou “Database” na barra lateral).
2. **Add Connection** (ou “Nova conexão”).
3. Preencha com os dados acima (ou cole a connection string, se a extensão permitir).
4. **Test Connection** e salve.

Depois disso você pode abrir o banco, ver tabelas (`users`, `events`, etc.) e rodar SQL direto no Cursor.

---

## Opção 2 – Neon SQL Editor (navegador)

1. Acesse [Neon Console](https://console.neon.tech).
2. Abra o projeto.
3. No menu, use **SQL Editor**.
4. Rode suas queries lá (não precisa configurar nada no Cursor).

O Cursor continua usando o mesmo banco via `DATABASE_URL` ao rodar o app e os scripts.

---

## O que já usa o Neon no projeto

- **API** (`/api/auth/*`, `/api/events`, etc.): leem `DATABASE_URL` em tempo de execução (local ou Vercel).
- **Scripts:**  
  - `npm run db:check` → verifica se as tabelas existem.  
  - `npm run db:migrate` → aplica a migration (usa `.env.local`).

Ou seja, o “acesso ao Neon” no Cursor pode ser:

1. **Só rodar scripts** → já funciona com o `.env.local`.
2. **Abrir o banco na interface** → use a Opção 1 (extensão PostgreSQL).
3. **Só consultas rápidas** → use a Opção 2 (SQL Editor no site do Neon).

---

## Segurança

- **Não** commite o `.env.local` nem a connection string no Git.
- A connection string no Cursor fica salva no seu usuário (configuração local), não no repositório.
- Se alguém tiver acesso ao seu PC, evite deixar a extensão com a senha em texto plano; prefira usar o Neon no navegador e manter o `.env.local` só para o app.
