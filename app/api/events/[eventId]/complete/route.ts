import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getEventById, updateEvent } from '@/lib/db/events';
import { getFolderById } from '@/lib/db/folders';
import { getTaskById, createTask, updateTask } from '@/lib/db/tasks';
import { recordTaskCompletedForGame } from '@/lib/db/game';

/**
 * Marca o evento como concluído: cria ou usa a tarefa vinculada, marca como concluída e aplica recompensas (XP, moedas, saúde, stress) do Meu Mundo.
 * Eventos criados pelo "cadastrar evento" não têm task_id; esta rota cria a tarefa, vincula e dispara o cálculo.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }
    if (event.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!event.folder_id) {
      return NextResponse.json(
        { error: 'Evento precisa estar em uma pasta para conceder recompensas. Edite o evento e escolha uma pasta.' },
        { status: 400 }
      );
    }

    let taskId: string;

    if (event.task_id) {
      const task = await getTaskById(event.task_id);
      if (!task || task.user_id !== userId) {
        return NextResponse.json({ error: 'Tarefa vinculada inválida' }, { status: 400 });
      }
      if (task.completed) {
        return NextResponse.json(
          { ok: true, message: 'Evento já estava concluído.', taskId: task.id },
          { status: 200 }
        );
      }
      await updateTask(event.task_id, { completed: true });
      taskId = event.task_id;
    } else {
      const titleWithoutTime = event.title.replace(/ - \d{2}:\d{2}$/, '').trim() || event.title;
      const newTask = await createTask({
        user_id: userId,
        folder_id: event.folder_id,
        title: titleWithoutTime,
      });
      if (!newTask) {
        return NextResponse.json({ error: 'Não foi possível criar a tarefa' }, { status: 500 });
      }
      await updateTask(newTask.id, { completed: true });
      await updateEvent(eventId, { task_id: newTask.id });
      taskId = newTask.id;
    }

    const folder = await getFolderById(event.folder_id);
    const dateStr = event.date.split('T')[0];
    const timeStr = event.title.match(/ - (\d{2}:\d{2})$/)?.[1] ?? null;

    let gamePayload: { levelUp?: boolean; newLevel?: number; previousLevel?: number; xpEarned?: number; died?: boolean } | undefined;
    try {
      const result = await recordTaskCompletedForGame(userId, taskId, {
        scheduled_date: dateStr,
        scheduled_time: timeStr,
        folder_type: folder?.folder_type ?? undefined,
        event_importance: event.type,
      });
      if (result.ok && (result.levelUp || result.xpEarned != null || result.died)) {
        gamePayload = {
          levelUp: result.levelUp,
          newLevel: result.newLevel,
          previousLevel: result.previousLevel,
          xpEarned: result.xpEarned,
          died: result.died,
        };
      }
    } catch (e) {
      console.error('[events/complete] recordTaskCompletedForGame', e);
      return NextResponse.json(
        { ok: false, error: 'Tarefa concluída, mas falha ao aplicar recompensas do Meu Mundo.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, taskId, game: gamePayload });
  } catch (error) {
    console.error('Error completing event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
