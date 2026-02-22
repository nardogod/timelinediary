'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { FOLDER_COLORS } from '@/lib/folders';
import { Plus, Trash2, Edit2, X, Check, Folder } from 'lucide-react';
import { DEFAULT_FOLDER_NAMES, type FolderType } from '@/lib/game/folder-types';

const FOLDER_TYPE_OPTIONS: { value: FolderType | ''; label: string }[] = [
  { value: '', label: 'Sem tipo' },
  { value: 'trabalho', label: DEFAULT_FOLDER_NAMES.trabalho },
  { value: 'estudos', label: DEFAULT_FOLDER_NAMES.estudos },
  { value: 'lazer', label: DEFAULT_FOLDER_NAMES.lazer },
  { value: 'tarefas_pessoais', label: DEFAULT_FOLDER_NAMES.tarefas_pessoais },
];

interface Folder {
  id: string;
  name: string;
  color: string;
  folder_type?: FolderType | null;
  is_private?: boolean;
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
  const [newFolderType, setNewFolderType] = useState<FolderType | ''>('');
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('');
  const [editFolderType, setEditFolderType] = useState<FolderType | ''>('');
  const [editFolderPublic, setEditFolderPublic] = useState(true);
  const [newFolderPublic, setNewFolderPublic] = useState(true);

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
        body: JSON.stringify({
          name: newFolderName.trim(),
          color: newFolderColor,
          folder_type: newFolderType || undefined,
          is_private: !newFolderPublic,
        }),
      });
      if (!res.ok) {
        alert('Não foi possível criar a pasta. Tente novamente.');
        return;
      }
      setNewFolderName('');
      setNewFolderType('');
      setIsCreating(false);
      await reloadFolders();
    } catch {
      alert('Erro de conexão ao criar pasta.');
    }
  }, [newFolderName, newFolderColor, newFolderType, reloadFolders]);

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
    setEditFolderType((folder.folder_type as FolderType) || '');
    setEditFolderPublic(folder.is_private === false);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editFolderName.trim()) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          name: editFolderName.trim(),
          color: editFolderColor,
          folder_type: editFolderType || null,
          is_private: !editFolderPublic,
        }),
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
  }, [editingId, editFolderName, editFolderColor, editFolderType, editFolderPublic, reloadFolders]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditFolderName('');
    setEditFolderColor('');
    setEditFolderType('');
  }, []);

  const handleTogglePublic = useCallback(
    async (folderId: string, currentIsPrivate: boolean) => {
      try {
        const res = await fetch('/api/folders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: folderId, is_private: !currentIsPrivate }),
        });
        if (res.ok) await reloadFolders();
      } catch {
        // silent
      }
    },
    [reloadFolders]
  );

  const handleFolderTypeChange = useCallback(
    async (folderId: string, folder_type: FolderType | '') => {
      try {
        const res = await fetch('/api/folders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: folderId, folder_type: folder_type || null }),
        });
        if (res.ok) await reloadFolders();
      } catch {
        // silent
      }
    },
    [reloadFolders]
  );

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
                <select
                  value={editFolderType}
                  onChange={(e) => setEditFolderType((e.target.value || '') as FolderType | '')}
                  className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                >
                  {FOLDER_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value || 'none'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-slate-300 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={editFolderPublic}
                    onChange={(e) => setEditFolderPublic(e.target.checked)}
                    className="rounded border-slate-500"
                  />
                  Pública
                </label>
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
                />
                <span className="text-slate-300 text-sm flex-1">{folder.name}</span>
                <button
                  type="button"
                  onClick={() => handleTogglePublic(folder.id, folder.is_private === true)}
                  title={folder.is_private ? 'Clique para tornar pública na timeline' : 'Clique para tornar privada'}
                  className={`text-xs px-1.5 py-0.5 rounded ${folder.is_private ? 'bg-slate-600 text-slate-400 hover:bg-slate-500' : 'bg-emerald-700/50 text-emerald-200 hover:bg-emerald-700/70'}`}
                >
                  {folder.is_private ? 'Privada' : 'Pública'}
                </button>
                <select
                  value={folder.folder_type || ''}
                  onChange={(e) => handleFolderTypeChange(folder.id, (e.target.value || '') as FolderType | '')}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-slate-300 min-w-0 max-w-[100px]"
                >
                  {FOLDER_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value || 'none'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={newFolderPublic}
                  onChange={(e) => setNewFolderPublic(e.target.checked)}
                  className="rounded border-slate-500"
                />
                Pública na timeline
              </label>
              <select
                value={newFolderType}
                onChange={(e) => setNewFolderType((e.target.value || '') as FolderType | '')}
                className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-300"
              >
                {FOLDER_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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
