import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { getUserAuthByEmail, getUserById } from '@/lib/db/users';
import { setSessionCookie } from '@/lib/session';

function checkEnv(): { ok: boolean; code?: string } {
  if (!process.env.DATABASE_URL?.trim()) return { ok: false, code: 'DATABASE_URL' };
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return { ok: false, code: 'AUTH_SECRET' };
  return { ok: true };
}

export async function POST(request: NextRequest) {
  if (!checkEnv().ok) {
    console.error('[auth/login] Missing env');
    return NextResponse.json(
      { error: 'Erro ao fazer login', code: 'SERVER_CONFIG', hint: 'Configure DATABASE_URL e AUTH_SECRET na Vercel.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const auth = await getUserAuthByEmail(email);
    if (!auth) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const ok = await compare(password, auth.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const user = await getUserById(auth.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 500 });
    }

    await setSessionCookie(auth.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[auth/login]', err.message);
    const isDb = err.message?.includes('DATABASE_URL') || err.message?.includes('relation') || err.message?.includes('does not exist');
    return NextResponse.json(
      {
        error: 'Erro ao fazer login',
        hint: isDb ? 'Verifique DATABASE_URL e se a migration foi executada no Neon.' : 'Verifique os logs na Vercel.',
      },
      { status: 500 }
    );
  }
}
