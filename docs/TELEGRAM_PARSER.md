# 📝 Documentação do Parser de Mensagens Telegram

## Visão Geral

O parser de mensagens do Telegram (`lib/telegram-parser.ts`) é responsável por interpretar mensagens de texto enviadas pelos usuários e extrair informações estruturadas para criar eventos na timeline.

## Funcionalidades

### ✅ Formatos Suportados

#### 1. Formato Estruturado
```
Título | Data | Tipo | Link
```

**Exemplos:**
- `Reunião | 2026-02-20 | important | https://meet.google.com/abc`
- `Apresentação | 20/02/2026 | medium`
- `Evento simples | 2026-02-25`

#### 2. Formato Simples
Apenas o título do evento. O parser detecta automaticamente:
- Datas relativas ("hoje", "amanhã", "próxima semana")
- Tipos de evento por palavras-chave
- Links/URLs

**Exemplos:**
- `Reunião importante amanhã`
- `Apresentação urgente hoje https://zoom.us/j/123`
- `Evento simples`

### 📅 Formatos de Data Suportados

#### Datas Relativas
- `hoje` / `today` → Data atual
- `amanhã` / `amanha` / `tomorrow` → Próximo dia
- `próxima semana` / `proxima semana` / `next week` → 7 dias à frente

#### Datas Absolutas
- **ISO**: `2026-02-20` (YYYY-MM-DD)
- **Brasileiro**: `20/02/2026` ou `20/02/26` (DD/MM/YYYY)
- **Americano**: `02/20/2026` (MM/DD/YYYY)

### 🏷️ Tipos de Evento

O parser detecta automaticamente o tipo através de palavras-chave:

- **Important** (`important`):
  - Palavras: "importante", "important", "urgente", "urgent"
  - Exemplo: `Reunião importante amanhã`

- **Medium** (`medium`):
  - Palavras: "médio", "medio", "medium", "normal"
  - Exemplo: `Reunião médio`

- **Simple** (`simple`):
  - Padrão quando nenhuma palavra-chave é detectada
  - Exemplo: `Reunião simples`

### 🔗 Extração de Links

O parser extrai automaticamente URLs do texto:

- `https://example.com`
- `http://example.com`
- `www.example.com` (adiciona https:// automaticamente)
- `example.com` (adiciona https:// automaticamente)

## Uso

### Função Principal

```typescript
import { parseEventMessage, parseEventMessageWithValidation } from '@/lib/telegram-parser';

// Parse simples (retorna null em caso de erro)
const event = parseEventMessage('Reunião importante amanhã');
if (event) {
  console.log(event.title); // "Reunião"
  console.log(event.date);  // "2026-02-19"
  console.log(event.type);  // "important"
}

// Parse com validação (retorna erros)
const result = parseEventMessageWithValidation('Reunião importante amanhã');
if (result.event) {
  // Evento válido
} else {
  console.log(result.errors); // Array de erros
}
```

### Interface ParsedEvent

```typescript
interface ParsedEvent {
  title: string;           // Título do evento (sanitizado)
  date: string;            // Data em formato ISO (YYYY-MM-DD)
  type: 'simple' | 'medium' | 'important';
  link?: string;           // URL opcional (sanitizada)
}
```

## Validações

O parser integra com o módulo de validações (`lib/validators.ts`):

- ✅ Validação de título (2-200 caracteres)
- ✅ Validação de data (formato, validade, limites)
- ✅ Validação de tipo
- ✅ Validação de link (formato URL)
- ✅ Sanitização de dados (remove caracteres perigosos)

## Exemplos de Uso

### Exemplo 1: Formato Estruturado Completo
```
Input: "Reunião | 2026-02-20 | important | https://meet.google.com/abc"
Output: {
  title: "Reunião",
  date: "2026-02-20",
  type: "important",
  link: "https://meet.google.com/abc"
}
```

### Exemplo 2: Formato Simples com Data Relativa
```
Input: "Reunião importante amanhã"
Output: {
  title: "Reunião",
  date: "2026-02-19", // Amanhã
  type: "important",
  link: undefined
}
```

### Exemplo 3: Formato Simples com Link
```
Input: "Apresentação hoje https://zoom.us/j/123"
Output: {
  title: "Apresentação",
  date: "2026-02-18", // Hoje
  type: "simple",
  link: "https://zoom.us/j/123"
}
```

### Exemplo 4: Apenas Título
```
Input: "Reunião simples"
Output: {
  title: "Reunião simples",
  date: "2026-02-18", // Hoje (padrão)
  type: "simple",
  link: undefined
}
```

## Tratamento de Erros

### Erros Comuns

1. **Mensagem vazia**
   - Retorna: `null` ou `{ event: null, errors: ['Mensagem não pode estar vazia'] }`

2. **Título muito curto**
   - Erro: `'Título muito curto (mínimo 2 caracteres)'`

3. **Data inválida**
   - Erro: `'Data inválida'` ou `'Data deve estar no formato YYYY-MM-DD'`

4. **Link inválido**
   - Erro: `'Link deve ser uma URL válida'`

## Melhorias Futuras

- [ ] Suporte a horários ("às 14h", "14:30")
- [ ] Suporte a eventos recorrentes ("toda segunda-feira")
- [ ] Suporte a múltiplos idiomas
- [ ] Sugestões inteligentes quando formato não é claro
- [ ] Validação de conflitos de eventos

## Testes

O parser possui 41 testes unitários cobrindo:
- ✅ Formatos estruturados e simples
- ✅ Datas relativas e absolutas
- ✅ Detecção de tipos
- ✅ Extração de links
- ✅ Casos de borda e erros

Execute os testes:
```bash
npm test -- lib/__tests__/telegram-parser.test.ts
```

## Contribuindo

Ao adicionar novos formatos ou funcionalidades:
1. Adicione testes unitários
2. Atualize esta documentação
3. Mantenha compatibilidade com formatos existentes
