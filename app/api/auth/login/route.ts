import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { getUserAuthByEmail, getUserById } from '@/lib/db/users';
import { setSessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
  }
}
