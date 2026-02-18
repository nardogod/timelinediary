import { describe, it, expect } from 'vitest';
import {
  validateTitle,
  validateDate,
  validateEventType,
  validateLink,
  validateEvent,
  sanitizeTitle,
  sanitizeLink,
} from '../validators';

describe('validators', () => {
  describe('validateTitle', () => {
    it('deve aceitar título válido', () => {
      const result = validateTitle('Reunião importante');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar título vazio', () => {
      const result = validateTitle('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Título não pode estar vazio');
    });

    it('deve rejeitar título muito curto', () => {
      const result = validateTitle('A');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Título deve ter pelo menos 2 caracteres');
    });

    it('deve rejeitar título muito longo', () => {
      const longTitle = 'A'.repeat(201);
      const result = validateTitle(longTitle);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Título não pode ter mais de 200 caracteres');
    });

    it('deve rejeitar título com caracteres perigosos', () => {
      const result = validateTitle('Reunião <script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Título contém caracteres inválidos');
    });
  });

  describe('validateDate', () => {
    it('deve aceitar data válida', () => {
      const result = validateDate('2026-02-20');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar data vazia', () => {
      const result = validateDate('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data não pode estar vazia');
    });

    it('deve rejeitar formato inválido', () => {
      const result = validateDate('20/02/2026');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data deve estar no formato YYYY-MM-DD');
    });

    it('deve rejeitar data inválida (31/02)', () => {
      const result = validateDate('2026-02-31');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data inválida (ex: 31/02 não existe)');
    });

    it('deve rejeitar data no passado quando allowPast=false', () => {
      const pastDate = '2020-01-01';
      const result = validateDate(pastDate, { allowPast: false });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data não pode ser no passado');
    });

    it('deve rejeitar data muito futura', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 400);
      const result = validateDate(futureDate.toISOString().split('T')[0], { maxDaysInFuture: 365 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data não pode ser mais de 365 dias no futuro');
    });
  });

  describe('validateEventType', () => {
    it('deve aceitar tipo válido', () => {
      expect(validateEventType('simple').isValid).toBe(true);
      expect(validateEventType('medium').isValid).toBe(true);
      expect(validateEventType('important').isValid).toBe(true);
    });

    it('deve rejeitar tipo inválido', () => {
      const result = validateEventType('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateLink', () => {
    it('deve aceitar link válido', () => {
      const result = validateLink('https://example.com');
      expect(result.isValid).toBe(true);
    });

    it('deve aceitar link undefined (opcional)', () => {
      const result = validateLink(undefined);
      expect(result.isValid).toBe(true);
    });

    it('deve rejeitar link inválido', () => {
      const result = validateLink('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Link deve ser uma URL válida');
    });

    it('deve rejeitar link muito longo', () => {
      const longLink = 'https://example.com/' + 'a'.repeat(500);
      const result = validateLink(longLink);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Link não pode ter mais de 500 caracteres');
    });
  });

  describe('validateEvent', () => {
    it('deve aceitar evento válido completo', () => {
      const event = {
        title: 'Reunião importante',
        date: '2026-02-20',
        type: 'important',
        link: 'https://meet.google.com/abc',
      };
      const result = validateEvent(event);
      expect(result.isValid).toBe(true);
    });

    it('deve rejeitar evento com múltiplos erros', () => {
      const event = {
        title: '',
        date: 'invalid',
        type: 'invalid',
        link: 'not-a-url',
      };
      const result = validateEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('sanitizeTitle', () => {
    it('deve remover caracteres perigosos', () => {
      const result = sanitizeTitle('Reunião <script>alert()</script>');
      expect(result).toBe('Reunião alert()');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('deve normalizar espaços', () => {
      const result = sanitizeTitle('Reunião    importante');
      expect(result).toBe('Reunião importante');
    });

    it('deve limitar tamanho', () => {
      const longTitle = 'A'.repeat(250);
      const result = sanitizeTitle(longTitle);
      expect(result.length).toBe(200);
    });
  });

  describe('sanitizeLink', () => {
    it('deve adicionar https:// se não tiver protocolo', () => {
      const result = sanitizeLink('example.com');
      expect(result).toBe('https://example.com');
    });

    it('deve manter https:// se já tiver', () => {
      const result = sanitizeLink('https://example.com');
      expect(result).toBe('https://example.com');
    });

    it('deve retornar undefined para link vazio', () => {
      expect(sanitizeLink('')).toBeUndefined();
      expect(sanitizeLink(undefined)).toBeUndefined();
    });

    it('deve limitar tamanho', () => {
      const longLink = 'https://example.com/' + 'a'.repeat(600);
      const result = sanitizeLink(longLink);
      expect(result?.length).toBe(500);
    });
  });
});
