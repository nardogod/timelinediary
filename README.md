# Timeline Diary

Timeline Diary é um app que transforma sua rotina em uma **timeline visual**:  
você registra eventos e projetos e ganha um **perfil público bonito** que outras pessoas podem seguir.

---

## O que é o produto hoje

- **Timeline visual**
  - Eventos com data ou período (ex.: viagem 10–15/03)
  - Nível de importância (cores) e link opcional (vídeo, post, repo, etc.)
  - Filtro por mês e por pasta/categoria

- **Pastas de organização**
  - 4 categorias principais: **Trabalho, Estudos, Lazer, Tarefas pessoais**
  - Cada pasta com cor própria e filtros dedicados

- **Perfil público e seguidores**
  - URL pública por usuário (`/u/[username]`)
  - Qualquer pessoa pode seguir sua timeline
  - Home exibe **dois perfis demo** pensados para novos usuários/investidores

- **Integração com Telegram**
  - Criar eventos enviando mensagem para o bot
  - Anexar links rapidamente (ex.: post do Instagram, vídeo, artigo)

---

## Meu Mundo – Camada gamificada

Além da timeline, o app tem o **Meu Mundo**, uma camada leve de gamificação que:

- Resume seu progresso em um card com:
  - **Avatar**, **capa**, **pet** e itens cosméticos
  - **Moedas, nível, saúde e stress** (status gerais, não dados sensíveis)
- Traz uma pequena **loja interna**:
  - Capas, pets e itens visuais
  - Consumíveis de bem-estar (ex.: “Comida Favorita”, “Bebida Favorita”) que afetam só o status do jogo
- Tem **missões por arco de personagem**:
  - Focadas em **hábitos saudáveis de uso** (dias consecutivos, tarefas em pastas diferentes, links na timeline)
  - Sem expor fórmulas detalhadas (toda a lógica fina está isolada em `lib/game/*` e documentada em `docs/` para uso interno)

Os detalhes de balanceamento, XP, moedas e requisitos completos das missões estão em arquivos internos (`docs/REGRAS_XP_MEU_MUNDO.md`, `docs/MISSOES_POR_ARCO.md`) e **não são necessários** para entender o produto do ponto de vista de negócio.

---

## Experiência demo na landing

Usuários não logados veem, na página inicial:

- **`demo_lucas`** – rotina equilibrada (trabalho, estudos, lazer, pessoal), eventos recentes organizados e Meu Mundo em nível intermediário com avatar/capa/pet chamativos.
- **`demo_clara`** – foco em projetos criativos, carreira e bem-estar, também com 4–8 eventos por pasta no mês atual e Meu Mundo visualmente atraente.

Esses perfis são **apenas exemplos**: não revelam dados reais nem a lógica interna completa de gamificação, mas mostram o potencial visual e narrativo do produto.

---

## Visão rápida para investidores

- **Proposta de valor**
  - Oferecer uma forma **visual, compartilhável e bonita** de contar a própria história (vida, carreira, projetos).

- **Diferenciais**
  - Mistura de agenda, diário e portfólio em uma **única timeline visual**.
  - Integração simples com Telegram para registro rápido.
  - Camada de “Meu Mundo” que **motiva constância** sem infantilizar o uso.

- **Estado atual**
  - MVP web funcional (Next.js) com:
    - timeline, pastas, perfil público, follows e busca;
    - bot Telegram para criar eventos;
    - camada de gamificação integrada ao uso diário.

---

## Para devs – setup rápido

```bash
npm install
cp .env.local.example .env.local   # preencher variáveis (nunca commitar .env.local)
npm run db:migrate                 # opcional se já rodou no Neon SQL Editor
npm run dev
```

**Variáveis de ambiente principais** (sem valores aqui, apenas o que existe):

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Neon PostgreSQL |
| `AUTH_SECRET` | Cookie de sessão |
| `TELEGRAM_BOT_TOKEN` | Bot Telegram (ver `docs/TELEGRAM_CONFIG.md`) |
| `TELEGRAM_WEBHOOK_SECRET` | Validação do webhook |
| `NEXT_PUBLIC_APP_URL` | URL pública do app |
| `CRON_SECRET` | Cron de notificações (opcional) |

---

## Stack (alto nível)

- Next.js 16 · React 19 · TypeScript · Tailwind CSS  
- Neon (PostgreSQL)  
- Telegram Bot (grammy)

> **Sobre os demais arquivos `.md` em `docs/`:**  
> são materiais internos (checklists de deploy, detalhes de XP, missões, análises técnicas).  
> Eles ficam visíveis no repositório, mas **não são linkados diretamente no README** para reduzir a superfície de cópia da ideia; servem principalmente para quem já está trabalhando no projeto.***
