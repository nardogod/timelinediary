import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getUserByEmail, getUserByUsername, createUser } from '@/lib/db/users';
import { setSessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
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
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    const user = await createUser({
      email,
      username,
      name,
      password_hash,
      avatar,
    });

    if (!user) {
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
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
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erro ao registrar' }, { status: 500 });
  }
}
