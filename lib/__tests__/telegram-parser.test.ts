import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseEventMessage, ParsedEvent } from '../telegram-parser';

describe('parseEventMessage', () => {
  // Mock da data atual para testes consistentes
  const mockToday = new Date('2026-02-18');
  const mockTomorrow = new Date('2026-02-19');
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockToday);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Formato estruturado (com |)', () => {
    it('deve parsear formato completo: Título | Data | Tipo | Link', () => {
      const result = parseEventMessage('Reunião | 2026-02-20 | important | https://meet.google.com/abc');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Reunião');
      expect(result?.date).toBe('2026-02-20');
      expect(result?.type).toBe('important');
      expect(result?.link).toBe('https://meet.google.com/abc');
    });

    it('deve parsear formato sem link', () => {
      const result = parseEventMessage('Apresentação | 2026-02-25 | medium');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Apresentação');
      expect(result?.date).toBe('2026-02-25');
      expect(result?.type).toBe('medium');
      expect(result?.link).toBeUndefined();
    });

    it('deve usar data de hoje quando não especificada', () => {
      const result = parseEventMessage('Evento simples | | simple');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Evento simples');
      expect(result?.date).toBe('2026-02-18'); // Data mockada
      expect(result?.type).toBe('simple');
    });

    it('deve usar tipo simple como padrão', () => {
      const result = parseEventMessage('Evento | 2026-02-20');
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('simple');
    });

    it('deve parsear data em formato brasileiro DD/MM/YYYY', () => {
      const result = parseEventMessage('Reunião | 20/02/2026 | important');
      
      expect(result).not.toBeNull();
      expect(result?.date).toBe('2026-02-20');
    });

    it('deve parsear data em formato brasileiro DD/MM/YY', () => {
      const result = parseEventMessage('Reunião | 20/02/26 | important');
      
      expect(result).not.toBeNull();
      expect(result?.date).toBe('2026-02-20');
    });

    it('deve retornar null para título vazio', () => {
      const result = parseEventMessage(' | 2026-02-20 | important');
      
      expect(result).toBeNull();
    });

    it('deve extrair link do texto mesmo quando não está na posição correta', () => {
      const result = parseEventMessage('Reunião | 2026-02-20 | important | https://zoom.us/j/123');
      
      expect(result).not.toBeNull();
      expect(result?.link).toBe('https://zoom.us/j/123');
    });
  });

  describe('Formato simples (sem |)', () => {
    it('deve parsear apenas título e usar data de hoje', () => {
      const result = parseEventMessage('Reunião simples');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Reunião simples');
      expect(result?.date).toBe('2026-02-18'); // Data mockada
      expect(result?.type).toBe('simple');
    });

    it('deve detectar data relativa "hoje"', () => {
      const result = parseEventMessage('Reunião hoje');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Reunião');
      expect(result?.date).toBe('2026-02-18');
    });

    it('deve detectar data relativa "amanhã"', () => {
      const result = parseEventMessage('Reunião amanhã');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Reunião');
      expect(result?.date).toBe('2026-02-19'); // Amanhã
    });

    it('deve detectar data relativa "amanha" (sem acento)', () => {
      const result = parseEventMessage('Reunião amanha');
      
      expect(result).not.toBeNull();
      expect(result?.date).toBe('2026-02-19');
    });

    it('deve detectar data relativa "tomorrow"', () => {
      const result = parseEventMessage('Meeting tomorrow');
      
      expect(result).not.toBeNull();
      expect(result?.date).toBe('2026-02-19');
    });

    it('deve detectar data relativa "próxima semana"', () => {
      const result = parseEventMessage('Reunião próxima semana');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Reunião');
      // Próxima semana = hoje + 7 dias
      const expectedDate = new Date('2026-02-25');
      expect(result?.date).toBe(expectedDate.toISOString().split('T')[0]);
    });

    it('deve detectar tipo "important" por palavra-chave', () => {
      const result = parseEventMessage('Reunião importante amanhã');
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('important');
      expect(result?.title).toBe('Reunião');
    });

    it('deve detectar tipo "urgente" por palavra-chave', () => {
      const result = parseEventMessage('Reunião urgente');
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('important');
    });

    it('deve detectar tipo "medium" por palavra-chave', () => {
      const result = parseEventMessage('Reunião médio');
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('medium');
    });

    it('deve extrair link automaticamente do texto', () => {
      const result = parseEventMessage('Reunião amanhã https://meet.google.com/abc');
      
      expect(result).not.toBeNull();
      expect(result?.link).toBe('https://meet.google.com/abc');
      expect(result?.title).toBe('Reunião');
    });

    it('deve extrair link sem protocolo e adicionar https://', () => {
      const result = parseEventMessage('Reunião www.example.com');
      
      expect(result).not.toBeNull();
      expect(result?.link).toBe('https://www.example.com');
    });

    it('deve detectar data ISO no texto', () => {
      const result = parseEventMessage('Reunião 2026-02-20');
      
      expect(result).not.toBeNull();
      expect(result?.date).toBe('2026-02-20');
      expect(result?.title).toBe('Reunião');
    });

    it('deve detectar data brasileira no texto', () => {
      const result = parseEventMessage('Reunião 20/02/2026');
      
      expect(result).not.toBeNull();
      expect(result?.date).toBe('2026-02-20');
      expect(result?.title).toBe('Reunião');
    });

    it('deve limpar espaços extras do título', () => {
      const result = parseEventMessage('Reunião    importante    amanhã');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Reunião');
    });

    it('deve retornar "Evento sem título" quando título fica vazio após limpeza', () => {
      const result = parseEventMessage('importante');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Evento sem título');
      expect(result?.type).toBe('important');
    });
  });

  describe('Casos de borda e erros', () => {
    it('deve retornar null para string vazia', () => {
      const result = parseEventMessage('');
      
      expect(result).toBeNull();
    });

    it('deve retornar null para apenas espaços', () => {
      const result = parseEventMessage('   ');
      
      expect(result).toBeNull();
    });

    it('deve retornar null para string null', () => {
      const result = parseEventMessage(null as any);
      
      expect(result).toBeNull();
    });

    it('deve retornar null para string undefined', () => {
      const result = parseEventMessage(undefined as any);
      
      expect(result).toBeNull();
    });

    it('deve lidar com formato estruturado com muitos separadores', () => {
      const result = parseEventMessage('Título | Data | Tipo | Link | Extra');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Título');
      // "Link" não é uma URL válida, então deve ser undefined após sanitização
      expect(result?.link).toBeUndefined();
    });

    it('deve lidar com espaços extras no formato estruturado', () => {
      const result = parseEventMessage('  Reunião  |  2026-02-20  |  important  ');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Reunião');
      expect(result?.date).toBe('2026-02-20');
      expect(result?.type).toBe('important');
    });
  });

  describe('Parseamento de tipos', () => {
    it('deve reconhecer "important" em português', () => {
      const result = parseEventMessage('Evento | 2026-02-20 | importante');
      
      expect(result?.type).toBe('important');
    });

    it('deve reconhecer "important" em inglês', () => {
      const result = parseEventMessage('Evento | 2026-02-20 | important');
      
      expect(result?.type).toBe('important');
    });

    it('deve reconhecer "urgente"', () => {
      const result = parseEventMessage('Evento | 2026-02-20 | urgente');
      
      expect(result?.type).toBe('important');
    });

    it('deve reconhecer "medium" em português', () => {
      const result = parseEventMessage('Evento | 2026-02-20 | médio');
      
      expect(result?.type).toBe('medium');
    });

    it('deve reconhecer "medium" sem acento', () => {
      const result = parseEventMessage('Evento | 2026-02-20 | medio');
      
      expect(result?.type).toBe('medium');
    });

    it('deve reconhecer "simple" em português', () => {
      const result = parseEventMessage('Evento | 2026-02-20 | simples');
      
      expect(result?.type).toBe('simple');
    });

    it('deve usar simple como padrão para tipo desconhecido', () => {
      const result = parseEventMessage('Evento | 2026-02-20 | desconhecido');
      
      expect(result?.type).toBe('simple');
    });
  });

  describe('Extração de links', () => {
    it('deve extrair link HTTP', () => {
      const result = parseEventMessage('Reunião http://example.com');
      
      expect(result?.link).toBe('http://example.com');
    });

    it('deve extrair link HTTPS', () => {
      const result = parseEventMessage('Reunião https://example.com');
      
      expect(result?.link).toBe('https://example.com');
    });

    it('deve extrair link sem protocolo e adicionar https://', () => {
      const result = parseEventMessage('Reunião example.com');
      
      expect(result?.link).toBe('https://example.com');
    });

    it('deve extrair link com www', () => {
      const result = parseEventMessage('Reunião www.example.com');
      
      expect(result?.link).toBe('https://www.example.com');
    });

    it('deve extrair apenas o primeiro link quando há múltiplos', () => {
      const result = parseEventMessage('Reunião https://first.com e https://second.com');
      
      expect(result?.link).toBe('https://first.com');
    });
  });
});
