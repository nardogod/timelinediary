import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { useRelax } from '@/lib/db/game';

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await useRelax(userId);
    if (!result.ok) {
      if (result.error === 'already_used') {
        return NextResponse.json(
          {
            error: 'already_used',
            message: 'Aguarde 3 horas entre um uso e outro.',
            next_available_at: result.next_available_at,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: result.error ?? 'Failed' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, profile: result.profile });
  } catch (e) {
    console.error('[game/relax POST]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
