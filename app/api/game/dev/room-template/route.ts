import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { RoomTemplate } from '@/lib/game/room-template-types';

const isDev = process.env.NODE_ENV === 'development';

function getTemplatePath(): string {
  return join(process.cwd(), 'public', 'game', 'room-template.json');
}

export async function GET() {
  if (!isDev) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const path = getTemplatePath();
    const data = await readFile(path, 'utf8');
    const template = JSON.parse(data) as RoomTemplate;
    return NextResponse.json(template);
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return NextResponse.json({
        roomWidth: 380,
        roomHeight: 340,
        items: [],
      } satisfies RoomTemplate);
    }
    console.error('[game/dev/room-template GET]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isDev) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  let body: RoomTemplate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body || typeof body.roomWidth !== 'number' || typeof body.roomHeight !== 'number' || !Array.isArray(body.items)) {
    return NextResponse.json({ error: 'Invalid template: roomWidth, roomHeight, items required' }, { status: 400 });
  }
  try {
    const path = getTemplatePath();
    await mkdir(join(process.cwd(), 'public', 'game'), { recursive: true });
    await writeFile(path, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json(body);
  } catch (e) {
    console.error('[game/dev/room-template PATCH]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
