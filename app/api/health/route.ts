import { NextResponse } from 'next/server';

/**
 * Health check: não usa banco.
 * Retorna 200 se o app está no ar.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'timeline-agenda',
    timestamp: new Date().toISOString(),
  });
}
