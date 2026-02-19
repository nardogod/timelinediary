'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { FOLDER_COLORS } from '@/lib/folders';
import { Plus, Trash2, Edit2, X, Check, Folder } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface FolderManagerProps {
  userId: string;
  onFoldersChange?: () => void;
}

function FolderManager({ userId, onFoldersChange }: FolderManagerProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('');

  // Carrega pastas reais do usuário (Neon via API)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/folders?userId=${userId}`);
        const data = res.ok ? await res.json() : [];
        setFolders(Array.isArray(data) ? data : []);
      } catch {
        setFolders([]);
      }
    };
    load();
  }, [userId]);

  // Memoiza cores disponíveis
  const availableColors = useMemo(() => FOLDER_COLORS.slice(0, 5), []);

  const reloadFolders = useCallback(async () => {
    try {
      const res = await fetch(`/api/folders?userId=${userId}`);
      const data = res.ok ? await res.json() : [];
      setFolders(Array.isArray(data) ? data : []);
      onFoldersChange?.();
    } catch {
      setFolders([]);
    }
  }, [userId, onFoldersChange]);

  const handleCreate = useCallback(async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim(), color: newFolderColor }),
      });
      if (!res.ok) {
        alert('Não foi possível criar a pasta. Tente novamente.');
        return;
      }
      setNewFolderName('');
      setIsCreating(false);
      await reloadFolders();
    } catch {
      alert('Erro de conexão ao criar pasta.');
    }
  }, [newFolderName, newFolderColor, reloadFolders]);

  const handleDelete = useCallback(
    async (folderId: string) => {
      if (!confirm('Tem certeza que deseja deletar esta pasta? Os eventos não serão deletados, apenas perderão a categoria.')) {
        return;
      }
      try {
        const res = await fetch(`/api/folders?id=${encodeURIComponent(folderId)}`, { method: 'DELETE' });
        if (!res.ok) {
          alert('Não foi possível deletar a pasta.');
          return;
        }
        await reloadFolders();
      } catch {
        alert('Erro de conexão ao deletar pasta.');
      }
    },
    [reloadFolders]
  );

  const handleStartEdit = useCallback((folder: Folder) => {
    setEditingId(folder.id);
    setEditFolderName(folder.name);
    setEditFolderColor(folder.color);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editFolderName.trim()) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, name: editFolderName.trim(), color: editFolderColor }),
      });
      if (!res.ok) {
        alert('Não foi possível salvar as alterações da pasta.');
        return;
      }
      setEditingId(null);
      setEditFolderName('');
      setEditFolderColor('');
      await reloadFolders();
    } catch {
      alert('Erro de conexão ao editar pasta.');
    }
  }, [editingId, editFolderName, editFolderColor, reloadFolders]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditFolderName('');
    setEditFolderColor('');
  }, []);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Pastas
        </h3>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            aria-label="Criar nova pasta"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg"
          >
            {editingId === folder.id ? (
              <>
                <input
                  type="text"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                  placeholder="Nome da pasta"
                  autoFocus
                />
                <div className="flex gap-1">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditFolderColor(color)}
                      className={`w-6 h-6 rounded border-2 transition-all ${
                        editFolderColor === color ? 'border-white scale-110' : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleSaveEdit}
                  className="p-1 bg-green-600 hover:bg-green-700 rounded"
                >
                  <Check className="w-3 h-3 text-white" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 bg-slate-600 hover:bg-slate-500 rounded"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </>
            ) : (
              <>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: folder.color }}
                ></div>
                <span className="text-slate-300 text-sm flex-1">{folder.name}</span>
                <button
                  onClick={() => handleStartEdit(folder)}
                  className="p-1 hover:bg-slate-600 rounded transition-colors"
                >
                  <Edit2 className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  onClick={() => handleDelete(folder.id)}
                  className="p-1 hover:bg-red-600/20 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </>
            )}
          </div>
        ))}

        {isCreating && (
          <div className="p-2 bg-slate-700/50 rounded-lg border border-slate-600">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              className="w-full px-2 py-1.5 mb-2 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              placeholder="Nome da pasta"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewFolderColor(color)}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      newFolderColor === color ? 'border-white scale-110' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleCreate}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
                >
                  Criar
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewFolderName('');
                  }}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-white text-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {folders.length === 0 && !isCreating && (
          <p className="text-slate-400 text-xs text-center py-2">
            Nenhuma pasta criada ainda
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(FolderManager);
