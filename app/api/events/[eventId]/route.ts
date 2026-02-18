import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getEventById, updateEvent, deleteEvent } from '@/lib/db/events';

export async function PATCH(
  request: NextRequest,
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

    const existing = await getEventById(eventId);
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, date, end_date, type, link, folder_id } = body;

    const dateOnly = date != null && date !== '' ? String(date).trim().split('T')[0] : undefined;
    const endDateOnly = end_date !== undefined
      ? (end_date != null && end_date !== '' ? String(end_date).trim().split('T')[0] : null)
      : undefined;

    const event = await updateEvent(eventId, {
      ...(title !== undefined && { title: String(title).trim() }),
      ...(dateOnly !== undefined && { date: dateOnly }),
      ...(endDateOnly !== undefined && { end_date: endDateOnly }),
      ...(type !== undefined && { type }),
      ...(link !== undefined && { link: link ?? null }),
      ...(folder_id !== undefined && { folder_id: folder_id ?? null }),
    });

    if (!event) {
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const existing = await getEventById(eventId);
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleted = await deleteEvent(eventId);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
