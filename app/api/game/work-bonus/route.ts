import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { useWorkBonus } from '@/lib/db/game';

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Sessão expirada. Faça login novamente.' },
      { status: 401 }
    );
  }

  try {
    const result = await useWorkBonus(userId);
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
      return NextResponse.json(
        { error: result.error ?? 'failed', message: result.error ?? 'Não foi possível ativar. Tente de novo.' },
        { status: 400 }
      );
    }
    const body: { ok: boolean; profile?: typeof result.profile; game?: { levelUp?: boolean; newLevel?: number; previousLevel?: number; xpEarned?: number; died?: boolean } } = { ok: true, profile: result.profile };
    if (result.died) {
      body.game = { died: true };
    } else if (result.levelUp || result.xpEarned != null) {
      body.game = { levelUp: result.levelUp, newLevel: result.newLevel, previousLevel: result.previousLevel, xpEarned: result.xpEarned };
    }
    return NextResponse.json(body);
  } catch (e) {
    console.error('[game/work-bonus POST]', e);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Erro no servidor. Tente de novo.' },
      { status: 500 }
    );
  }
}
