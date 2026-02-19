import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getFoldersByUserId, createFolder, updateFolder, deleteFolder } from '@/lib/db/folders';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const folders = await getFoldersByUserId(userId);
    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, is_private } = body;
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const folder = await createFolder({
      user_id: userId,
      name,
      color: color || '#64748b',
      is_private: is_private ?? false,
    });

    if (!folder) {
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }
    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, color, is_private } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updated = await updateFolder(id, {
      name: name ?? undefined,
      color: color ?? undefined,
      is_private: is_private !== undefined ? is_private : undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update folder' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const ok = await deleteFolder(id);
    if (!ok) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
