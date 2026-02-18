/**
 * Utilitários gerais para o projeto Timeline Agenda
 */

/**
 * Normaliza uma string de data para apenas YYYY-MM-DD (sem horário).
 * Aceita "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm:ss..." (ISO).
 */
export function toDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const part = dateStr.trim().split('T')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : dateStr;
}

/**
 * Formata uma data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY).
 * Aceita também ISO com horário; exibe apenas a data.
 */
export function formatDateBR(dateStr: string): string {
  const only = toDateOnly(dateStr);
  if (!only) return dateStr || '';
  const [year, month, day] = only.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formata uma data ISO para formato legível em português (apenas data, sem horário).
 */
export function formatDateReadable(dateStr: string): string {
  const only = toDateOnly(dateStr);
  if (!only) return dateStr || '';
  const date = new Date(only + 'T12:00:00'); // meio-dia UTC para evitar deslocamento de dia
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('pt-BR', options);
}

/**
 * Formata uma data para formato curto em português (apenas data, sem horário).
 */
export function formatDateShort(dateStr: string): string {
  const only = toDateOnly(dateStr);
  if (!only) return dateStr || '';
  const date = new Date(only + 'T12:00:00');
  return date.toLocaleDateString('pt-BR');
}

/**
 * Calcula a diferença em dias entre duas datas
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se uma data é hoje
 */
export function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

/**
 * Verifica se uma data é amanhã
 */
export function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === tomorrow.toISOString().split('T')[0];
}

/**
 * Verifica se uma data está no passado
 */
export function isPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Verifica se uma data está no futuro
 */
export function isFuture(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date > today;
}

/**
 * Obtém a data de hoje no formato ISO
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Obtém a data de amanhã no formato ISO
 */
export function getTomorrowISO(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Trunca um texto para um tamanho máximo, adicionando "..." se necessário
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitaliza a primeira letra de uma string
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Formata o tipo de evento para exibição
 */
export function formatEventType(type: 'simple' | 'medium' | 'important'): string {
  const typeMap = {
    simple: 'Simples',
    medium: 'Médio',
    important: 'Importante',
  };
  return typeMap[type];
}

/**
 * Obtém emoji para tipo de evento
 */
export function getEventTypeEmoji(type: 'simple' | 'medium' | 'important'): string {
  const emojiMap = {
    simple: '🟢',
    medium: '🟡',
    important: '🔴',
  };
  return emojiMap[type];
}

/** Cores por tipo de evento (hex) */
export const EVENT_COLORS: Record<'simple' | 'medium' | 'important', string> = {
  simple: '#10b981',
  medium: '#f59e0b',
  important: '#ef4444',
};

/** Rótulos por tipo de evento */
export const EVENT_TYPE_LABELS: Record<'simple' | 'medium' | 'important', string> = {
  simple: 'Simples',
  medium: 'Médio',
  important: 'Importante',
};

type EventLike = { date: string; type: 'simple' | 'medium' | 'important'; link?: string };

/**
 * Estatísticas de eventos em um mês/ano
 */
export function getMonthStats(
  events: EventLike[],
  year: number,
  month: number
): { total: number; simple: number; medium: number; important: number; withLinks: number } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const inMonth = events.filter((e) => e.date >= startStr && e.date <= endStr);
  const simple = inMonth.filter((e) => e.type === 'simple').length;
  const medium = inMonth.filter((e) => e.type === 'medium').length;
  const important = inMonth.filter((e) => e.type === 'important').length;
  const withLinks = inMonth.filter((e) => e.link && e.link.trim() !== '').length;

  return {
    total: inMonth.length,
    simple,
    medium,
    important,
    withLinks,
  };
}

/** Retorna início e fim do mês em timestamp (dia 1 00:00 e último dia 23:59:59) */
function getMonthRange(year: number, month: number): { min: number; max: number } {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { min: start.getTime(), max: end.getTime() };
}

/** Eventos com pelo menos .date (ISO) */
function getDateRange(events: { date: string }[], defaultMonth?: { year: number; month: number }): { min: number; max: number } {
  // Quando um mês está selecionado, SEMPRE usar o mês completo (linha com todos os dias)
  if (defaultMonth != null) {
    return getMonthRange(defaultMonth.year, defaultMonth.month);
  }
  if (events.length === 0) {
    // Sem eventos e sem mês selecionado: usa mês atual
    const now = new Date();
    return getMonthRange(now.getFullYear(), now.getMonth());
  }
  let min = Infinity;
  let max = -Infinity;
  for (const e of events) {
    const t = new Date(e.date).getTime();
    if (t < min) min = t;
    if (t > max) max = t;
  }
  if (min === max) {
    min -= 7 * 24 * 60 * 60 * 1000;
    max += 7 * 24 * 60 * 60 * 1000;
  }
  return { min, max };
}

/** Converte YYYY-MM-DD para timestamp à meia-noite no fuso local (evita deslocamento no mês atual) */
function parseLocalDate(dateStr: string): number {
  const part = dateStr.trim().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
    const [y, m, d] = part.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0).getTime(); // meio-dia local para evitar bordas
  }
  return new Date(dateStr).getTime();
}

/**
 * Posição percentual (0–100) de uma data na timeline baseada nos eventos
 */
export function calculateEventPosition(dateStr: string, events: { date: string }[], defaultMonth?: { year: number; month: number }): number {
  const { min, max } = getDateRange(events, defaultMonth);
  const t = parseLocalDate(dateStr);
  const p = ((t - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, p));
}

export type TimelineMarker = { date: string; label: string };

/**
 * Marcadores para a timeline (ex.: início de cada semana)
 */
export function getTimelineMarkers(events: { date: string }[], defaultMonth?: { year: number; month: number }): TimelineMarker[] {
  const { min, max } = getDateRange(events, defaultMonth);
  const out: TimelineMarker[] = [];
  const d = new Date(min);
  const end = new Date(max);
  while (d.getTime() <= end.getTime()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push({
      date: `${y}-${m}-${day}`,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    });
    d.setDate(d.getDate() + 7);
  }
  return out;
}

export type DailyMarker = { date: string; isMonthStart: boolean };

/**
 * Marcadores diários para a timeline - sempre mostra todos os dias do mês
 */
export function getDailyMarkers(events: { date: string }[], defaultMonth?: { year: number; month: number }): DailyMarker[] {
  const { min, max } = getDateRange(events, defaultMonth);
  const out: DailyMarker[] = [];
  const d = new Date(min);
  d.setHours(0, 0, 0, 0);
  const end = new Date(max);
  end.setHours(23, 59, 59, 999);
  while (d.getTime() <= end.getTime()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push({
      date: `${y}-${m}-${day}`,
      isMonthStart: d.getDate() === 1,
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Posição vertical do evento (top/bottom) para evitar sobreposição
 */
export function getEventPosition(
  _event: { date: string },
  events: { date: string }[],
  index: number
): 'top' | 'bottom' {
  return index % 2 === 0 ? 'top' : 'bottom';
}
