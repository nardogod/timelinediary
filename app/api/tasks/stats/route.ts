import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getCompletedTasksCountByFolder, getTotalCompletedTasksCount, getCompletedTasksCountByMonth } from '@/lib/db/tasks';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Verificar se é o próprio usuário ou se tem permissão
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId || sessionUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [byFolder, total, byMonth] = await Promise.all([
      getCompletedTasksCountByFolder(userId),
      getTotalCompletedTasksCount(userId),
      year && month ? getCompletedTasksCountByMonth(userId, parseInt(year), parseInt(month)) : Promise.resolve(0),
    ]);

    // Converte Map para objeto
    const byFolderObj: Record<string, number> = {};
    byFolder.forEach((count, folderId) => {
      byFolderObj[folderId] = count;
    });

    return NextResponse.json({
      byFolder: byFolderObj,
      total,
      byMonth: byMonth || 0,
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
