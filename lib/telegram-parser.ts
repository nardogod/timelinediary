/**
 * Parser melhorado de mensagens do Telegram para criação de eventos
 * 
 * Suporta múltiplos formatos de entrada:
 * - Formato estruturado: "Título | Data | Tipo | Link"
 * - Formato simples: apenas título
 * - Formato com data relativa: "Reunião amanhã"
 * - Formato com data em português: "Reunião 05/02/2026"
 * 
 * @module telegram-parser
 * @see {@link https://github.com/seu-repo/timeline-agenda} Documentação completa
 */

import { sanitizeTitle, sanitizeLink } from './validators';

export interface ParsedEvent {
  title: string;
  date: string; // ISO format (YYYY-MM-DD)
  type: 'simple' | 'medium' | 'important';
  link?: string;
}

export interface ParseResult {
  event: ParsedEvent | null;
  errors: string[];
}

/**
 * Parseia uma mensagem de texto do Telegram e extrai informações do evento
 * 
 * @param text - Texto da mensagem do usuário
 * @returns Objeto ParsedEvent ou null se não conseguir parsear
 */
export function parseEventMessage(text: string): ParsedEvent | null {
  const result = parseEventMessageWithValidation(text);
  return result.event;
}

/**
 * Parseia uma mensagem com validação e retorna erros se houver
 * 
 * @param text - Texto da mensagem do usuário
 * @returns Objeto ParseResult com evento e erros
 */
export function parseEventMessageWithValidation(text: string): ParseResult {
  const errors: string[] = [];

  if (!text || text.trim().length === 0) {
    return { event: null, errors: ['Mensagem não pode estar vazia'] };
  }

  const trimmedText = text.trim();

  let event: ParsedEvent | null = null;

  // Formato estruturado: "Título | Data | Tipo | Link"
  if (trimmedText.includes('|')) {
    event = parseStructuredFormat(trimmedText);
  } else {
    // Formato simples: apenas título (usa data de hoje e tipo simple)
    event = parseSimpleFormat(trimmedText);
  }

  if (!event) {
    return { event: null, errors: ['Não foi possível parsear a mensagem'] };
  }

  // Sanitiza dados
  event.title = sanitizeTitle(event.title);
  // Sanitiza link (pode retornar undefined se não for URL válida)
  event.link = sanitizeLink(event.link);

  // Validações básicas
  if (event.title.length < 2) {
    errors.push('Título muito curto (mínimo 2 caracteres)');
  }
  if (event.title.length > 200) {
    errors.push('Título muito longo (máximo 200 caracteres)');
  }

  return {
    event: errors.length === 0 ? event : null,
    errors,
  };
}

/**
 * Parseia formato estruturado: "Título | Data | Tipo | Link"
 */
function parseStructuredFormat(text: string): ParsedEvent | null {
  const parts = text.split('|').map(p => p.trim());
  
  if (parts.length === 0 || !parts[0] || parts[0].length === 0) {
    return null;
  }

  const title = parts[0];

  // Data (padrão: hoje)
  let dateStr = parts[1] || '';
  const date = parseDate(dateStr) || new Date().toISOString().split('T')[0];

  // Tipo (padrão: simple)
  let type: 'simple' | 'medium' | 'important' = 'simple';
  if (parts[2]) {
    type = parseEventType(parts[2]);
  }

  // Link (opcional)
  const link = parts[3] || extractLinkFromText(text) || undefined;

  return {
    title,
    date,
    type,
    link,
  };
}

/**
 * Parseia formato simples: apenas título
 */
function parseSimpleFormat(text: string): ParsedEvent {
  // Tenta extrair data e tipo do texto usando padrões
  const dateMatch = extractDateFromText(text);
  const typeMatch = extractTypeFromText(text);
  const linkMatch = extractLinkFromText(text);

  // Remove data, tipo e link do título de forma mais precisa
  let title = text;
  
  // Remove data (substitui pelo match exato)
  if (dateMatch) {
    // Remove padrões de data relativa (sem \b para funcionar com acentos)
    const relativeDatePatterns = [
      /(^|\s)hoje(\s|$)/gi,
      /(^|\s)amanhã(\s|$)/gi,
      /(^|\s)amanha(\s|$)/gi,
      /(^|\s)tomorrow(\s|$)/gi,
      /(^|\s)próxima semana(\s|$)/gi,
      /(^|\s)proxima semana(\s|$)/gi,
      /(^|\s)next week(\s|$)/gi,
    ];
    
    // Remove datas absolutas
    const absoluteDatePatterns = [
      /\d{4}-\d{2}-\d{2}/g, // ISO
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g, // DD/MM/YYYY ou MM/DD/YYYY
    ];
    
    // Tenta remover padrões de data relativa diretamente do título
    let removed = false;
    for (let i = 0; i < relativeDatePatterns.length; i++) {
      const pattern = relativeDatePatterns[i];
      if (pattern.test(title)) {
        // Cria novo padrão para replace (regex mantém estado interno)
        const replacePattern = new RegExp(pattern.source, pattern.flags);
        title = title.replace(replacePattern, '').trim();
        removed = true;
        break;
      }
    }
    
    // Se não removeu com padrões relativos, tenta absolutos
    if (!removed && dateMatch.match(/\d/)) {
      // É uma data absoluta (contém números)
      title = title.replace(dateMatch, '').trim();
    }
  }
  
  // Remove tipo (apenas palavras-chave completas)
  // IMPORTANTE: Não remove "simples" ou "simple" pois pode ser parte do título
  if (typeMatch && typeMatch !== 'simple') {
    const typePatterns = [
      /(^|\s)importante(\s|$)/gi,
      /(^|\s)important(\s|$)/gi,
      /(^|\s)urgente(\s|$)/gi,
      /(^|\s)urgent(\s|$)/gi,
      /(^|\s)médio(\s|$)/gi,
      /(^|\s)medio(\s|$)/gi,
      /(^|\s)medium(\s|$)/gi,
    ];
    
    // Remove apenas tipos importantes/urgentes/médio
    for (let i = 0; i < typePatterns.length; i++) {
      const pattern = typePatterns[i];
      if (pattern.test(title)) {
        // Cria novo padrão para replace (regex mantém estado interno)
        const replacePattern = new RegExp(pattern.source, pattern.flags);
        title = title.replace(replacePattern, '').trim();
      }
    }
  }
  
  // Remove link
  if (linkMatch) {
    title = title.replace(linkMatch, '').trim();
  }

  // Limpa espaços extras
  title = title.replace(/\s+/g, ' ').trim();

  const date = parseDate(dateMatch || '') || new Date().toISOString().split('T')[0];
  const type = parseEventType(typeMatch || 'simple');
  const link = linkMatch || undefined;

  return {
    title: title || 'Evento sem título',
    date,
    type,
    link,
  };
}

/**
 * Parseia uma string de data em vários formatos (hoje, amanhã, DD/MM/YYYY, YYYY-MM-DD).
 * Exportado para uso no bot conversacional.
 */
export function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim().length === 0) {
    return null;
  }

  const trimmed = dateStr.trim().toLowerCase();

  // Data relativa: "hoje", "amanhã", etc.
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (trimmed === 'hoje' || trimmed === 'today') {
    return today.toISOString().split('T')[0];
  }
  if (trimmed === 'amanhã' || trimmed === 'amanha' || trimmed === 'tomorrow') {
    return tomorrow.toISOString().split('T')[0];
  }
  if (trimmed.startsWith('próxima') || trimmed.startsWith('proxima')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  // Formato ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return trimmed;
    }
  }

  // Formato brasileiro: DD/MM/YYYY ou DD/MM/YY
  const brDateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brDateMatch) {
    const [, day, month, year] = brDateMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return dateStr;
    }
  }

  // Formato americano: MM/DD/YYYY
  const usDateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (usDateMatch) {
    const [, month, day, year] = usDateMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return dateStr;
    }
  }

  // Tenta parsear como Date padrão
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Extrai data do texto usando padrões
 */
function extractDateFromText(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Padrões de data relativa (sem \b para funcionar com acentos)
  if (/(^|\s)hoje(\s|$)/.test(lowerText) || /(^|\s)today(\s|$)/.test(lowerText)) {
    return 'hoje';
  }
  if (/(^|\s)amanhã(\s|$)/.test(lowerText) || /(^|\s)amanha(\s|$)/.test(lowerText) || /(^|\s)tomorrow(\s|$)/.test(lowerText)) {
    return 'amanhã';
  }
  if (/(^|\s)próxima semana(\s|$)/.test(lowerText) || /(^|\s)proxima semana(\s|$)/.test(lowerText) || /(^|\s)next week(\s|$)/.test(lowerText)) {
    return 'próxima semana';
  }

  // Padrões de data absoluta
  const isoDateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (isoDateMatch) {
    return isoDateMatch[0];
  }

  const brDateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
  if (brDateMatch) {
    return brDateMatch[0];
  }

  return null;
}

/**
 * Parseia tipo de evento
 */
function parseEventType(typeStr: string): 'simple' | 'medium' | 'important' {
  if (!typeStr) {
    return 'simple';
  }

  const lower = typeStr.toLowerCase().trim();

  // Tipos em português
  if (lower === 'importante' || lower === 'important' || lower === 'urgente' || lower === 'urgent') {
    return 'important';
  }
  if (lower === 'médio' || lower === 'medio' || lower === 'medium' || lower === 'normal') {
    return 'medium';
  }
  if (lower === 'simples' || lower === 'simple' || lower === 'básico' || lower === 'basico') {
    return 'simple';
  }

  // Detecta por palavras-chave no texto
  if (lower.includes('importante') || lower.includes('urgente') || lower.includes('important')) {
    return 'important';
  }
  if (lower.includes('médio') || lower.includes('medio') || lower.includes('medium')) {
    return 'medium';
  }

  return 'simple';
}

/**
 * Extrai tipo de evento do texto usando palavras-chave
 */
function extractTypeFromText(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Verifica palavras completas (sem \b para funcionar com acentos)
  if (/(^|\s)importante(\s|$)/.test(lowerText) || /(^|\s)urgente(\s|$)/.test(lowerText) || /(^|\s)important(\s|$)/.test(lowerText)) {
    return 'important';
  }
  if (/(^|\s)médio(\s|$)/.test(lowerText) || /(^|\s)medio(\s|$)/.test(lowerText) || /(^|\s)medium(\s|$)/.test(lowerText)) {
    return 'medium';
  }
  if (/(^|\s)simples(\s|$)/.test(lowerText) || /(^|\s)simple(\s|$)/.test(lowerText)) {
    return 'simple';
  }

  return null;
}

/**
 * Extrai link/URL do texto
 */
function extractLinkFromText(text: string): string | null {
  // Padrão de URL
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
  const matches = text.match(urlPattern);
  
  if (matches && matches.length > 0) {
    let url = matches[0];
    // Adiciona http:// se não tiver protocolo
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  return null;
}
