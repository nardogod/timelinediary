import { sendTelegramToUser } from '@/lib/telegram-send';
import { getPendingCountByFolder, getTasksDueOn, getCompletedTasksCountThisWeek } from '@/lib/db/tasks';
import { getFoldersByUserId } from '@/lib/db/folders';

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

/** Envia resumo de pendentes por pasta. Uma mensagem por usuário se houver pendentes. */
export async function sendPendingPerFolder(userId: string): Promise<boolean> {
  const pendingByFolder = await getPendingCountByFolder(userId);
  if (pendingByFolder.size === 0) return false;

  const folders = await getFoldersByUserId(userId);
  const folderNames = new Map(folders.map(f => [f.id, f.name]));
  const lines: string[] = [];
  for (const [folderId, count] of pendingByFolder) {
    const name = folderNames.get(folderId) || 'Pasta';
    lines.push(`Você tem ${count} tarefa${count !== 1 ? 's' : ''} pendente${count !== 1 ? 's' : ''} em '${name}'.`);
  }
  if (lines.length === 0) return false;
  const text = lines.join('\n');
  return sendTelegramToUser(userId, text);
}

/** Envia lembretes de tarefas que vencem amanhã. */
export async function sendDueTomorrow(userId: string): Promise<boolean> {
  const tomorrow = getTomorrowYyyyMmDd();
  const tasks = await getTasksDueOn(userId, tomorrow);
  if (tasks.length === 0) return false;
  const lines = tasks.map(t => `Lembrete: '${t.title}' vence amanhã`);
  const text = lines.join('\n');
  return sendTelegramToUser(userId, text);
}

/** Envia parabéns por tarefas concluídas esta semana. Só envia aos domingos (evita repetir todo dia). */
export async function sendWeeklyCongrats(userId: string): Promise<boolean> {
  const now = new Date();
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'short' }).format(now);
  if (dayOfWeek !== 'Sun') return false;
  const count = await getCompletedTasksCountThisWeek(userId);
  if (count <= 0) return false;
  const text = `Parabéns! Você concluiu ${count} tarefa${count !== 1 ? 's' : ''} esta semana 🎉`;
  return sendTelegramToUser(userId, text);
}

export interface TaskNotificationResult {
  userId: string;
  pending: boolean;
  dueTomorrow: boolean;
  weeklyCongrats: boolean;
}

/** Executa as três notificações para um usuário. */
export async function runTaskNotificationsForUser(userId: string): Promise<TaskNotificationResult> {
  const [pending, dueTomorrow, weeklyCongrats] = await Promise.all([
    sendPendingPerFolder(userId),
    sendDueTomorrow(userId),
    sendWeeklyCongrats(userId),
  ]);
  return { userId, pending, dueTomorrow, weeklyCongrats };
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
