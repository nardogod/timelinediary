# Plano de ação – Meu Mundo

Visão e fases para loja, casas, salas, ações diárias e loop agenda → jogo.

---

## 1. Visão

- **Objetivo:** Quem usa a agenda todo dia sente que está se organizando **e** ganhando XP/moedas no jogo; pet, casas e salas extras e ações diárias (“Relaxar”, “Trabalhar”) amplificam bônus e reduzem stress.
- **Loop:** Agenda (tarefas/eventos) → atividades do jogo → moedas, XP, saúde, stress → loja e missões desbloqueiam itens/capas/avatares/pets/casas/salas; ações diárias (uma vez por dia) dão bônus extra e menos stress.
- **Loja:** Compra de itens, capas, fotos de perfil, pets; parte desbloqueada por **missões** (ex.: “use a agenda X dias”). Compra também de **outra casa** e **outra sala de trabalho** (com bônus melhores).
- **Ações diárias (1x/dia):**
  - **“Relaxar em casa”** (em Minha casa): reduz stress; 1x/dia.
  - **“Trabalhar”** (na Sala de trabalho): naquele dia, bônus de moeda maior e stress menor; 1x/dia por sala; salas/casas melhores = mais bônus; aviso: “Você já usou seu bônus hoje”.
- **Pet:** Ter pet equipado influencia bônus (mais moedas/XP) ou menos stress.

---

## 2. Fases

### Fase 1 – Base do loop (agenda → jogo) ✅ implementada

- [x] Ao concluir tarefa: criar `game_activity` (tipo "trabalho") e atualizar perfil (coins, xp, health, stress).
- [x] Nível a partir de XP (nível = 1 + floor(experience / 100)).
- [x] Checagem de medalhas e atualização de `earned_badge_ids` (lib/game/badge-evaluation.ts).

### Fase 2 – Ações diárias ✅ implementada

- [x] “Relaxar em casa”: botão em Minha casa; 1x/dia; `last_relax_at`; reduz stress.
- [x] “Trabalhar”: botão na Sala de trabalho; 1x/dia; `last_work_bonus_at`; bônus no dia.
- [x] Aviso “Você já usou seu bônus hoje”.

### Fase 3 – Pet e bônus ✅ implementada

- [x] Bônus de pet nas recompensas (mais moedas e menos stress ao concluir tarefas).
- [x] Bônus de pet em “Relaxar em casa” (reduz mais stress).

### Fase 4 – Loja ✅ implementada

- [x] Catálogo (capas, avatares, pets) com preço em moedas.
- [x] Compra e “possui” (game_owned_items); filtro na escolha.

### Fase 5 – Missões e desbloqueios ✅ implementada

- [x] Missões com requisitos (agenda 3 dias, 5 tarefas, nível 2, 100 moedas); desbloqueio de itens (capas, avatar, pet).

### Fase 6 – Múltiplas casas e salas ✅ implementada

- [x] Catálogo de casas e salas (preços; primeira de cada grátis ao criar perfil).
- [x] Compra e seleção ativa (current_house_id, current_work_room_id); bônus diferentes (relax extra por casa, moedas/custo saúde por sala).

---

## 3. Dados a adicionar (futuro)

- Perfil: `last_relax_at`, `last_work_bonus_at`, `current_house_id`, `current_work_room_id`.
- Loja: catálogo de itens; tabela de “possui” (user + item).
- Casas/salas: catálogo com bônus; “possui” e ativa.
