import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getTasksByFolderId, createTask, updateTask, deleteTask, getTaskById } from '@/lib/db/tasks';
import { createEvent, getEventsByUserId, updateEvent } from '@/lib/db/events';
import { getFolderById } from '@/lib/db/folders';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get('folderId');
    if (!folderId) {
      return NextResponse.json({ error: 'folderId is required' }, { status: 400 });
    }

    // Verificar se a pasta pertence ao usuário
    const folder = await getFolderById(folderId);
    if (!folder || folder.user_id !== userId) {
      return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 403 });
    }

    const tasks = await getTasksByFolderId(folderId, userId);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
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
    const { folder_id, title, details } = body;
    if (!folder_id || !title) {
      return NextResponse.json(
        { error: 'folder_id and title are required' },
        { status: 400 }
      );
    }

    // Verificar se a pasta pertence ao usuário
    const folder = await getFolderById(folder_id);
    if (!folder || folder.user_id !== userId) {
      return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 403 });
    }

    const task = await createTask({
      user_id: userId,
      folder_id,
      title,
      details: details || null,
    });

    if (!task) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, details, completed } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verificar se a tarefa pertence ao usuário
    const task = await getTaskById(id);
    if (!task || task.user_id !== userId) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 403 });
    }

    // Se está marcando como concluída e ainda não estava concluída, criar evento na timeline
    if (completed === true && !task.completed) {
      const folder = await getFolderById(task.folder_id);
      if (folder) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const eventTitle = `${task.title} - ${timeStr}`;

        await createEvent({
          user_id: userId,
          title: eventTitle,
          date: dateStr,
          type: 'simple',
          folder_id: task.folder_id,
          task_id: task.id,
        });
      }
    }

    const updated = await updateTask(id, {
      title: title ?? undefined,
      details: details !== undefined ? details : undefined,
      completed: completed !== undefined ? completed : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 404 });
    }

    // Se a tarefa foi editada e está concluída, sempre atualiza o evento correspondente na timeline
    // Isso garante que mudanças no título apareçam na timeline imediatamente
    if (updated.completed && (title !== undefined || details !== undefined)) {
      const events = await getEventsByUserId(userId);
      const relatedEvent = events.find(e => e.task_id === id);
      
      if (relatedEvent) {
        // Preserva o horário do evento (formato "título - HH:MM")
        const timeMatch = relatedEvent.title.match(/ - (\d{2}:\d{2})$/);
        const timeStr = timeMatch ? timeMatch[1] : '';
        const newEventTitle = timeStr ? `${updated.title} - ${timeStr}` : updated.title;
        
        await updateEvent(relatedEvent.id, {
          title: newEventTitle,
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verificar se a tarefa pertence ao usuário
    const task = await getTaskById(id);
    if (!task || task.user_id !== userId) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 403 });
    }

    const ok = await deleteTask(id);
    if (!ok) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
