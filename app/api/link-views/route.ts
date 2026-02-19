import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { recordLinkView } from '@/lib/db/link-views';
import { getEventById } from '@/lib/db/events';

/** POST: registra que o usuário logado clicou no link do evento (para selo "visualizado" e ranking de fãs) */
export async function POST(request: NextRequest) {
  try {
    const viewerUserId = await getSessionUserId();
    if (!viewerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const eventId = body.eventId ?? body.event_id;
    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Não registrar auto-visualização (dono do evento clicando no próprio link)
    if (event.user_id === viewerUserId) {
      return NextResponse.json({ ok: true, self: true });
    }

    const ok = await recordLinkView(eventId, viewerUserId);
    return NextResponse.json({ ok });
  } catch (error) {
    console.error('POST /api/link-views:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
