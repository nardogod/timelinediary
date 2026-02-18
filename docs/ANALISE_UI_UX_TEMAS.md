# Análise UI/UX – Temas 1 e 2 (Timeline Diary)

## Visão geral

Os dois temas oferecem identidade visual distinta: **Tema 1** (padrão) é neutro e profissional; **Tema 2** alinha a timeline à tela inicial (rosa/roxo, bolhas). A análise abaixo aponta pontos fortes, gaps e próximos passos priorizados.

---

## Tema 1 (Padrão – azul escuro)

### Pontos fortes
- **Clareza e foco**: fundo estático (gradiente azul escuro) reduz distração e facilita leitura da timeline.
- **Contraste**: texto branco e controles em slate/azul garantem boa legibilidade (WCAG).
- **Consistência**: header em `slate-800/80` e bordas `slate-700` formam um bloco visual coerente.
- **Performance**: sem animação de fundo, ideal para dispositivos mais lentos.

### Pontos de atenção
- **Descontinuidade com a landing**: a tela inicial usa rosa/roxo e bolhas; ao entrar na timeline com Tema 1, a mudança é brusca.
- **Identidade genérica**: paleta azul escuro é comum em apps; diferenciação menor.

### Avaliação
- **Hierarquia visual**: boa (header > filtros > timeline).
- **Acessibilidade**: adequada (contraste e tamanhos de toque).
- **Emoção**: neutra, profissional.

---

## Tema 2 (Tela inicial – rosa/roxo)

### Pontos fortes
- **Continuidade de marca**: mesmo universo da landing (gradiente escuro rosa/roxo, bolhas), reforça identidade do produto.
- **Personalidade**: mais calor e “diário” do que o Tema 1.
- **Profundidade**: fundo animado (bolhas) dá sensação de camadas sem competir com o conteúdo, se o overlay for bem dosado.

### Gaps identificados (e tratados nos próximos passos)
1. **Header fixo em slate**  
   O header continua `bg-slate-800/80` e `border-slate-700`, ficando visualmente desconectado do fundo rosa/roxo.  
   → **Solução**: header e barra adaptativos ao tema (Tema 2: fundo/bordas em tons roxo/lavanda).

2. **Botões genéricos**  
   “Criar evento” e ícones (Home, Menu) usam azul/slate. No Tema 2, um CTA em gradiente rosa/roxo ou roxo aumenta a coerência.  
   → **Solução**: botão principal e ícones de ação seguirem a paleta do Tema 2 quando `themeId === 'tema2'`.

3. **Overlay muito escuro**  
   O overlay `bg-slate-900/40` (multiply) escurece bastante as bolhas no Tema 2.  
   → **Solução**: overlay mais suave no Tema 2 (menor opacidade e/ou cor alinhada ao tema) para as bolhas aparecerem mais.

4. **Aba “Tema” no menu**  
   Os dois previews estão no mesmo container; o Tema 2 pode ganhar um indicador “Recomendado” (para quem veio da landing) e preview mais representativo (ex.: mini bolhas no card).  
   → **Solução**: microcopy e preview melhorados na aba Tema.

### Avaliação
- **Hierarquia visual**: boa, mas header “flutuando” em outro tom quebra a unidade.  
- **Acessibilidade**: manter contraste de texto no header (branco sobre roxo escuro) e verificar contraste dos eventos.  
- **Emoção**: mais acolhedora e alinhada à tela inicial.

---

## Resumo comparativo

| Critério            | Tema 1              | Tema 2                    |
|---------------------|---------------------|----------------------------|
| Consistência com landing | Baixa               | Alta                       |
| Distração            | Mínima              | Baixa (se overlay suave)   |
| Identidade           | Neutra              | Forte (rosa/roxo)          |
| Header/controles     | Coerentes           | Desconectados (a corrigir)  |
| Performance          | Melhor              | Boa                        |
| Acessibilidade       | Boa                 | Boa (reforçar contraste)   |

---

## Próximos passos implementados

1. **Header e controles adaptativos**  
   Quando `themeId === 'tema2'`: header com fundo/borda em tons roxo; botão “Criar evento” com gradiente ou cor roxa; ícones em tons claros consistentes.

2. **Overlay do fundo animado**  
   No Tema 2: overlay mais suave (ex.: opacidade menor e/ou cor roxa) para as bolhas permanecerem visíveis e o texto continuar legível.

3. **Aba Tema (Personalizações)**  
   - Preview do Tema 2 com mini bolhas no card.  
   - Badge “Recomendado” ou “Combina com a tela inicial” no Tema 2.  
   - Descrições curtas que guiam a escolha.

4. **Acessibilidade (verificação)**  
   - Contraste de texto no header (Tema 2).  
   - Contraste dos eventos (simple/medium/important) nos dois temas.

Com isso, Tema 1 e Tema 2 ficam coerentes internamente e a transição landing → timeline com Tema 2 fica fluida e alinhada à identidade do produto.

---

## Tema 3 (Leve)

Criado para trazer a **mesma sensação de leveza da tela inicial** (usuário não logado) para o dashboard/timeline:

- **Fundo:** gradiente claro (#FAFAFA → #F5F0FF → #FDF2F8), bolhas suaves (mesma paleta rosa/roxo, opacidade menor).
- **Header e painel:** estilo glass (bg branco/transparente, backdrop-blur, bordas suaves), texto escuro (slate-800, slate-500).
- **Barra de dicas:** fundo claro, texto escuro, sombra leve.
- **Overlay:** mínimo (bg-white/10) para as bolhas aparecerem.

Recomendado para quem prefere ambiente claro e alinhado à landing.

---

## Acessibilidade (atualizado)

- **Header**: `role="banner"` no bloco de perfil e controles.
- **Dashboard (painel do menu)**: `role="complementary"` e `aria-label="Menu e configurações"`.
- **Overlay de fundo**: `aria-hidden="true"` (decorativo).
- **Seleção de tema**: botões com `aria-pressed` (true no tema ativo) e `aria-label` descritivo (Tema 1 / Tema 2 e descrição breve).
- **Transição**: `transition-colors duration-300` no header, overlay e painel do dashboard para troca suave de tema sem piscar.
- **Contraste**: No Tema 2, texto branco e `text-violet-200` sobre `bg-violet-900/70` e fundos escuros mantêm contraste adequado; recomenda-se validar com ferramenta (e.g. axe DevTools) em produção.
