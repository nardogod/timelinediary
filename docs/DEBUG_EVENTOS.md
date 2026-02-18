# 🔍 Debug: Eventos Não Aparecendo

## Problema Identificado

Alguns eventos criados não estão aparecendo na timeline.

## Causas Encontradas

### 1. **Formato de Data Incorreto na API**
- A API estava retornando datas como strings no formato `"Wed Feb 18 2026 00:00:00 GMT+0100..."` em vez de `"YYYY-MM-DD"`
- Isso causava problemas na comparação de datas nos filtros

### 2. **Filtro de Mês com Comparação Incorreta**
- O filtro estava usando `new Date(event.date)` que pode ter problemas de timezone
- Comparação direta de strings YYYY-MM-DD é mais confiável

### 3. **Normalização de Data Incompleta**
- A função `toDateOnly` não estava lidando com todos os formatos possíveis de data retornados pelo Neon

## Correções Aplicadas

### ✅ `lib/db/events.ts`
- Melhorada função `toDateOnly` para parsear corretamente qualquer formato de data
- Agora tenta múltiplas estratégias:
  1. Se já é YYYY-MM-DD, retorna direto
  2. Se tem T (ISO), pega só a parte da data
  3. Tenta parsear como Date e converter para YYYY-MM-DD
  4. Fallback para string original

### ✅ `app/u/[username]/page.tsx`
- Filtro de mês agora compara diretamente strings YYYY-MM-DD
- Extrai ano e mês diretamente da string sem usar `new Date()`
- Corrigida comparação: `month - 1 === selectedMonth` (mês é 1-12, selectedMonth é 0-11)

## Como Verificar

1. **Verificar eventos no banco:**
   ```bash
   curl http://localhost:3000/api/events?userId=SEU_USER_ID
   ```
   As datas devem estar no formato `"YYYY-MM-DD"`

2. **Verificar filtros:**
   - Todos os eventos devem aparecer quando `filterActive = false`
   - Filtro por mês deve funcionar corretamente
   - Filtro por pasta deve funcionar corretamente

3. **Verificar console do navegador:**
   - Não deve haver erros de parsing de data
   - `allEvents` deve conter todos os eventos do banco

## Próximos Passos

- [ ] Testar criação de eventos via web
- [ ] Testar criação de eventos via Telegram
- [ ] Verificar se todos os eventos aparecem sem filtros
- [ ] Verificar se filtros funcionam corretamente
- [ ] Verificar se eventos aparecem após recarregar a página
