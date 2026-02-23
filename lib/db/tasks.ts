import { getNeon } from '@/lib/neon';
import { Task } from './types';

function rowToTask(row: Record<string, unknown>): Task {
  const dueDate = row.due_date;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    folder_id: String(row.folder_id),
    title: String(row.title),
    details: row.details != null ? String(row.details) : null,
    completed: Boolean(row.completed),
    completed_at: row.completed_at != null ? String(row.completed_at) : null,
    due_date: dueDate != null && dueDate !== '' ? String(dueDate).split('T')[0] : null,
    color: row.color != null ? String(row.color) : null,
    note_list_id: row.note_list_id != null ? String(row.note_list_id) : null,
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

export async function getTasksByNoteListId(noteListId: string, userId: string): Promise<Task[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM tasks
    WHERE note_list_id = ${noteListId} AND user_id = ${userId}
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
  due_date?: string | null;
  color?: string | null;
  note_list_id?: string | null;
}): Promise<Task | null> {
  const sql = getNeon();
  const dueDateVal = taskData.due_date && taskData.due_date.trim() ? taskData.due_date.trim().split('T')[0] : null;
  const rows = await sql`
    INSERT INTO tasks (user_id, folder_id, title, details, due_date, color, note_list_id)
    VALUES (
      ${taskData.user_id},
      ${taskData.folder_id},
      ${taskData.title.trim()},
      ${taskData.details?.trim() || null},
      ${dueDateVal},
      ${taskData.color || null},
      ${taskData.note_list_id || null}
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
    due_date: string | null;
    color: string | null;
    note_list_id: string | null;
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
  const due_date = updates.due_date !== undefined
    ? (updates.due_date && updates.due_date.trim() ? updates.due_date.trim().split('T')[0] : null)
    : existing.due_date;
  const color = updates.color !== undefined 
    ? (updates.color && updates.color.trim() ? updates.color.trim() : null)
    : existing.color;
  const note_list_id = updates.note_list_id !== undefined 
    ? (updates.note_list_id && typeof updates.note_list_id === 'string' && updates.note_list_id.trim() ? updates.note_list_id.trim() : null)
    : existing.note_list_id;

  const sql = getNeon();
  const rows = await sql`
    UPDATE tasks
    SET title = ${title.trim()}, 
        details = ${details?.trim() || null},
        completed = ${completed},
        completed_at = ${completed_at},
        due_date = ${due_date},
        color = ${color},
        note_list_id = ${note_list_id}
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

/** Tarefas com due_date em uma data específica (YYYY-MM-DD), não concluídas */
export async function getTasksDueOn(userId: string, dateYyyyMmDd: string): Promise<Task[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM tasks
    WHERE user_id = ${userId}
      AND due_date = ${dateYyyyMmDd}
      AND completed = false
    ORDER BY title
  `;
  return (rows as Record<string, unknown>[]).map(rowToTask);
}

/** Conta tarefas concluídas na semana atual (segunda a domingo, timezone America/Sao_Paulo) */
export async function getCompletedTasksCountThisWeek(userId: string): Promise<number> {
  const sql = getNeon();
  const rows = await sql`
    SELECT COUNT(*) as count
    FROM tasks
    WHERE user_id = ${userId}
      AND completed = true
      AND completed_at IS NOT NULL
      AND completed_at >= date_trunc('week', NOW() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? Number(row.count) : 0;
}

/** Retorna datas distintas (YYYY-MM-DD) em que o usuário concluiu pelo menos uma tarefa (para medalhas). */
export async function getDistinctCompletedTaskDates(userId: string): Promise<string[]> {
  const sql = getNeon();
  const rows = await sql`
    SELECT DISTINCT to_char(completed_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as d
    FROM tasks
    WHERE user_id = ${userId}
      AND completed = true
      AND completed_at IS NOT NULL
    ORDER BY d
  `;
  return (rows as Record<string, unknown>[]).map((r) => String(r.d));
}

/** Total de tarefas já concluídas pelo usuário (para missões). */
export async function getCompletedTasksCountTotal(userId: string): Promise<number> {
  const sql = getNeon();
  const rows = await sql`
    SELECT COUNT(*) as count FROM tasks WHERE user_id = ${userId} AND completed = true AND completed_at IS NOT NULL
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? Number(row.count) : 0;
}

/** Pendentes por folder_id para um usuário: Map<folderId, count> */
export async function getPendingCountByFolder(userId: string): Promise<Map<string, number>> {
  const sql = getNeon();
  const rows = await sql`
    SELECT folder_id, COUNT(*) as count
    FROM tasks
    WHERE user_id = ${userId} AND completed = false
    GROUP BY folder_id
  `;
  const map = new Map<string, number>();
  for (const row of rows as Record<string, unknown>[]) {
    map.set(String(row.folder_id), Number(row.count));
  }
  return map;
}

/** Pendentes agrupadas por pasta, com título de cada tarefa (para notificações). */
export async function getPendingTasksGroupedByFolder(userId: string): Promise<Map<string, Task[]>> {
  const sql = getNeon();
  const rows = await sql`
    SELECT * FROM tasks
    WHERE user_id = ${userId} AND completed = false
    ORDER BY folder_id, title
  `;
  const tasks = (rows as Record<string, unknown>[]).map(rowToTask);
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const list = map.get(t.folder_id) ?? [];
    list.push(t);
    map.set(t.folder_id, list);
  }
  return map;
}

/** Conta tarefas concluídas em pastas de um dado tipo (trabalho, estudos, lazer, tarefas_pessoais). */
export async function getCompletedTasksCountByFolderType(
  userId: string,
  folderType: string
): Promise<number> {
  const sql = getNeon();
  const rows = await sql`
    SELECT COUNT(*) as count
    FROM tasks t
    INNER JOIN folders f ON f.id = t.folder_id AND f.user_id = t.user_id
    WHERE t.user_id = ${userId} AND t.completed = true AND t.completed_at IS NOT NULL
      AND f.folder_type = ${folderType}
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? Number(row.count) : 0;
}

/** Número de pastas distintas em que o usuário já concluiu pelo menos uma tarefa. */
export async function getDistinctFoldersWithCompletedTasksCount(userId: string): Promise<number> {
  const sql = getNeon();
  const rows = await sql`
    SELECT COUNT(DISTINCT folder_id) as count
    FROM tasks
    WHERE user_id = ${userId} AND completed = true AND completed_at IS NOT NULL
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? Number(row.count) : 0;
}

/** Máximo de tarefas concluídas em um único dia (para missões “maratona”). */
export async function getMaxCompletedTasksInOneDay(userId: string): Promise<number> {
  const sql = getNeon();
  const rows = await sql`
    SELECT to_char(completed_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as d, COUNT(*) as c
    FROM tasks
    WHERE user_id = ${userId} AND completed = true AND completed_at IS NOT NULL
    GROUP BY 1
    ORDER BY c DESC
    LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? Number(row.c) : 0;
}
