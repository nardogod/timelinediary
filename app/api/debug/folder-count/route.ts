import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getNeon } from '@/lib/neon';

/**
 * Endpoint de debug para verificar contagem de eventos por pasta
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const folderName = searchParams.get('folderName');
    
    if (!folderName) {
      return NextResponse.json({ error: 'folderName is required' }, { status: 400 });
    }

    const sql = getNeon();
    
    // Busca o ID da pasta pelo nome
    const folderRows = await sql`
      SELECT id FROM folders WHERE user_id = ${userId} AND name = ${folderName} LIMIT 1
    ` as Array<{ id: string }>;
    
    if (folderRows.length === 0) {
      return NextResponse.json({ 
        error: 'Folder not found',
        message: `Nenhuma pasta encontrada com o nome "${folderName}"`
      }, { status: 404 });
    }
    
    const folderId = folderRows[0].id;
    
    // Conta eventos regulares (sem task_id) na pasta
    const regularEventsRows = await sql`
      SELECT COUNT(*) as count
      FROM events
      WHERE user_id = ${userId} AND folder_id = ${folderId} AND (task_id IS NULL OR task_id = '')
    ` as Array<{ count: number }>;
    const regularEventsCount = regularEventsRows[0]?.count || 0;
    
    // Conta eventos de tarefas concluídas (com task_id) na pasta
    const taskEventsRows = await sql`
      SELECT COUNT(*) as count
      FROM events
      WHERE user_id = ${userId} AND folder_id = ${folderId} AND task_id IS NOT NULL
    ` as Array<{ count: number }>;
    const taskEventsCount = taskEventsRows[0]?.count || 0;
    
    // Conta tarefas concluídas que têm eventos na timeline (via getCompletedTasksCountByFolder)
    const completedTasksRows = await sql`
      SELECT COUNT(DISTINCT t.id) as count
      FROM tasks t
      INNER JOIN events e ON e.task_id = t.id
      WHERE t.user_id = ${userId} AND t.folder_id = ${folderId} AND t.completed = true
    ` as Array<{ count: number }>;
    const completedTasksCount = completedTasksRows[0]?.count || 0;
    
    // Total de eventos na pasta (todos, incluindo tarefas)
    const totalEventsRows = await sql`
      SELECT COUNT(*) as count
      FROM events
      WHERE user_id = ${userId} AND folder_id = ${folderId}
    ` as Array<{ count: number }>;
    const totalEventsCount = totalEventsRows[0]?.count || 0;
    
    // Verifica se há eventos órfãos (com folder_id que não corresponde a nenhuma pasta)
    const orphanEventsRows = await sql`
      SELECT COUNT(*) as count
      FROM events e
      LEFT JOIN folders f ON e.folder_id = f.id
      WHERE e.user_id = ${userId} AND e.folder_id IS NOT NULL AND f.id IS NULL
    ` as Array<{ count: number }>;
    const orphanEventsCount = orphanEventsRows[0]?.count || 0;
    
    // Lista todas as pastas do usuário para verificação
    const allFoldersRows = await sql`
      SELECT id, name FROM folders WHERE user_id = ${userId}
    ` as Array<{ id: string; name: string }>;
    
    return NextResponse.json({
      folderName,
      folderId,
      counts: {
        regularEvents: Number(regularEventsCount),
        taskEvents: Number(taskEventsCount),
        completedTasks: Number(completedTasksCount),
        totalEvents: Number(totalEventsCount),
        expectedDisplay: Number(regularEventsCount) + Number(completedTasksCount),
        orphanEvents: Number(orphanEventsCount)
      },
      explanation: {
        regularEvents: 'Eventos regulares (sem task_id) na pasta',
        taskEvents: 'Eventos de tarefas concluídas (com task_id) na pasta',
        completedTasks: 'Tarefas concluídas que têm eventos na timeline (usado no contador)',
        totalEvents: 'Total de eventos na pasta (incluindo todos)',
        expectedDisplay: 'Valor esperado no contador: eventos regulares + tarefas concluídas',
        orphanEvents: 'Eventos órfãos (com folder_id que não existe mais)'
      },
      allFolders: allFoldersRows.map(f => ({ id: f.id, name: f.name }))
    });
  } catch (error) {
    console.error('Error in folder count debug:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
