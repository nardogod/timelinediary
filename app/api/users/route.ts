import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getFeaturedUsers, getUsersByIds, updateUser } from '@/lib/db/users';
import { hash } from 'bcryptjs';

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        error: 'Database not configured',
        hint: 'Set DATABASE_URL in .env.local and run neon/migrations/001_neon_schema.sql in Neon SQL Editor. See docs/NEON_SETUP.md',
      },
      { status: 503 }
    );
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get('featured') === 'true';
    const idsParam = searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',').map((id) => id.trim()).filter(Boolean) : [];

    if (ids.length > 0) {
      const users = await getUsersByIds(ids);
      return NextResponse.json(users);
    }
    // Padrão e featured=true: só usuários em destaque (Leo1, teste@teste)
    const users = await getFeaturedUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    const msg = error instanceof Error ? error.message : '';
    const needsMigration =
      msg.includes('does not exist') ||
      msg.includes('relation') ||
      msg.includes('undefined table');
    return NextResponse.json(
      {
        error: needsMigration ? 'Database schema not found' : 'Internal server error',
        hint:
          needsMigration ?
            'Execute neon/migrations/001_neon_schema.sql in the Neon SQL Editor (docs/NEON_SETUP.md)'
          : 'Check docs/NEON_SETUP.md',
      },
      { status: needsMigration ? 503 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, email, username, name, avatar, password } = body;

    if (id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await updateUser(userId, {
      email: email ?? undefined,
      username: username ?? undefined,
      name: name ?? undefined,
      avatar: avatar !== undefined ? avatar : undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    if (password && String(password).length >= 6) {
      const { getNeon } = await import('@/lib/neon');
      const sql = getNeon();
      const password_hash = await hash(password, 10);
      await sql`UPDATE users SET password_hash = ${password_hash} WHERE id = ${userId}`;
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
