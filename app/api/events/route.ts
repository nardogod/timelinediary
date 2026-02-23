import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { createEvent, getEventsByUserId, createMultipleEvents, updateEvent, getEventById } from '@/lib/db/events';
import { createTask, updateTask } from '@/lib/db/tasks';
import { getFolderById } from '@/lib/db/folders';
import { recordTaskCompletedForGame } from '@/lib/db/game';
import { evaluateAndGrantMissions } from '@/lib/db/missions';
import { generateRecurringDates, DayOfWeek } from '@/lib/recurringEvents';

/** Retorna YYYY-MM-DD em timezone local. */
function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Para evento com pasta e data vigente/passada: cria tarefa, marca concluída, vincula e aplica recompensa Meu Mundo. Retorna payload de jogo (levelUp, xpEarned, etc.) se houver. */
async function applyRewardIfPastOrToday(
  userId: string,
  event: { id: string; title: string; date: string; type: string; folder_id: string | null }
): Promise<{ levelUp?: boolean; newLevel?: number; previousLevel?: number; xpEarned?: number; died?: boolean } | undefined> {
  if (!event.folder_id) return undefined;
  const today = todayLocal();
  if (event.date > today) return undefined;

  const titleWithoutTime = event.title.replace(/ - \d{2}:\d{2}$/, '').trim() || event.title;
  const task = await createTask({
    user_id: userId,
    folder_id: event.folder_id,
    title: titleWithoutTime,
  });
  if (!task) return undefined;

  await updateTask(task.id, { completed: true });
  await updateEvent(event.id, { task_id: task.id });

  const folder = await getFolderById(event.folder_id);
  const timeStr = event.title.match(/ - (\d{2}:\d{2})$/)?.[1] ?? null;
  try {
    const result = await recordTaskCompletedForGame(userId, task.id, {
      scheduled_date: event.date,
      scheduled_time: timeStr,
      folder_type: folder?.folder_type ?? undefined,
      event_importance: event.type,
    });
    if (result.ok) {
      await evaluateAndGrantMissions(userId);
      if (result.levelUp || result.xpEarned != null || result.died) {
        return {
          levelUp: result.levelUp,
          newLevel: result.newLevel,
          previousLevel: result.previousLevel,
          xpEarned: result.xpEarned,
          died: result.died,
        };
      }
    }
  } catch (e) {
    console.error('[events POST] recordTaskCompletedForGame', e);
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const events = await getEventsByUserId(userId);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      date, 
      end_date, 
      type, 
      link, 
      folder_id,
      // Campos para eventos recorrentes
      is_recurring,
      recurring_year,
      recurring_month,
      recurring_days_of_week
    } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: 'title and type are required' },
        { status: 400 }
      );
    }

    // Se é evento recorrente
    if (is_recurring && recurring_year && recurring_month && Array.isArray(recurring_days_of_week) && recurring_days_of_week.length > 0) {
      const dates = generateRecurringDates(
        recurring_year,
        recurring_month,
        recurring_days_of_week as DayOfWeek[]
      );

      if (dates.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma data encontrada para os dias da semana especificados' },
          { status: 400 }
        );
      }

      // Validação básica de URL
      let finalLink = link?.trim() || null;
      if (finalLink && !finalLink.match(/^https?:\/\//i)) {
        finalLink = `https://${finalLink}`;
      }

      const eventsData = dates.map(dateStr => ({
        user_id: userId,
        title: title.trim(),
        date: dateStr,
        end_date: null,
        type,
        link: finalLink,
        folder_id: folder_id ?? null,
        task_id: null,
      }));

      const createdEvents = await createMultipleEvents(eventsData);

      return NextResponse.json({
        events: createdEvents,
        count: createdEvents.length,
        message: `${createdEvents.length} eventos criados com sucesso`
      });
    }

    // Evento único (lógica existente)
    if (!date) {
      return NextResponse.json(
        { error: 'date is required for non-recurring events' },
        { status: 400 }
      );
    }

    const dateOnly = typeof date === 'string' ? date.trim().split('T')[0] : String(date).split('T')[0];
    const endDateOnly = end_date != null && end_date !== '' ? String(end_date).trim().split('T')[0] : null;

    const event = await createEvent({
      user_id: userId,
      title,
      date: dateOnly,
      end_date: endDateOnly,
      type,
      link: link ?? null,
      folder_id: folder_id ?? null,
    });

    if (!event) {
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // Data vigente ou passada: já considerar concluído e aplicar recompensa (XP, moedas, etc.)
    const gamePayload = await applyRewardIfPastOrToday(userId, event);
    const finalEvent = await getEventById(event.id);
    const response: Record<string, unknown> = { ...(finalEvent ?? event) };
    if (gamePayload) response.game = gamePayload;
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
