import { sendTelegramToUser } from '@/lib/telegram-send';
import {
  getPendingTasksGroupedByFolder,
  getTasksDueOn,
  getCompletedTasksCountThisWeek,
} from '@/lib/db/tasks';
import { getFoldersByUserId } from '@/lib/db/folders';
import { getEventsBetween } from '@/lib/db/events';

const TIMEZONE = 'America/Sao_Paulo';

function getTomorrowYyyyMmDd(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(new Date());
  const [y, m, d] = todayStr.split('-').map(Number);
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
  return formatter.format(tomorrow);
}

/** Domingo da semana atual (America/Sao_Paulo). */
function getEndOfWeekYyyyMmDd(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const now = new Date();
  const todayStr = formatter.format(now);
  const [y, m, d] = todayStr.split('-').map(Number);
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'short' }).format(now);
  const daysToSunday: Record<string, number> = { Sun: 0, Mon: 6, Tue: 5, Wed: 4, Thu: 3, Fri: 2, Sat: 1 };
  const add = daysToSunday[dayOfWeek] ?? 0;
  const sunday = new Date(Date.UTC(y, m - 1, d + add));
  return formatter.format(sunday);
}

/** Formata YYYY-MM-DD para dd/MM (ex.: 2026-02-21 → 21/02). */
function formatDayShort(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-');
  return `${d}/${m}`;
}

/**
 * Envia um único resumo diário: tarefas pendentes (com títulos por pasta), tarefas que vencem amanhã (com títulos)
 * e eventos da timeline que acontecem amanhã ou ainda esta semana.
 */
export async function sendDailySummary(userId: string): Promise<boolean> {
  const [pendingByFolder, dueTomorrowTasks, folders, events] = await Promise.all([
    getPendingTasksGroupedByFolder(userId),
    getTasksDueOn(userId, getTomorrowYyyyMmDd()),
    getFoldersByUserId(userId),
    getEventsBetween(userId, getTomorrowYyyyMmDd(), getEndOfWeekYyyyMmDd()),
  ]);

  const folderNames = new Map(folders.map(f => [f.id, f.name]));
  const parts: string[] = [];

  if (pendingByFolder.size > 0) {
    const lines: string[] = [];
    for (const [folderId, tasks] of pendingByFolder) {
      const name = folderNames.get(folderId) || 'Pasta';
      const titles = tasks.map(t => t.title.trim() || 'Sem título');
      lines.push(`Em '${name}':`);
      titles.forEach(title => lines.push(`  • ${title}`));
    }
    parts.push(`📋 Pendentes:\n${lines.join('\n')}`);
  }

  if (dueTomorrowTasks.length > 0) {
    const lines = dueTomorrowTasks.map(t => `  • ${(t.title || 'Sem título').trim()} vence amanhã`);
    parts.push(`⏰ Amanhã vence:\n${lines.join('\n')}`);
  }

  if (events.length > 0) {
    const lines = events.map(e => `  • ${(e.title || 'Sem título').trim()} (${formatDayShort(e.date)})`);
    parts.push(`📅 Amanhã e esta semana na timeline:\n${lines.join('\n')}`);
  }

  if (parts.length === 0) return false;
  const text = parts.join('\n\n');
  return sendTelegramToUser(userId, text);
}

/** Envia resumo de pendentes por pasta (com títulos). Encaminha para sendDailySummary. */
export async function sendPendingPerFolder(userId: string): Promise<boolean> {
  return sendDailySummary(userId);
}

/** Envia lembretes de tarefas que vencem amanhã. Encaminha para sendDailySummary (evita duplicar mensagem). */
export async function sendDueTomorrow(userId: string): Promise<boolean> {
  return sendDailySummary(userId);
}

/** Envia parabéns por tarefas concluídas esta semana. Só envia aos domingos (evita repetir todo dia). */
export async function sendWeeklyCongrats(userId: string): Promise<boolean> {
  const now = new Date();
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'short' }).format(now);
  if (dayOfWeek !== 'Sun') return false;
  const count = await getCompletedTasksCountThisWeek(userId);
  if (count <= 0) return false;
  const text = `🎉 Parabéns! Você concluiu ${count} tarefa${count !== 1 ? 's' : ''} esta semana.`;
  return sendTelegramToUser(userId, text);
}

export interface TaskNotificationResult {
  userId: string;
  pending: boolean;
  dueTomorrow: boolean;
  weeklyCongrats: boolean;
}

/** Executa as notificações para um usuário: resumo diário (pendentes + vence amanhã + eventos) e parabéns semanal (domingos). */
export async function runTaskNotificationsForUser(userId: string): Promise<TaskNotificationResult> {
  const [dailySent, weeklyCongrats] = await Promise.all([
    sendDailySummary(userId),
    sendWeeklyCongrats(userId),
  ]);
  return {
    userId,
    pending: dailySent,
    dueTomorrow: dailySent,
    weeklyCongrats,
  };
}

export interface RunAllResult {
  sent: number;
  skipped: number;
  results: TaskNotificationResult[];
}

/** Executa notificações para todos os usuários com Telegram vinculado. */
export async function runAllTaskNotifications(
  linkedUserIds: string[]
): Promise<RunAllResult> {
  const results: TaskNotificationResult[] = [];
  for (const userId of linkedUserIds) {
    const r = await runTaskNotificationsForUser(userId);
    results.push(r);
  }
  const sent = results.filter(
    r => r.pending || r.dueTomorrow || r.weeklyCongrats
  ).length;
  const skipped = results.length - sent;
  return { sent, skipped, results };
}
