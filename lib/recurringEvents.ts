/**
 * Utilitários para criar eventos recorrentes
 * Exemplo: Curso que acontece toda segunda e quarta-feira durante o mês
 */

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

export interface RecurringEventConfig {
  title: string;
  year: number;
  month: number; // 1-12
  daysOfWeek: DayOfWeek[]; // Ex: [1, 3] = Segunda e Quarta
  type: 'simple' | 'medium' | 'important';
  link?: string | null;
  folder_id?: string | null;
}

/**
 * Gera todas as datas de um mês que correspondem aos dias da semana especificados
 * @param year Ano (ex: 2026)
 * @param month Mês (1-12)
 * @param daysOfWeek Array de dias da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
 * @returns Array de datas no formato YYYY-MM-DD
 */
export function generateRecurringDates(
  year: number,
  month: number,
  daysOfWeek: DayOfWeek[]
): string[] {
  if (daysOfWeek.length === 0) return [];

  const dates: string[] = [];
  // Cria data do primeiro dia do mês
  const firstDay = new Date(year, month - 1, 1);
  // Último dia do mês
  const lastDay = new Date(year, month, 0);

  // Itera por todos os dias do mês
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const currentDate = new Date(year, month - 1, day);
    const dayOfWeek = currentDate.getDay() as DayOfWeek;
    
    // Se o dia da semana está na lista, adiciona a data
    if (daysOfWeek.includes(dayOfWeek)) {
      const yearStr = currentDate.getFullYear();
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(currentDate.getDate()).padStart(2, '0');
      dates.push(`${yearStr}-${monthStr}-${dayStr}`);
    }
  }

  return dates;
}

/**
 * Converte nome do dia da semana para número
 */
export function dayNameToNumber(dayName: string): DayOfWeek | null {
  const normalized = dayName.toLowerCase().trim();
  const mapping: Record<string, DayOfWeek> = {
    'domingo': 0,
    'dom': 0,
    'sunday': 0,
    'sun': 0,
    'segunda': 1,
    'segunda-feira': 1,
    'seg': 1,
    'monday': 1,
    'mon': 1,
    'terça': 2,
    'terça-feira': 2,
    'ter': 2,
    'tuesday': 2,
    'tue': 2,
    'quarta': 3,
    'quarta-feira': 3,
    'qua': 3,
    'wednesday': 2,
    'wed': 3,
    'quinta': 4,
    'quinta-feira': 4,
    'qui': 4,
    'thursday': 4,
    'thu': 4,
    'sexta': 5,
    'sexta-feira': 5,
    'sex': 5,
    'friday': 5,
    'fri': 5,
    'sábado': 6,
    'sabado': 6,
    'sab': 6,
    'saturday': 6,
    'sat': 6,
  };
  return mapping[normalized] ?? null;
}

/**
 * Converte número do dia da semana para nome
 */
export function dayNumberToName(dayNumber: DayOfWeek): string {
  const names = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return names[dayNumber];
}

/**
 * Converte array de números para nomes de dias
 */
export function daysToNames(days: DayOfWeek[]): string[] {
  return days.map(dayNumberToName);
}
