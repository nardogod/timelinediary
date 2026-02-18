import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { createEvent, getEventsByUserId } from '@/lib/db/events';

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
    const { title, date, end_date, type, link, folder_id } = body;
    if (!title || !date || !type) {
      return NextResponse.json(
        { error: 'title, date, and type are required' },
        { status: 400 }
      );
    }
    // Apenas a data (YYYY-MM-DD), sem horário
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
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
