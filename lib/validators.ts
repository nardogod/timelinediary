/**
 * Módulo de validações para eventos do Timeline Agenda
 * 
 * Fornece funções para validar dados de eventos antes de criar/atualizar
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida um título de evento
 */
export function validateTitle(title: string): ValidationResult {
  const errors: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push('Título não pode estar vazio');
  } else {
    const trimmed = title.trim();
    
    if (trimmed.length < 2) {
      errors.push('Título deve ter pelo menos 2 caracteres');
    }
    
    if (trimmed.length > 200) {
      errors.push('Título não pode ter mais de 200 caracteres');
    }
    
    // Verifica caracteres inválidos
    if (/[<>{}]/.test(trimmed)) {
      errors.push('Título contém caracteres inválidos');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida uma data no formato ISO (YYYY-MM-DD)
 */
export function validateDate(dateStr: string, options?: {
  allowPast?: boolean;
  maxDaysInFuture?: number;
}): ValidationResult {
  const errors: string[] = [];
  const { allowPast = true, maxDaysInFuture = 365 } = options || {};

  if (!dateStr || dateStr.trim().length === 0) {
    errors.push('Data não pode estar vazia');
    return { isValid: false, errors };
  }

  // Valida formato ISO
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    errors.push('Data deve estar no formato YYYY-MM-DD');
    return { isValid: false, errors };
  }

  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    errors.push('Data inválida');
    return { isValid: false, errors };
  }

  // Verifica se a data é válida (evita datas como 2026-02-31)
  const [year, month, day] = dateStr.split('-').map(Number);
  const actualDate = new Date(year, month - 1, day);
  if (
    actualDate.getFullYear() !== year ||
    actualDate.getMonth() !== month - 1 ||
    actualDate.getDate() !== day
  ) {
    errors.push('Data inválida (ex: 31/02 não existe)');
    return { isValid: false, errors };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);

  // Validação de data passada
  if (!allowPast && eventDate < today) {
    errors.push('Data não pode ser no passado');
  }

  // Validação de data muito futura
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDaysInFuture);
  if (eventDate > maxDate) {
    errors.push(`Data não pode ser mais de ${maxDaysInFuture} dias no futuro`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida um tipo de evento
 */
export function validateEventType(type: string): ValidationResult {
  const errors: string[] = [];

  const validTypes = ['simple', 'medium', 'important'];
  
  if (!validTypes.includes(type)) {
    errors.push(`Tipo deve ser um dos: ${validTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida uma URL/link
 */
export function validateLink(link: string | undefined): ValidationResult {
  const errors: string[] = [];

  if (!link) {
    // Link é opcional, então está válido se não fornecido
    return { isValid: true, errors: [] };
  }

  if (typeof link !== 'string' || link.trim().length === 0) {
    errors.push('Link deve ser uma string válida');
    return { isValid: false, errors };
  }

  // Padrão básico de URL
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
  
  if (!urlPattern.test(link)) {
    errors.push('Link deve ser uma URL válida');
  }

  // Verifica tamanho máximo
  if (link.length > 500) {
    errors.push('Link não pode ter mais de 500 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida um evento completo
 */
export function validateEvent(event: {
  title: string;
  date: string;
  type: string;
  link?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Valida título
  const titleValidation = validateTitle(event.title);
  if (!titleValidation.isValid) {
    errors.push(...titleValidation.errors);
  }

  // Valida data
  const dateValidation = validateDate(event.date);
  if (!dateValidation.isValid) {
    errors.push(...dateValidation.errors);
  }

  // Valida tipo
  const typeValidation = validateEventType(event.type);
  if (!typeValidation.isValid) {
    errors.push(...typeValidation.errors);
  }

  // Valida link
  const linkValidation = validateLink(event.link);
  if (!linkValidation.isValid) {
    errors.push(...linkValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitiza um título removendo caracteres perigosos
 */
export function sanitizeTitle(title: string): string {
  return title
    .trim()
    .replace(/<[^>]*>/g, '') // Remove tags HTML completas
    .replace(/[<>{}]/g, '') // Remove caracteres perigosos restantes
    .replace(/\s+/g, ' ') // Normaliza espaços
    .substring(0, 200); // Limita tamanho
}

/**
 * Sanitiza uma URL garantindo que tenha protocolo
 */
export function sanitizeLink(link: string | undefined): string | undefined {
  if (!link) return undefined;

  const trimmed = link.trim();
  if (trimmed.length === 0) return undefined;

  // Se já tem protocolo, apenas limita tamanho
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.substring(0, 500);
  }

  // Valida se parece uma URL antes de adicionar protocolo
  // Padrão básico: deve ter pelo menos um ponto e domínio válido
  const urlPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/;
  if (urlPattern.test(trimmed) || trimmed.startsWith('www.')) {
    return `https://${trimmed}`.substring(0, 500);
  }

  // Se não parece uma URL válida, retorna undefined
  return undefined;
}
