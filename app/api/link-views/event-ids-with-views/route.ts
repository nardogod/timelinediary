import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getEventIdsWithViews } from '@/lib/db/link-views';

/** GET: retorna IDs dos eventos (do dono) que tiveram pelo menos um clique no link. Usado para mostrar "Visualizado" na timeline. */
export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const ownerUserId = searchParams.get('userId') ?? searchParams.get('ownerUserId');
    if (!ownerUserId) {
      return NextResponse.json({ error: 'userId (owner) is required' }, { status: 400 });
    }

    // Qualquer um pode ver quais eventos foram "visualizados" (só os IDs), pois isso é informação do dono da timeline
    const ids = await getEventIdsWithViews(ownerUserId);
    return NextResponse.json({ eventIds: Array.from(ids) });
  } catch (error) {
    console.error('GET /api/link-views/event-ids-with-views:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
