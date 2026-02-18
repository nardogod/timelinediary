import { NextResponse } from 'next/server';
import { getNeon } from '@/lib/neon';

/**
 * Verifica conectividade com o Neon.
 * Retorna 200 se DATABASE_URL está definida e o banco responde.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        error: 'DATABASE_URL não definida',
        hint: 'Configure .env.local com a connection string do Neon (veja docs/NEON_SETUP.md)',
      },
      { status: 503 }
    );
  }

  try {
    const sql = getNeon();
    await sql`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: 'neon',
      message: 'Conexão OK',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Health DB check failed:', error);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: 'Confira DATABASE_URL e se a migration foi executada no Neon (neon/migrations/001_neon_schema.sql)',
      },
      { status: 503 }
    );
  }
}
