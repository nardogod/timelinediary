# 🔍 Alternativas Gratuitas ao Supabase (2026)

## 📊 Resumo Comparativo

| Serviço | Tipo | Banco | Limite Gratuito | Expiração | Cartão Necessário |
|---------|------|-------|-----------------|-----------|-------------------|
| **Supabase** | BaaS completo | PostgreSQL | 500 MB, 2 projetos | ❌ Não expira | ❌ Não |
| **Neon** | PostgreSQL Serverless | PostgreSQL | 512 MB, 10 projetos | ❌ Não expira | ❌ Não |
| **Firebase** | BaaS completo | Firestore (NoSQL) | 1 GB storage | ❌ Não expira | ❌ Não |
| **Appwrite** | BaaS open-source | Múltiplos | Self-hosted | - | - |
| **MongoDB Atlas** | Database | MongoDB | 5 GB | ❌ Não expira | ❌ Não |
| **Railway** | Platform + DB | PostgreSQL | $5 crédito/mês | ❌ Não expira | ✅ Sim |
| **Render** | Platform + DB | PostgreSQL | 256 MB | ⚠️ 30 dias | ❌ Não |
| **Fly.io** | Platform + DB | PostgreSQL | 3 GB | ❌ Não expira | ✅ Sim |
| **Cloudflare D1** | Database | SQLite | 5M reads/dia | ❌ Não expira | ❌ Não |
| **CockroachDB** | Database | PostgreSQL | 50M RU | ❌ Não expira | ❌ Não |
| **Xata** | Database | PostgreSQL | 15 GB I/O | ❌ Não expira | ❌ Não |

---

## 🎯 Opções Recomendadas por Categoria

### 1. **BaaS Completo (Backend as a Service)**

#### 🔵 **Supabase** (Atual)
- ✅ **PostgreSQL** completo
- ✅ Auth, Storage, Realtime, Edge Functions
- ✅ 500 MB storage, 2 projetos ativos
- ✅ 50k usuários/mês auth
- ✅ 5 GB bandwidth
- ✅ **Não expira**
- ❌ Limite de 2 projetos simultâneos

#### 🔵 **Firebase** (Google)
- ✅ **Firestore** (NoSQL)
- ✅ Auth, Storage, Functions, Hosting
- ✅ 1 GB storage
- ✅ 50k reads/dia
- ✅ **Não expira**
- ❌ Vendor lock-in (NoSQL)
- ❌ Custo pode escalar rápido

#### 🔵 **Appwrite**
- ✅ **Open-source** (self-hosted)
- ✅ Múltiplos bancos suportados
- ✅ Auth, Storage, Functions
- ✅ Grátis se self-hosted
- ❌ Precisa hospedar você mesmo
- ❌ Mais complexo de configurar

---

### 2. **PostgreSQL Serverless**

#### 🟢 **Neon** ⭐ **RECOMENDADO**
- ✅ **512 MB** storage
- ✅ **10 projetos** gratuitos
- ✅ **190 horas compute/mês**
- ✅ Serverless com autoscaling
- ✅ Branching (dev/test)
- ✅ **Não expira**
- ✅ **Não precisa cartão**
- ✅ 100% compatível PostgreSQL
- ✅ Integração fácil com Next.js

**Ideal para**: Projetos que precisam de PostgreSQL serverless sem limites rígidos

#### 🟡 **CockroachDB**
- ✅ **50 milhões Request Units**/mês
- ✅ PostgreSQL-compatible
- ✅ Serverless
- ✅ **Não expira**
- ⚠️ Pode ser complexo para iniciantes

#### 🟡 **Xata**
- ✅ **15 GB** I/O + storage
- ✅ PostgreSQL-based
- ✅ Serverless
- ✅ **Não expira**
- ⚠️ Menos conhecido, comunidade menor

---

### 3. **Plataformas com Database Incluído**

#### 🟡 **Railway**
- ✅ **$5 crédito/mês** (grátis)
- ✅ PostgreSQL incluído
- ✅ Deploy fácil
- ✅ **Não expira**
- ❌ **Precisa cartão** (mas não cobra se usar só free tier)
- ⚠️ Crédito pode acabar rápido

#### 🔴 **Render**
- ✅ **256 MB** PostgreSQL
- ✅ Deploy fácil
- ❌ **Expira em 30 dias** ⚠️
- ❌ Free tier muito limitado
- ⚠️ Não recomendado para projetos longos

#### 🟡 **Fly.io**
- ✅ **3 GB** PostgreSQL
- ✅ **Não expira**
- ✅ Bom para side projects
- ❌ **Precisa cartão** (para prevenir abuso)

---

### 4. **NoSQL Gratuitas**

#### 🔵 **MongoDB Atlas**
- ✅ **5 GB** storage
- ✅ MongoDB completo
- ✅ **Não expira**
- ✅ Boa documentação
- ❌ NoSQL (diferente do projeto atual)

#### 🔵 **Cloudflare D1**
- ✅ **5 milhões reads/dia**
- ✅ SQLite serverless
- ✅ Integração com Cloudflare Workers
- ✅ **Não expira**
- ⚠️ SQLite (não PostgreSQL)

---

## 🎯 Recomendações por Caso de Uso

### Para Projetos Pequenos/MVP
1. **Neon** - Melhor custo-benefício, não expira, fácil setup
2. **Supabase** - Se precisar de BaaS completo (auth, storage, etc)
3. **Firebase** - Se não se importar com NoSQL

### Para Projetos que Precisam de BaaS Completo
1. **Supabase** - Melhor opção PostgreSQL completa
2. **Firebase** - Se aceitar NoSQL
3. **Appwrite** - Se quiser self-hosted open-source

### Para Projetos que Precisam Apenas de Database
1. **Neon** - PostgreSQL serverless, melhor free tier
2. **MongoDB Atlas** - Se precisar NoSQL
3. **CockroachDB** - Se precisar de escala global

### Para Projetos com Budget Zero (sem cartão)
1. **Neon** - Não precisa cartão, não expira
2. **Supabase** - Não precisa cartão, não expira
3. **MongoDB Atlas** - Não precisa cartão, não expira
4. **Cloudflare D1** - Não precisa cartão, não expira

---

## ⚠️ Considerações Importantes

### Limitações de Free Tier
- **Render**: Expira em 30 dias (não recomendado)
- **Railway**: Crédito limitado ($5/mês)
- **Fly.io**: Precisa cartão (mesmo que não cobre)

### Migração
- **PostgreSQL → PostgreSQL**: Neon, CockroachDB, Xata (fácil)
- **PostgreSQL → NoSQL**: Firebase, MongoDB (requer refatoração)
- **PostgreSQL → SQLite**: Cloudflare D1 (requer adaptações)

### Vendor Lock-in
- **Supabase/Firebase**: Algum lock-in (mas Supabase é open-source)
- **Neon/CockroachDB**: PostgreSQL padrão (menos lock-in)
- **Appwrite**: Open-source (zero lock-in se self-hosted)

---

## 📝 Conclusão

### Top 3 Recomendações para Este Projeto

1. **🥇 Neon** 
   - Melhor alternativa PostgreSQL serverless
   - Free tier generoso (512 MB, 10 projetos)
   - Não expira, não precisa cartão
   - Compatível com código atual

2. **🥈 Supabase** (manter atual)
   - Já está no projeto
   - BaaS completo (auth, storage, realtime)
   - Free tier suficiente para MVP
   - Open-source

3. **🥉 CockroachDB**
   - PostgreSQL-compatible
   - 50M RU/mês grátis
   - Boa para escalar depois
   - Mais complexo de configurar

---

## 🔗 Links Úteis

- [Neon Free Tier](https://neon.tech/pricing)
- [Supabase Pricing](https://supabase.com/pricing)
- [MongoDB Atlas Free Tier](https://www.mongodb.com/cloud/atlas/pricing)
- [Firebase Free Tier](https://firebase.google.com/pricing)
- [Railway Pricing](https://railway.app/pricing)
- [Render Free Tier](https://render.com/docs/free)

---

**Última atualização**: Fevereiro 2026
