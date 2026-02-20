import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { createEvent, getEventsByUserId, createMultipleEvents } from '@/lib/db/events';
import { generateRecurringDates, RecurringEventConfig, DayOfWeek } from '@/lib/recurringEvents';

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
    const { 
      title, 
      date, 
      end_date, 
      type, 
      link, 
      folder_id,
      // Campos para eventos recorrentes
      is_recurring,
      recurring_year,
      recurring_month,
      recurring_days_of_week
    } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: 'title and type are required' },
        { status: 400 }
      );
    }

    // Se é evento recorrente
    if (is_recurring && recurring_year && recurring_month && Array.isArray(recurring_days_of_week) && recurring_days_of_week.length > 0) {
      const dates = generateRecurringDates(
        recurring_year,
        recurring_month,
        recurring_days_of_week as DayOfWeek[]
      );

      if (dates.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma data encontrada para os dias da semana especificados' },
          { status: 400 }
        );
      }

      // Validação básica de URL
      let finalLink = link?.trim() || null;
      if (finalLink && !finalLink.match(/^https?:\/\//i)) {
        finalLink = `https://${finalLink}`;
      }

      const eventsData = dates.map(dateStr => ({
        user_id: userId,
        title: title.trim(),
        date: dateStr,
        end_date: null,
        type,
        link: finalLink,
        folder_id: folder_id ?? null,
        task_id: null,
      }));

      const createdEvents = await createMultipleEvents(eventsData);

      return NextResponse.json({
        events: createdEvents,
        count: createdEvents.length,
        message: `${createdEvents.length} eventos criados com sucesso`
      });
    }

    // Evento único (lógica existente)
    if (!date) {
      return NextResponse.json(
        { error: 'date is required for non-recurring events' },
        { status: 400 }
      );
    }

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
