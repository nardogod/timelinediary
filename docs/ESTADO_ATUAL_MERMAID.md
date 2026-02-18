# Estado atual do projeto – Timeline Agenda

Diagramas Mermaid do estado do sistema em **fevereiro de 2026**.

---

## Resumo único: onde estamos e o que falta

```mermaid
flowchart LR
    subgraph FEITO["✅ Onde estamos"]
        A1[Next.js 16 + React 19]
        A2[Auth: registro, login, sessão HMAC]
        A3[Neon PostgreSQL]
        A4[CRUD eventos + pastas]
        A5[Timeline com linha base + dias do mês]
        A6[Criar evento na Web e Telegram]
        A7[Filtro mês/pasta, datas só YYYY-MM-DD]
        A8[WelcomeBanner, Recommendations, EmptyState]
        A9[Editar evento: página + PATCH API]
        A10[Excluir evento: botão + confirmação + DELETE API]
        A11[Busca global: eventos + usuários]
    end

    subgraph FALTA["⏳ O que falta"]
        B1[Onboarding/tour guiado]
        B2[Notificações de eventos próximos]
        B3[Exportar timeline PDF/JSON]
        B4[Compartilhamento social]
        B5[Testes E2E e mais usuários reais]
    end

    FEITO --> FALTA
```

---

## 1. Visão geral da arquitetura

```mermaid
flowchart TB
    subgraph Client["🖥️ Cliente (Next.js 16)"]
        Home["/ - Home"]
        Auth["/auth/login, /auth/register"]
        Timeline["/u/[username] - Timeline"]
        Create["/u/[username]/create - Criar evento"]
    end

    subgraph API["📡 API Routes"]
        AUTH["/api/auth/*"]
        EVENTS["/api/events"]
        FOLDERS["/api/folders"]
        USERS["/api/users"]
        TG["/api/telegram/*"]
        HEALTH["/api/health"]
    end

    subgraph Backend["⚙️ Backend"]
        SESSION["lib/session - Cookie HMAC"]
        DB["lib/db/* - events, users, folders, telegram"]
    end

    subgraph Data["🗄️ Dados"]
        NEON["Neon PostgreSQL"]
    end

    subgraph External["🌐 Externo"]
        TELEGRAM["Telegram Bot API"]
    end

    Home --> USERS
    Auth --> AUTH
    Timeline --> USERS
    Timeline --> EVENTS
    Timeline --> FOLDERS
    Create --> EVENTS
    Create --> FOLDERS

    AUTH --> SESSION
    EVENTS --> SESSION
    EVENTS --> DB
    FOLDERS --> SESSION
    FOLDERS --> DB
    USERS --> DB
    TG --> DB
    TG --> TELEGRAM

    DB --> NEON
```

---

## 2. Fluxo do usuário

```mermaid
stateDiagram-v2
    [*] --> NãoAutenticado
    NãoAutenticado --> Login: Entrar
    NãoAutenticado --> Registro: Criar conta
    Registro --> Autenticado: Sucesso
    Login --> Autenticado: Sucesso

    Autenticado --> Home: Página inicial
    Home --> MinhaTimeline: Ver minha timeline
    Home --> Explorar: Ver outros perfis

    MinhaTimeline --> TimelineVazia: Sem eventos
    MinhaTimeline --> TimelineComEventos: Com eventos

    TimelineVazia --> CriarEvento: Criar evento
    TimelineComEventos --> CriarEvento: Criar evento
    TimelineComEventos --> FiltrarMes: Filtrar por mês
    TimelineComEventos --> FiltrarPasta: Filtrar por pasta

    CriarEvento --> MinhaTimeline: Salvar
    FiltrarMes --> TimelineComEventos: Ver mês
    FiltrarPasta --> TimelineComEventos: Ver pasta

    MinhaTimeline --> Dashboard: Abrir menu
    Dashboard --> Config: Personalizações
    Dashboard --> Telegram: Vincular Telegram
    Dashboard --> Pastas: Gerenciar pastas
```

---

## 3. Modelo de dados (Neon)

```mermaid
erDiagram
    users ||--o{ events : "tem"
    users ||--o{ folders : "tem"
    users ||--o| telegram_users : "vincula"
    users ||--o{ telegram_link_tokens : "gera"

    folders ||--o{ events : "agrupa"

    users {
        uuid id PK
        text email
        text username
        text name
        text avatar
        text password_hash
        timestamp created_at
    }

    events {
        uuid id PK
        uuid user_id FK
        text title
        date date
        date end_date
        text type
        text link
        uuid folder_id FK
        timestamp created_at
    }

    folders {
        uuid id PK
        uuid user_id FK
        text name
        text color
        timestamp created_at
    }

    telegram_users {
        uuid id PK
        uuid user_id FK
        text telegram_id
        text telegram_username
        timestamp created_at
    }

    telegram_link_tokens {
        uuid id PK
        uuid user_id FK
        text token
        timestamp expires_at
        timestamp used_at
    }
```

---

## 4. Criação de eventos

```mermaid
flowchart LR
    subgraph Web["Web"]
        Form["Formulário /u/.../create"]
        Btn["Botão Criar evento"]
    end

    subgraph Telegram["Telegram"]
        Msg["Mensagem texto"]
        Link["/link token"]
    end

    subgraph API["API"]
        POST_E["POST /api/events"]
        Webhook["POST /api/telegram/webhook"]
    end

    subgraph Persist["Persistência"]
        Neon["Neon - events"]
    end

    Form --> POST_E
    Btn --> Form
    Msg --> Webhook
    Link --> Webhook
    POST_E --> Neon
    Webhook --> Neon
```

---

## 5. Timeline (linha base + eventos)

```mermaid
flowchart TB
    subgraph Page["Página /u/[username]"]
        Filter["Filtro mês / pasta"]
        Header["Header + Criar evento"]
    end

    subgraph Timeline["Componente Timeline"]
        Line["Linha base (sempre visível)"]
        Days["Marcadores diários (dias do mês)"]
        Weeks["Marcadores semanais"]
        Events["Eventos posicionados"]
    end

    subgraph Logic["Lógica"]
        Range["getDateRange(events, defaultMonth)"]
        Pos["calculateEventPosition (local)"]
    end

    Filter --> Range
    Range --> Line
    Range --> Days
    Range --> Weeks
    Pos --> Events
    Line --> Days
    Days --> Events
    Events --> Timeline
```

---

## 6. Estado atual – resumo

```mermaid
mindmap
  root((Timeline Agenda))
    Stack
      Next.js 16
      React 19
      TypeScript
      Tailwind 4
      Neon PostgreSQL
    Auth
      Registro
      Login
      Sessão cookie HMAC
      bcryptjs
    Funcionalidades
      Timeline com linha base
      Eventos por data
      Pastas
      Filtro mês/pasta
      Criar evento Web
      Telegram opcional
    Dados
      users
      events
      folders
      telegram_users
      telegram_link_tokens
    UX
      WelcomeBanner
      Recommendations
      EmptyState
      Datas só YYYY-MM-DD
      Mês atual corrigido
```

---

## 7. Deploy e ambiente

```mermaid
flowchart LR
    subgraph Dev["Desenvolvimento"]
        ENV[.env.local]
        DEV[npm run dev]
    end

    subgraph DB["Banco"]
        MIG[npm run db:migrate]
        NEON[Neon Cloud]
    end

    subgraph Check["Verificação"]
        H["GET /api/health"]
        DBH["GET /api/health/db"]
    end

    ENV --> DEV
    ENV --> MIG
    MIG --> NEON
    DEV --> H
    DEV --> DBH
    DBH --> NEON
```

---

*Documento gerado a partir do estado do repositório em fevereiro/2026.*
