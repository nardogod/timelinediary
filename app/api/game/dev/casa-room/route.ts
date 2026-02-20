import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { CasaRoomConfig } from '@/lib/game/casa-room-types';

const isDev = process.env.NODE_ENV === 'development';

function getConfigPath(): string {
  return join(process.cwd(), 'public', 'game', 'casa-room.json');
}

export async function GET() {
  if (!isDev) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const path = getConfigPath();
    const data = await readFile(path, 'utf8');
    const config = JSON.parse(data) as CasaRoomConfig;
    return NextResponse.json(config);
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return NextResponse.json({
        backgroundImageSrc: null,
        options: {},
        colors: {},
        items: [],
      } satisfies CasaRoomConfig);
    }
    console.error('[game/dev/casa-room GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isDev) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let body: CasaRoomConfig;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  try {
    const path = getConfigPath();
    await mkdir(join(process.cwd(), 'public', 'game'), { recursive: true });
    await writeFile(path, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json(body);
  } catch (e) {
    console.error('[game/dev/casa-room PATCH]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
