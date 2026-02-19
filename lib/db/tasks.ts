import { getNeon } from '@/lib/neon';
import { Task } from './types';

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    folder_id: String(row.folder_id),
    title: String(row.title),
    details: row.details != null ? String(row.details) : null,
    completed: Boolean(row.completed),
    completed_at: row.completed_at != null ? String(row.completed_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getTasksByFolderId(folderId: string, userId: string): Promise<Task[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM tasks
    WHERE folder_id = ${folderId} AND user_id = ${userId}
    ORDER BY created_at ASC
  `;
  return (rows as Record<string, unknown>[]).map(rowToTask);
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const sql = getNeon();
  const rows = await sql`SELECT * FROM tasks WHERE id = ${taskId} LIMIT 1`;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToTask(row) : null;
}

export async function createTask(taskData: {
  user_id: string;
  folder_id: string;
  title: string;
  details?: string | null;
}): Promise<Task | null> {
  const sql = getNeon();
  const rows = await sql`
    INSERT INTO tasks (user_id, folder_id, title, details)
    VALUES (
      ${taskData.user_id},
      ${taskData.folder_id},
      ${taskData.title.trim()},
      ${taskData.details?.trim() || null}
    )
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToTask(row) : null;
}

export async function updateTask(
  taskId: string,
  updates: Partial<{
    title: string;
    details: string | null;
    completed: boolean;
  }>
): Promise<Task | null> {
  const existing = await getTaskById(taskId);
  if (!existing) return null;

  const title = updates.title ?? existing.title;
  const details = updates.details !== undefined ? updates.details : existing.details;
  const completed = updates.completed !== undefined ? updates.completed : existing.completed;
  const completed_at = updates.completed === true && !existing.completed_at
    ? new Date().toISOString()
    : updates.completed === false
    ? null
    : existing.completed_at;

  const sql = getNeon();
  const rows = await sql`
    UPDATE tasks
    SET title = ${title.trim()}, 
        details = ${details?.trim() || null},
        completed = ${completed},
        completed_at = ${completed_at}
    WHERE id = ${taskId}
    RETURNING *
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToTask(row) : null;
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const sql = getNeon();
  const rows = await sql`DELETE FROM tasks WHERE id = ${taskId} RETURNING id`;
  return (rows as unknown[]).length > 0;
}

/** Conta tarefas concluídas por pasta para um usuário (apenas as que têm eventos na timeline) */
export async function getCompletedTasksCountByFolder(userId: string): Promise<Map<string, number>> {
  const sql = getNeon();
  // Conta apenas tarefas concluídas que têm eventos na timeline (com task_id)
  const rows = await sql`
    SELECT t.folder_id, COUNT(DISTINCT t.id) as count
    FROM tasks t
    INNER JOIN events e ON e.task_id = t.id
    WHERE t.user_id = ${userId} AND t.completed = true
    GROUP BY t.folder_id
  `;
  const counts = new Map<string, number>();
  for (const row of rows as Record<string, unknown>[]) {
    counts.set(String(row.folder_id), Number(row.count));
  }
  return counts;
}

/** Conta total de tarefas concluídas para um usuário (apenas as que têm eventos na timeline) */
export async function getTotalCompletedTasksCount(userId: string): Promise<number> {
  const sql = getNeon();
  // Conta apenas tarefas concluídas que têm eventos na timeline (com task_id)
  const rows = await sql`
    SELECT COUNT(DISTINCT t.id) as count
    FROM tasks t
    INNER JOIN events e ON e.task_id = t.id
    WHERE t.user_id = ${userId} AND t.completed = true
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? Number(row.count) : 0;
}

/** Conta tarefas concluídas por mês/ano para um usuário (baseado na data do evento criado) */
export async function getCompletedTasksCountByMonth(userId: string, year: number, month: number): Promise<number> {
  const sql = getNeon();
  // Busca eventos de tarefas concluídas no mês específico
  // Os eventos são criados quando a tarefa é concluída, então usamos a data do evento
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const nextMonth = month === 11 ? 1 : month + 2;
  const nextYear = month === 11 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  
  const rows = await sql`
    SELECT COUNT(DISTINCT e.task_id) as count
    FROM events e
    WHERE e.user_id = ${userId} 
      AND e.task_id IS NOT NULL
      AND e.date >= ${startDate}
      AND e.date < ${endDate}
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? Number(row.count) : 0;
}
