import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getUserByEmail, getUserByUsername, createUser } from '@/lib/db/users';
import { setSessionCookie } from '@/lib/session';

function checkEnv(): { ok: boolean; code?: string } {
  if (!process.env.DATABASE_URL?.trim()) {
    return { ok: false, code: 'DATABASE_URL' };
  }
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    return { ok: false, code: 'AUTH_SECRET' };
  }
  return { ok: true };
}

export async function POST(request: NextRequest) {
  const envCheck = checkEnv();
  if (!envCheck.ok) {
    console.error('[auth/register] Missing or invalid env:', envCheck.code);
    return NextResponse.json(
      {
        error: 'Erro ao registrar',
        code: 'SERVER_CONFIG',
        hint: 'Verifique na Vercel: Settings → Environment Variables. Necessário: DATABASE_URL e AUTH_SECRET (mín. 16 caracteres).',
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email, password, username, name } = body;
    if (!email || !password || !username || !name) {
      return NextResponse.json(
        { error: 'Email, senha, username e nome são obrigatórios' },
        { status: 400 }
      );
    }

    if (await getUserByEmail(email)) {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 400 });
    }
    if (await getUserByUsername(username)) {
      return NextResponse.json({ error: 'Este username já está em uso' }, { status: 400 });
    }

    const password_hash = await hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
    const user = await createUser({
      email,
      username,
      name,
      password_hash,
      avatar,
    });

    if (!user) {
      console.error('[auth/register] createUser returned null');
      return NextResponse.json(
        { error: 'Erro ao criar usuário', code: 'DB', hint: 'Confirme se a migration do Neon foi executada (tabela users).' },
        { status: 500 }
      );
    }

    await setSessionCookie(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar ?? avatar,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[auth/register]', err.message, err.stack);
    const isDb =
      err.message?.includes('DATABASE_URL') ||
      err.message?.includes('relation') ||
      err.message?.includes('does not exist');
    return NextResponse.json(
      {
        error: 'Erro ao registrar',
        code: isDb ? 'DB' : 'SERVER',
        hint: isDb
          ? 'Verifique DATABASE_URL na Vercel e se a migration foi executada no Neon (SQL Editor).'
          : 'Verifique os logs da função na Vercel (Deployments → Logs).',
      },
      { status: 500 }
    );
  }
}
