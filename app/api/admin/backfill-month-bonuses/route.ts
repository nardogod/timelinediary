import { NextRequest, NextResponse } from 'next/server';
import { getEventsBetween } from '@/lib/db/events';
import { createTask, updateTask } from '@/lib/db/tasks';
import { getFolderById } from '@/lib/db/folders';
import { recordTaskCompletedForGame } from '@/lib/db/game';
import { evaluateAndGrantMissions } from '@/lib/db/missions';
import { getNeon } from '@/lib/neon';

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function firstDayOfCurrentMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { admin_secret, from, to } = body || {};

    const expected = process.env.ADMIN_RESET_SECRET;
    if (!expected || admin_secret !== expected) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const today = todayLocal();
    const rangeStart = typeof from === 'string' && from.length === 10 ? from : firstDayOfCurrentMonth();
    const rangeEndRaw = typeof to === 'string' && to.length === 10 ? to : today;
    const rangeEnd = rangeEndRaw > today ? today : rangeEndRaw;

    const sql = getNeon();
    const usersRows = await sql`SELECT id FROM users`;
    const userIds = (usersRows as { id: string }[]).map((u) => String(u.id));

    let processedEvents = 0;
    let creditedEvents = 0;

    for (const userId of userIds) {
      const events = await getEventsBetween(userId, rangeStart, rangeEnd);
      for (const ev of events) {
        if (!ev.folder_id) continue;
        if (ev.date > today) continue;
        if (ev.task_id) continue; // já teve tarefa vinculada, então já foi processado
        processedEvents += 1;

        const titleWithoutTime = ev.title.replace(/ - \d{2}:\d{2}$/, '').trim() || ev.title;
        const task = await createTask({
          user_id: userId,
          folder_id: ev.folder_id,
          title: titleWithoutTime,
        });
        if (!task) continue;

        await updateTask(task.id, { completed: true });

        // Vincula task ao evento
        await sql`UPDATE events SET task_id = ${task.id} WHERE id = ${ev.id}`;

        const folder = await getFolderById(ev.folder_id);
        const timeStr = ev.title.match(/ - (\d{2}:\d{2})$/)?.[1] ?? null;
        try {
          const result = await recordTaskCompletedForGame(userId, task.id, {
            scheduled_date: ev.date,
            scheduled_time: timeStr,
            folder_type: folder?.folder_type ?? undefined,
            event_importance: ev.type,
          });
          if (result.ok) {
            creditedEvents += 1;
            await evaluateAndGrantMissions(userId);
          }
        } catch (e) {
          console.error('[admin/backfill-month-bonuses] recordTaskCompletedForGame', e);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      from: rangeStart,
      to: rangeEnd,
      processedEvents,
      creditedEvents,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[admin/backfill-month-bonuses]', err.message);
    return NextResponse.json({ error: 'Erro ao aplicar bônus retroativos' }, { status: 500 });
  }
}

