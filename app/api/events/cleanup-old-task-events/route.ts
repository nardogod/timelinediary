import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getNeon } from '@/lib/neon';

/**
 * Remove eventos de tarefas concluídas antigas que não têm task_id vinculado
 * Esses são eventos criados antes da implementação do sistema de tarefas
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getNeon();
    
    // Busca eventos que:
    // 1. Pertencem ao usuário
    // 2. Têm formato de tarefa (título termina com " - HH:MM")
    // 3. Não têm task_id vinculado
    // PostgreSQL usa regex POSIX: [0-9] em vez de \d
    const eventsToDelete = await sql`
      SELECT id, title 
      FROM events 
      WHERE user_id = ${userId}
        AND title ~ ' - [0-9][0-9]:[0-9][0-9]$'
        AND (task_id IS NULL OR task_id = '')
    ` as Array<{ id: string; title: string }>;

    if (eventsToDelete.length === 0) {
      return NextResponse.json({ 
        message: 'Nenhum evento de tarefa antiga encontrado',
        deleted: 0 
      });
    }

    // Deleta os eventos encontrados um por um (Neon pode ter problemas com arrays)
    const deleteResults: Array<{ id: string }> = [];
    for (const event of eventsToDelete) {
      const result = await sql`
        DELETE FROM events 
        WHERE id = ${event.id}
        RETURNING id
      ` as Array<{ id: string }>;
      if (result.length > 0) {
        deleteResults.push(result[0]);
      }
    }

    return NextResponse.json({ 
      message: `${deleteResults.length} evento(s) de tarefa antiga removido(s)`,
      deleted: deleteResults.length,
      events: deleteResults.map((e: any) => ({ id: e.id }))
    });
  } catch (error) {
    console.error('Error cleaning up old task events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
