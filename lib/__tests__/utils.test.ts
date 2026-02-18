import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDateBR,
  formatDateReadable,
  formatDateShort,
  daysBetween,
  isToday,
  isTomorrow,
  isPast,
  isFuture,
  getTodayISO,
  getTomorrowISO,
  truncateText,
  capitalize,
  formatEventType,
  getEventTypeEmoji,
} from '../utils';

describe('utils', () => {
  const mockToday = new Date('2026-02-18');
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockToday);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDateBR', () => {
    it('deve formatar data ISO para formato brasileiro', () => {
      expect(formatDateBR('2026-02-20')).toBe('20/02/2026');
      expect(formatDateBR('2026-12-31')).toBe('31/12/2026');
    });

    it('deve retornar string original se formato inválido', () => {
      expect(formatDateBR('invalid')).toBe('invalid');
      expect(formatDateBR('20/02/2026')).toBe('20/02/2026');
    });
  });

  describe('formatDateReadable', () => {
    it('deve formatar data para formato legível', () => {
      const result = formatDateReadable('2026-02-20');
      expect(result).toContain('2026');
      expect(result).toContain('fevereiro');
    });
  });

  describe('formatDateShort', () => {
    it('deve formatar data para formato curto', () => {
      const result = formatDateShort('2026-02-20');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('daysBetween', () => {
    it('deve calcular diferença em dias', () => {
      expect(daysBetween('2026-02-18', '2026-02-20')).toBe(2);
      expect(daysBetween('2026-02-20', '2026-02-18')).toBe(2);
    });
  });

  describe('isToday', () => {
    it('deve identificar data de hoje', () => {
      expect(isToday('2026-02-18')).toBe(true);
      expect(isToday('2026-02-19')).toBe(false);
    });
  });

  describe('isTomorrow', () => {
    it('deve identificar data de amanhã', () => {
      expect(isTomorrow('2026-02-19')).toBe(true);
      expect(isTomorrow('2026-02-18')).toBe(false);
    });
  });

  describe('isPast', () => {
    it('deve identificar datas no passado', () => {
      expect(isPast('2026-02-17')).toBe(true);
      expect(isPast('2026-02-18')).toBe(false);
      expect(isPast('2026-02-19')).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('deve identificar datas no futuro', () => {
      expect(isFuture('2026-02-19')).toBe(true);
      expect(isFuture('2026-02-18')).toBe(false);
      expect(isFuture('2026-02-17')).toBe(false);
    });
  });

  describe('getTodayISO', () => {
    it('deve retornar data de hoje em formato ISO', () => {
      expect(getTodayISO()).toBe('2026-02-18');
    });
  });

  describe('getTomorrowISO', () => {
    it('deve retornar data de amanhã em formato ISO', () => {
      expect(getTomorrowISO()).toBe('2026-02-19');
    });
  });

  describe('truncateText', () => {
    it('deve truncar texto longo', () => {
      const longText = 'A'.repeat(100);
      const result = truncateText(longText, 50);
      expect(result.length).toBe(50);
      expect(result.endsWith('...')).toBe(true);
    });

    it('não deve truncar texto curto', () => {
      expect(truncateText('Curto', 50)).toBe('Curto');
    });
  });

  describe('capitalize', () => {
    it('deve capitalizar primeira letra', () => {
      expect(capitalize('reunião')).toBe('Reunião');
      expect(capitalize('REUNIÃO')).toBe('Reunião');
    });

    it('deve lidar com string vazia', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('formatEventType', () => {
    it('deve formatar tipos corretamente', () => {
      expect(formatEventType('simple')).toBe('Simples');
      expect(formatEventType('medium')).toBe('Médio');
      expect(formatEventType('important')).toBe('Importante');
    });
  });

  describe('getEventTypeEmoji', () => {
    it('deve retornar emoji correto', () => {
      expect(getEventTypeEmoji('simple')).toBe('🟢');
      expect(getEventTypeEmoji('medium')).toBe('🟡');
      expect(getEventTypeEmoji('important')).toBe('🔴');
    });
  });
});
