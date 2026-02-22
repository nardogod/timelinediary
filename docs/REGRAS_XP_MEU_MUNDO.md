# Regras de XP e recompensas — Meu Mundo

Tabelas de referência para o jogador e para a implementação: XP, stress, saúde, pets e capas.

---

## 1. Regras gerais de XP e stress (pasta Trabalho)

| Regra | Condição | Efeito |
|-------|----------|--------|
| **Penalidade por stress** | Stress ≥ 30% | O jogador ganha **60% do XP** (moedas, saúde e stress inalterados). |
| **Penalidade por stress** | Stress ≥ 60% e &lt; 100% | O jogador ganha **30% do XP** em trabalho (moedas inalteradas). |
| **Burnout** | Stress ≥ 100% | **Trabalho e estudos** não dão XP nem moedas. O stress pode passar de 100% até 120%; só reduz com lazer ou Relaxar em casa. Status visível com recomendação. |
| **Status "doente"** | Saúde ≤ 50% | Ao fazer **trabalho**: 50% moedas, 50% XP, **mais** perda de saúde e **mais** ganho de stress. |
| **Morte** | Saúde = 0% | Conta de **jogo** resetada: nível 1, 200 moedas, saúde 100, stress 0, sem itens desbloqueados (só capa padrão e avatar personagem 9), só casa_1 e sala_1. |

**Burnout (visível ao jogador):** Quando o stress está ≥ 100%, o jogo mostra o status "Burnout" e uma recomendação curta: *"Faça atividades de lazer na sua vida pessoal ou relaxe em casa."* O stress pode subir até 120% até o jogador se recuperar.

*Temporário:* ao clicar em **"Trabalhar"** na Sala de Trabalho (1x/dia), o jogador também recebe **+50 XP** além das moedas e alterações de saúde/stress.

---

## 2. Importância do evento (multiplicador nas recompensas)

Ao concluir uma tarefa/evento, a importância escolhida na timeline multiplica todas as recompensas da pasta (XP, moedas, saúde, stress):

| Importância | Multiplicador | Descrição |
|-------------|---------------|-----------|
| Simples    | 0,6× | Menos recompensa. |
| Médio      | 1×   | Valor normal. |
| Importante | 1,4× | Maior recompensa. |

---

## 3. Recompensas base por tipo de pasta

Valores base (antes de importância, pet, capa, bônus “Trabalhar” e penalidades de stress/saúde):

| Pasta            | Moedas | XP  | Saúde | Stress |
|------------------|--------|-----|-------|--------|
| Trabalho         | 120    | 35  | -6    | +16    |
| Estudos          | 0      | 55  | -3    | +8     |
| Lazer            | 0      | 0   | +12   | -8     |
| Tarefas pessoais | 0      | 0   | +5    | -4     |

---

## 4. Pets — multiplicadores anti-stress e preço

Cada pet reduz uma **porcentagem do stress** ao concluir atividades (trabalho, estudos, etc.). Ter um pet também dá **+10% de moedas** em pastas que dão moeda. Preço e bônus anti-stress variam por pet.

| Pet           | Anti-stress ao concluir atividade | Preço (moedas) |
|---------------|------------------------------------|----------------|
| Cachorrinho   | 5% menos stress                    | 4 800          |
| Pet 2         | 10% menos stress                   | 7 200          |
| Gato          | 8% menos stress                    | 6 000          |
| Coruja        | 12% menos stress                   | 9 000          |

*Relaxar em casa com pet equipado reduz 20% a mais de stress.*

*Na loja, os ícones de personagens (avatares) são visíveis para todos; só podem ser desbloqueados completando missões (não são compráveis com moedas). Capas e pets continuam compráveis com moedas.*

---

## 5. Capas — anti-stress e dinheiro ao trabalhar (%)

Cada capa dá um pouco de **bônus anti-stress** (redução de stress ao concluir atividades) e um pouco mais de **dinheiro** ao trabalhar/concluir tarefas que dão moedas. Tudo em porcentagem, com diferenças entre as capas para o personagem escolher.

| Capa     | Anti-stress (%) | + Dinheiro (%) | Outros bônus                    |
|----------|------------------|----------------|----------------------------------|
| Padrão   | —                | —              | Nenhum (desbloqueada por padrão). |
| Capa 1   | 2%               | 2%             | +3% XP                           |
| Capa 2   | 3%               | 5%             | —                                |
| Capa 3   | 5%               | 2%             | —                                |
| Capa 4   | 3%               | 3%             | +1 saúde ao concluir/relaxar     |
| Capa 5   | 4%               | 4%             | +2% XP                           |

*Os percentuais de anti-stress reduzem o **ganho** de stress ao concluir a atividade; os de dinheiro aumentam as moedas ganhas em tarefas que já dão moedas.*

---

## 6. Níveis e XP progressivo

- **Nível máximo:** 50.  
- **Tabela progressiva:** cada nível exige um pouco mais de XP que o anterior (base 88 XP para o nível 2, depois +3 XP por nível).  
- **Meta de ritmo:** uso intenso (~8 h/dia, várias tarefas trabalho/estudos) leva ao menos ~30 dias para atingir o nível 50 (~7 840 XP totais).  
- Ao ganhar XP (concluir tarefas/eventos), a barra de progresso sobe; ao encher, sobe de nível e o jogo exibe efeito visual de "Level Up!".

Referência: `lib/game/level-progression.ts`.

---

## 7. Catch-up (volta após dias sem jogar)

Se o jogador não concluiu nenhuma atividade nos últimos dias, as **duas primeiras** atividades do dia de retorno ganham bônus de XP e moedas:

| Dias sem jogar | Bônus (XP e moedas) |
|----------------|----------------------|
| 1 dia          | +10%                 |
| 2 dias         | +20%                 |
| 3+ dias        | +30%                 |

---

## 8. Streaks (consistência)

- **Dias consecutivos:** ter concluído pelo menos uma atividade em dias seguidos dá bônus no dia atual: 2 dias +5%, 3 dias +10%, 4 dias +15%, 5 ou mais +20% (XP e moedas).  
- **Atividades no mesmo dia:** 2ª atividade do dia +5%, 3ª +10%, 4ª +15%, 5ª ou mais +20%.  
- O maior bônus entre "dias consecutivos" e "mesmo dia" é aplicado.

---

## 9. Ordem de aplicação (resumo)

1. Recompensa base da pasta × importância do evento  
2. **Burnout:** se stress ≥ 100% e pasta é Trabalho ou Estudos → 0 XP e 0 moedas (fim do cálculo para essa atividade).
3. Penalidade de XP por stress (só pasta trabalho: 30%+ → 60% XP; 60%+ → 30% XP)  
4. Bônus “Trabalhar” hoje (se ativou: mais moedas, menos stress em trabalho)  
5. Pet: +10% moedas (se der moeda), redução de stress conforme tabela de pets  
6. Capa: +XP %, +moedas %, anti-stress %, saúde extra  
7. Status doente (saúde ≤ 50% em trabalho): reduz moedas/XP, aumenta perda de saúde e ganho de stress  
8. **Catch-up:** se voltou após 1+ dias sem jogar, primeiras 2 atividades do dia com +10% a +30%  
9. **Streak:** bônus por dias consecutivos ou por atividades no mesmo dia (+5% a +20%)  
10. Se saúde chegar a 0: reset completo do jogo (morte)

Referência de código: `lib/db/game.ts` (`recordTaskCompletedForGame`), `lib/game/folder-types.ts`, `lib/game/level-progression.ts`, `lib/game/pet-assets.ts`, `lib/game/cover-bonuses.ts`.
