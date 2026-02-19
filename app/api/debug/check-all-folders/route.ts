import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getNeon } from '@/lib/neon';

/**
 * Endpoint de debug para verificar contagem de eventos em todas as pastas
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getNeon();
    
    // Busca todas as pastas do usuário
    const foldersRows = await sql`
      SELECT id, name FROM folders WHERE user_id = ${userId}
    ` as Array<{ id: string; name: string }>;
    
    const results = [];
    
    for (const folder of foldersRows) {
      // Conta eventos regulares (sem task_id) na pasta
      const regularEventsRows = await sql`
        SELECT COUNT(*) as count
        FROM events
        WHERE user_id = ${userId} AND folder_id = ${folder.id} AND (task_id IS NULL OR task_id = '')
      ` as Array<{ count: number }>;
      const regularEventsCount = regularEventsRows[0]?.count || 0;
      
      // Conta tarefas concluídas que têm eventos na timeline
      const completedTasksRows = await sql`
        SELECT COUNT(DISTINCT t.id) as count
        FROM tasks t
        INNER JOIN events e ON e.task_id = t.id
        WHERE t.user_id = ${userId} AND t.folder_id = ${folder.id} AND t.completed = true
      ` as Array<{ count: number }>;
      const completedTasksCount = completedTasksRows[0]?.count || 0;
      
      // Total esperado no contador
      const expectedCount = Number(regularEventsCount) + Number(completedTasksCount);
      
      results.push({
        folderName: folder.name,
        folderId: folder.id,
        regularEvents: Number(regularEventsCount),
        completedTasks: Number(completedTasksCount),
        expectedCount: expectedCount
      });
    }
    
    return NextResponse.json({
      userId,
      folders: results,
      summary: {
        totalFolders: results.length,
        foldersWithEvents: results.filter(f => f.expectedCount > 0).length,
        foldersWithoutEvents: results.filter(f => f.expectedCount === 0).length
      }
    });
  } catch (error) {
    console.error('Error checking all folders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
