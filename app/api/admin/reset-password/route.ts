import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getNeon } from '@/lib/neon';

/**
 * POST /api/admin/reset-password
 *
 * Body JSON:
 * {
 *   "admin_secret": "SUA_CHAVE",
 *   "email": "user@example.com",
 *   "new_password": "novaSenhaAqui"
 * }
 *
 * Obs.: proteja ADMIN_RESET_SECRET na sua .env/.Vercel.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_secret, email, new_password } = body;

    const expected = process.env.ADMIN_RESET_SECRET;
    if (!expected || admin_secret !== expected) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }
    if (!new_password || typeof new_password !== 'string' || new_password.length < 6) {
      return NextResponse.json({ error: 'Nova senha é obrigatória e deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const sql = getNeon();
    const rows = await sql`SELECT id, email FROM users WHERE email = ${email} LIMIT 1`;
    const row = (rows as { id: string; email: string }[])[0];
    if (!row) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const passwordHash = await hash(new_password, 10);
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${row.id}
    `;

    return NextResponse.json({
      ok: true,
      message: 'Senha redefinida com sucesso',
      user: { id: row.id, email: row.email },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[admin/reset-password]', err.message);
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 });
  }
}

