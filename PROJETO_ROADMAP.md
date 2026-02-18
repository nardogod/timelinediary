# 🗺️ Roadmap Completo - Timeline Agenda MVP

## Diagrama de Arquitetura e Fluxo do Projeto (Implementação Atual - Sem Supabase)

```mermaid
graph TB
    subgraph EstadoAtual["📊 ESTADO ATUAL - IMPLEMENTADO"]
        FrontendMock["Frontend Completo<br/>✅ Timeline Visual<br/>✅ Dashboard<br/>✅ Pastas/Conquistas"]
        AuthMock["Autenticação Mockada<br/>localStorage<br/>mockData.ts"]
        MockData["Dados Mockados<br/>mockData.ts<br/>MOCK_EVENTS, MOCK_USERS"]
        TelegramMock["Sistema Telegram Mockado<br/>telegram-mock.ts<br/>localStorage para links"]
    end

    subgraph ArquiteturaAtual["🏗️ ARQUITETURA ATUAL"]
        TelegramUser["👤 Usuário Telegram"]
        Bot["🤖 Bot Telegram"]
        Webhook["📡 Webhook Handler<br/>/api/telegram/webhook<br/>✅ Implementado"]
        MockStorage["💾 Armazenamento Mockado<br/>- mockData.ts (eventos)<br/>- localStorage (auth/links)<br/>- telegram-mock.ts"]
        NextAPI["⚡ Next.js API Routes<br/>✅ /api/telegram/webhook<br/>✅ /api/telegram/link<br/>✅ /api/telegram/generate-token<br/>✅ /api/telegram/status"]
        Frontend["💻 Frontend Next.js<br/>✅ Timeline + Dashboard<br/>✅ TelegramSettings"]
    end

    subgraph FaseFutura["🔮 FASE FUTURA: Migração Supabase"]
        SupabaseSetup["Setup Supabase<br/>- Criar projeto<br/>- Migrations<br/>- RLS Policies"]
        SupabaseClient["Clientes Supabase<br/>lib/supabase/<br/>client.ts + server.ts"]
        MigrateAuth["Migrar Autenticação<br/>Substituir mock<br/>por Supabase Auth"]
        MigrateData["Migrar Dados<br/>lib/db/<br/>events.ts, users.ts"]
        Realtime["Realtime Updates<br/>Supabase Realtime<br/>Notificações instantâneas"]
    end

    EstadoAtual --> ArquiteturaAtual
    ArquiteturaAtual --> FaseFutura

    TelegramUser -->|Comandos/Mensagens| Bot
    Bot -->|POST Updates| Webhook
    Webhook -->|Criar Eventos| MockStorage
    Webhook -->|Validar Links| MockStorage
    NextAPI -->|CRUD| MockStorage
    Frontend -->|Queries| MockStorage
    Frontend -->|Configurar| NextAPI
    NextAPI -->|Validar Token| MockStorage
```

## Fluxo de Criação de Evento via Telegram (Implementação Atual)

```mermaid
sequenceDiagram
    participant U as 👤 Usuário Telegram
    participant B as 🤖 Bot Telegram
    participant W as 📡 Webhook Handler
    participant TM as 💾 telegram-mock.ts
    participant MD as 📝 mockData.ts
    participant F as 💻 Frontend

    Note over U,F: Cenário: Usuário cria evento via Telegram (Sem Supabase)

    U->>B: Envia: "Reunião | 2026-02-05 | important"
    B->>W: POST /api/telegram/webhook<br/>{update: message}
    
    W->>W: Validar secret token
    W->>W: Parsear mensagem<br/>Extrair: título, data, tipo
    
    W->>TM: getTelegramLinkByTelegramId<br/>(telegram_id)
    TM-->>W: Retornar user_id vinculado<br/>(do localStorage)
    
    W->>MD: createEvent(userId, title, date, type)
    MD->>MD: Adicionar a MOCK_EVENTS<br/>(array em memória)
    MD-->>W: Evento criado (id)
    
    W->>B: Resposta formatada<br/>"✅ Evento criado!"
    B->>U: Mostrar confirmação
    
    Note over F: Frontend recarrega para ver<br/>novos eventos (sem Realtime)
```

## Fluxo de Vinculação Telegram ↔ Conta Web (Implementação Atual)

```mermaid
sequenceDiagram
    participant W as 💻 Web App
    participant U as 👤 Usuário
    participant T as 🤖 Telegram Bot
    participant API as ⚡ API /api/telegram/link
    participant TM as 💾 telegram-mock.ts
    participant LS as 📦 localStorage

    Note over W,LS: Processo de vincular conta Telegram com conta web (Sem Supabase)

    U->>W: Acessa página de configurações<br/>Configurações > Telegram
    W->>API: POST /api/telegram/generate-token<br/>{userId}
    API->>TM: generateLinkToken(userId)
    TM->>LS: Salvar token em<br/>timeline_telegram_tokens
    TM-->>API: Retornar token
    API-->>W: Retornar token
    W->>U: Mostrar token<br/>"Use /link ABC123 no bot"
    
    U->>T: Envia: /link ABC123
    T->>API: POST /api/telegram/webhook<br/>{message: /link ABC123}
    
    API->>TM: validateAndUseToken(token)
    TM->>LS: Buscar token em<br/>timeline_telegram_tokens
    LS-->>TM: Token válido (user_id)
    TM->>LS: Remover token usado
    TM-->>API: Retornar user_id
    
    API->>TM: linkTelegramAccount<br/>(user_id, telegram_id)
    TM->>LS: Salvar link em<br/>timeline_telegram_links
    TM-->>API: Link criado
    
    API-->>T: Sucesso
    T->>U: "✅ Conta vinculada!"
    
    Note over W: Frontend pode verificar status<br/>via /api/telegram/status
```

## Estrutura de Dados Atual (Mockado)

```mermaid
erDiagram
    MOCK_USERS ||--o{ MOCK_EVENTS : cria
    MOCK_AUTH_USERS ||--o| TELEGRAM_LINKS : vinculado
    MOCK_AUTH_USERS ||--o{ TELEGRAM_TOKENS : gera

    MOCK_USERS {
        string id PK
        string username UK
        string name
        string avatar
    }

    MOCK_AUTH_USERS {
        string id PK
        string email UK
        string username UK
        string name
        string password
        string avatar
    }

    MOCK_EVENTS {
        string id PK
        string user_id FK
        string title
        string date
        string endDate
        string type
        string link
        string folder
    }

    TELEGRAM_LINKS {
        string userId FK
        number telegramId UK
        string telegramUsername
        string linkedAt
        Note: "Salvo em localStorage<br/>timeline_telegram_links"
    }

    TELEGRAM_TOKENS {
        string userId FK
        string token UK
        string expiresAt
        string createdAt
        Note: "Salvo em localStorage<br/>timeline_telegram_tokens"
    }
```

## Estrutura de Banco de Dados (Futuro - Supabase)

```mermaid
erDiagram
    USERS ||--o{ EVENTS : cria
    USERS ||--o{ FOLDERS : possui
    USERS ||--o| TELEGRAM_USERS : vinculado
    FOLDERS ||--o{ EVENTS : categoriza
    USERS ||--o{ TELEGRAM_LINK_TOKENS : gera

    USERS {
        uuid id PK
        text email UK
        text username UK
        text name
        text avatar
        text password_hash
        timestamp created_at
    }

    EVENTS {
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

    FOLDERS {
        uuid id PK
        uuid user_id FK
        text name
        text color
        timestamp created_at
    }

    TELEGRAM_USERS {
        uuid id PK
        uuid user_id FK
        bigint telegram_id UK
        text telegram_username
        timestamp linked_at
    }

    TELEGRAM_LINK_TOKENS {
        uuid id PK
        uuid user_id FK
        text token UK
        timestamp expires_at
        timestamp created_at
    }
```

## Roadmap de Implementação - Timeline

```mermaid
gantt
    title Timeline de Implementação
    dateFormat YYYY-MM-DD
    section Fase 1: Setup Base (COMPLETO)
    Adaptar Sistema Mockado    :done, a1, 2026-01-31, 1d
    Criar telegram-mock.ts      :done, a2, after a1, 1d
    Migrar Autenticação         :done, a3, after a2, 1d
    
    section Fase 2: Bot Telegram (COMPLETO)
    Setup Bot Telegram          :done, b1, after a3, 1d
    API Webhook                :done, b2, after b1, 1d
    Comandos Básicos           :done, b3, after b2, 1d
    Sistema Vinculação         :done, b4, after b3, 1d
    
    section Fase 3: Integração (COMPLETO)
    UI Configuração            :done, c1, after b4, 1d
    Integração Completa        :done, c2, after c1, 1d
    
    section Fase 4: Migração Supabase (FUTURO)
    Setup Supabase             :crit, d1, 2026-02-10, 2d
    Migrar Dados               :crit, d2, after d1, 3d
    Realtime Updates           :crit, d3, after d2, 2d
```

## Fluxo de Dados Completo (Implementação Atual)

```mermaid
flowchart LR
    subgraph Entrada["📥 Entrada de Dados"]
        WebForm["Formulário Web<br/>/u/[username]/create<br/>✅ Funcionando"]
        TelegramMsg["Mensagem Telegram<br/>Bot Commands<br/>✅ Funcionando"]
    end

    subgraph Processamento["⚙️ Processamento"]
        APIEvents["/api/events<br/>POST/PUT/DELETE<br/>✅ Funcionando"]
        APIWebhook["/api/telegram/webhook<br/>Processar updates<br/>✅ Funcionando"]
        APILink["/api/telegram/link<br/>Vincular conta<br/>✅ Funcionando"]
        APIToken["/api/telegram/generate-token<br/>Gerar token<br/>✅ Funcionando"]
        APIStatus["/api/telegram/status<br/>Verificar status<br/>✅ Funcionando"]
    end

    subgraph Persistencia["💾 Persistência Atual"]
        MockData["mockData.ts<br/>MOCK_EVENTS<br/>MOCK_USERS<br/>Em memória"]
        LocalStorage["localStorage<br/>timeline_user<br/>timeline_telegram_links<br/>timeline_telegram_tokens"]
        TelegramMock["telegram-mock.ts<br/>Funções de vinculação"]
    end

    subgraph Saida["📤 Saída de Dados"]
        FrontendTimeline["Timeline Frontend<br/>Visualização<br/>✅ Funcionando"]
        BotResponse["Respostas Bot<br/>Confirmações<br/>✅ Funcionando"]
    end

    WebForm --> APIEvents
    TelegramMsg --> APIWebhook
    APIEvents --> MockData
    APIWebhook --> MockData
    APIWebhook --> TelegramMock
    APILink --> TelegramMock
    APIToken --> TelegramMock
    APIStatus --> TelegramMock
    
    TelegramMock --> LocalStorage
    MockData --> FrontendTimeline
    TelegramMock --> BotResponse
    
    Note1["⚠️ Dados não persistem<br/>após reiniciar servidor"]
    MockData -.->|Limitação| Note1
```

## Comandos do Bot Telegram (Implementação Atual)

```mermaid
graph TD
    Start["/start<br/>✅ Implementado"] --> Welcome["Boas-vindas<br/>Instruções básicas"]
    
    Link["/link <token><br/>✅ Implementado"] --> ValidateToken["Validar token<br/>telegram-mock.ts"]
    ValidateToken -->|Válido| LinkAccount["Vincular conta<br/>localStorage"]
    ValidateToken -->|Inválido| ErrorMsg["Erro: Token inválido"]
    
    Evento["/evento <título> <data> [tipo]<br/>✅ Implementado"] --> ParseMsg["Parsear mensagem"]
    ParseMsg --> CreateEvent["Criar evento<br/>mockData.ts"]
    CreateEvent --> Confirm["✅ Confirmação"]
    
    Eventos["/eventos<br/>✅ Implementado"] --> ListEvents["Listar últimos<br/>5 eventos<br/>mockData.ts"]
    
    Help["/help<br/>✅ Implementado"] --> ShowHelp["Mostrar ajuda<br/>Todos os comandos"]
    
    TextMsg["Mensagem de texto<br/>✅ Implementado"] --> ParseFormat["Parsear formato:<br/>Título | Data | Tipo | Link"]
    ParseFormat --> CreateEvent
    
    LinkAccount --> Success["✅ Conta vinculada<br/>Salvo em localStorage"]
    
    Note1["⚠️ Dados em memória<br/>Não persistem"]
    CreateEvent -.->|Limitação| Note1
```

## Estrutura de Arquivos do Projeto (Implementação Atual)

```
timeline-agenda/
├── app/
│   ├── api/
│   │   ├── telegram/
│   │   │   ├── webhook/
│   │   │   │   └── route.ts          ✅ IMPLEMENTADO: Webhook handler
│   │   │   ├── link/
│   │   │   │   └── route.ts          ✅ IMPLEMENTADO: Endpoint vinculação
│   │   │   ├── generate-token/
│   │   │   │   └── route.ts          ✅ IMPLEMENTADO: Gerar token
│   │   │   └── status/
│   │   │       └── route.ts          ✅ IMPLEMENTADO: Verificar status
│   │   └── events/
│   │       └── route.ts              ✅ IMPLEMENTADO: API REST eventos
│   ├── auth/
│   │   ├── login/page.tsx            ✅ FUNCIONANDO: Mockado
│   │   └── register/page.tsx         ✅ FUNCIONANDO: Mockado
│   └── u/[username]/
│       ├── page.tsx                  ✅ FUNCIONANDO: Dados mockados
│       └── create/page.tsx           ✅ FUNCIONANDO: Salvar mockData
│
├── components/
│   ├── Dashboard.tsx                 ✅ MODIFICADO: Seção Telegram adicionada
│   ├── EventForm.tsx                 ✅ MODIFICADO: Usa API mockada
│   └── TelegramSettings.tsx           ✅ IMPLEMENTADO: Configuração Telegram
│
├── contexts/
│   └── AuthContext.tsx               ✅ MODIFICADO: localStorage
│
├── lib/
│   ├── telegram-mock.ts              ✅ NOVO: Sistema vinculação Telegram
│   ├── auth.ts                       ✅ MODIFICADO: Sistema mockado
│   └── mockData.ts                   ✅ EM USO: Dados mockados
│
└── supabase/
    └── migrations/                   📋 PRONTO: Migrations SQL (para futuro)
        ├── 001_create_users.sql
        ├── 002_create_events.sql
        ├── 003_create_folders.sql
        ├── 004_create_telegram_users.sql
        └── 005_create_telegram_tokens.sql
```

**Legenda:**
- ✅ = Implementado e funcionando
- 📋 = Criado mas não em uso (para migração futura)

## Variáveis de Ambiente Necessárias (Implementação Atual)

```env
# Telegram (OBRIGATÓRIO)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_SECRET=secreto_aleatorio_para_validacao

# App (OPCIONAL - para webhook)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (OPCIONAL - para migração futura)
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Checklist de Implementação

### ✅ Fase 1: Setup Base (COMPLETO - Sem Supabase)

#### Sistema Mockado
- [x] Adaptar sistema para funcionar sem Supabase
- [x] Criar `lib/telegram-mock.ts` com funções de vinculação usando localStorage
- [x] Implementar funções: `getTelegramLinkByTelegramId`, `getTelegramLinkByUserId`
- [x] Implementar funções: `linkTelegramAccount`, `unlinkTelegramAccount`
- [x] Implementar funções: `generateLinkToken`, `validateAndUseToken`
- [x] Implementar função: `cleanupExpiredTokens`

#### Autenticação
- [x] Migrar `lib/auth.ts` para usar sistema mockado (mockLogin, mockRegister)
- [x] Atualizar `contexts/AuthContext.tsx` para usar localStorage
- [x] Remover dependências do Supabase Auth
- [x] Manter compatibilidade com interface AuthUser

#### Dados Mockados
- [x] Manter `lib/mockData.ts` funcionando
- [x] Usar MOCK_EVENTS para armazenar eventos
- [x] Usar MOCK_AUTH_USERS para autenticação
- [x] Usar MOCK_USERS para perfis públicos

### ✅ Fase 2: Bot Telegram (COMPLETO)

#### Setup Bot
- [x] Criar bot via @BotFather
- [x] Obter BOT_TOKEN
- [x] Configurar webhook (dev: ngrok, prod: Vercel)
- [x] Instalar dependência `grammy`

#### API Webhook
- [x] Criar `app/api/telegram/webhook/route.ts`
- [x] Implementar validação de secret token (`validateWebhook`)
- [x] Implementar parser de mensagens de texto (`parseEventMessage`)
- [x] Integrar com `telegram-mock.ts` para buscar links
- [x] Integrar com `mockData.ts` para criar eventos

#### Comandos do Bot
- [x] Implementar comando `/start` - Boas-vindas e instruções
- [x] Implementar comando `/help` - Lista de comandos disponíveis
- [x] Implementar comando `/link <token>` - Vincular conta Telegram
- [x] Implementar comando `/evento <título> <data> [tipo]` - Criar evento rápido
- [x] Implementar comando `/eventos` - Listar últimos 5 eventos
- [x] Implementar parser de mensagens de texto para criar eventos automaticamente

#### API Routes de Vinculação
- [x] Criar `app/api/telegram/link/route.ts` - Endpoint de vinculação
- [x] Criar `app/api/telegram/generate-token/route.ts` - Gerar token de vinculação
- [x] Criar `app/api/telegram/status/route.ts` - Verificar status de vinculação
- [x] Integrar todas as rotas com `telegram-mock.ts`

### ✅ Fase 3: Integração Frontend (COMPLETO)

#### Componente TelegramSettings
- [x] Criar `components/TelegramSettings.tsx`
- [x] Implementar verificação de status de vinculação
- [x] Implementar geração de token de vinculação
- [x] Implementar interface para copiar token
- [x] Mostrar instruções de uso do bot
- [x] Exibir status de vinculação (vinculado/não vinculado)
- [x] Adicionar feedback visual (sucesso/erro)

#### Dashboard
- [x] Adicionar seção "Telegram" no `components/Dashboard.tsx`
- [x] Criar botão de navegação para seção Telegram
- [x] Integrar `TelegramSettings` no Dashboard
- [x] Mostrar apenas para usuário autenticado (próprio perfil)

#### Formulários e Páginas
- [x] Atualizar `app/u/[username]/create/page.tsx` para usar API mockada
- [x] Atualizar `components/EventForm.tsx` para buscar pastas via API
- [x] Criar `app/api/events/route.ts` para CRUD de eventos
- [x] Criar `app/api/folders/route.ts` para CRUD de pastas

### 🔮 Fase 4: Migração Futura para Supabase (PENDENTE - Opcional)

#### Setup Supabase
- [ ] Criar projeto no Supabase
- [ ] Configurar variáveis de ambiente (NEXT_PUBLIC_SUPABASE_URL, etc.)
- [ ] Executar migrations SQL (já criadas em `supabase/migrations/`):
  - [ ] `001_create_users.sql`
  - [ ] `002_create_folders.sql`
  - [ ] `003_create_events.sql`
  - [ ] `004_create_telegram_users.sql`
  - [ ] `005_create_telegram_link_tokens.sql`
- [ ] Configurar RLS policies (já incluídas nas migrations)

#### Dependências e Clientes
- [ ] Instalar dependências (@supabase/supabase-js, @supabase/ssr)
- [ ] Criar `lib/supabase/client.ts` (já criado, precisa configurar)
- [ ] Criar `lib/supabase/server.ts` (já criado, precisa configurar)
- [ ] Criar `lib/supabase/admin.ts` (já criado, precisa configurar)

#### Migração de Dados
- [ ] Migrar `lib/auth.ts` para usar Supabase Auth
- [ ] Migrar `contexts/AuthContext.tsx` para Supabase Auth
- [ ] Criar `lib/db/events.ts` (já criado, precisa integrar)
- [ ] Criar `lib/db/users.ts` (já criado, precisa integrar)
- [ ] Criar `lib/db/folders.ts` (já criado, precisa integrar)
- [ ] Criar `lib/db/telegram.ts` (já criado, precisa integrar)
- [ ] Atualizar componentes para usar dados reais do Supabase

#### Realtime e Notificações
- [ ] Configurar Supabase Realtime para tabela `events`
- [ ] Implementar subscriptions no frontend
- [ ] Adicionar notificações quando evento é criado via Telegram
- [ ] Atualizar timeline automaticamente com Realtime

#### Limpeza
- [ ] Marcar `lib/mockData.ts` como deprecated
- [ ] Marcar `lib/telegram-mock.ts` como deprecated
- [ ] Remover código mockado após migração completa
- [ ] Atualizar documentação

### 📊 Resumo do Status

**✅ Implementado e Funcionando:**
- Sistema completo de autenticação mockado
- Bot Telegram totalmente funcional
- Sistema de vinculação Telegram ↔ Conta Web
- Interface de configuração Telegram
- Todos os comandos do bot implementados
- API routes todas funcionando

**⚠️ Limitações Atuais:**
- Dados não persistem após reiniciar servidor (apenas em memória)
- Sem sincronização entre dispositivos
- Sem Realtime updates
- Apenas para desenvolvimento/testes

**🔮 Próximos Passos (Opcional):**
- Migração para Supabase quando necessário
- Implementação de Realtime updates
- Persistência de dados permanente

## Status Atual da Implementação

### ✅ COMPLETO (Sem Supabase)
- Sistema de autenticação mockado funcionando
- Bot Telegram completamente funcional
- Sistema de vinculação Telegram implementado
- Todos os comandos do bot funcionando
- Interface de configuração Telegram pronta
- API routes todas funcionando

### 🔮 PRÓXIMOS PASSOS (Migração Supabase - Opcional)
1. **Criar projeto Supabase** e obter credenciais
2. **Configurar variáveis de ambiente** (.env.local)
3. **Executar migrations SQL** (já criadas em supabase/migrations/)
4. **Instalar dependências** Supabase
5. **Migrar funções** de mockData para Supabase
6. **Configurar Realtime** para atualizações instantâneas

---

**Status Atual**: ✅ **IMPLEMENTAÇÃO COMPLETA (Sem Supabase)**  
**Sistema Funcionando**: 🤖 Bot Telegram + Frontend integrado  
**Próxima Fase (Opcional)**: 🔮 Migração para Supabase quando necessário
