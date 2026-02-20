import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getNoteListsByFolderId, createNoteList, updateNoteList, deleteNoteList, getNoteListById } from '@/lib/db/note-lists';
import { getFolderById } from '@/lib/db/folders';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get('folderId');
    
    if (!folderId) {
      return NextResponse.json({ error: 'folderId is required' }, { status: 400 });
    }

    // Verificar se a pasta pertence ao usuário
    const folder = await getFolderById(folderId);
    if (!folder || folder.user_id !== userId) {
      return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 403 });
    }

    const lists = await getNoteListsByFolderId(folderId, userId);
    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching note lists:', error);
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
    const { name, color, folder_id } = body;
    if (!name || !folder_id) {
      return NextResponse.json(
        { error: 'name and folder_id are required' },
        { status: 400 }
      );
    }

    // Verificar se a pasta pertence ao usuário
    const folder = await getFolderById(folder_id);
    if (!folder || folder.user_id !== userId) {
      return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 403 });
    }

    const list = await createNoteList({
      user_id: userId,
      folder_id,
      name,
      color: color || undefined,
    });

    if (!list) {
      return NextResponse.json({ error: 'Failed to create note list' }, { status: 500 });
    }
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error creating note list:', error);
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Uma lista com esse nome já existe' }, { status: 400 });
    }
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
    const { id, name, color } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verificar se a lista pertence ao usuário
    const list = await getNoteListById(id);
    if (!list || list.user_id !== userId) {
      return NextResponse.json({ error: 'Note list not found or access denied' }, { status: 403 });
    }

    // Verificar se a pasta da lista pertence ao usuário
    const folder = await getFolderById(list.folder_id);
    if (!folder || folder.user_id !== userId) {
      return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 403 });
    }

    const updated = await updateNoteList(id, {
      name: name ?? undefined,
      color: color ?? undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update note list' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating note list:', error);
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Uma lista com esse nome já existe' }, { status: 400 });
    }
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

    // Verificar se a lista pertence ao usuário
    const list = await getNoteListById(id);
    if (!list || list.user_id !== userId) {
      return NextResponse.json({ error: 'Note list not found or access denied' }, { status: 403 });
    }

    const ok = await deleteNoteList(id);
    if (!ok) {
      return NextResponse.json({ error: 'Note list not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting note list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
