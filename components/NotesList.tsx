'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Check, ChevronDown, ChevronUp, FileText, List, Palette, Trash2, MoreVertical } from 'lucide-react';
import { Task, NoteList } from '@/lib/db/types';
import { useToast } from './Toast';

interface NotesListProps {
  folderId: string;
  folderName: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskCompleted?: () => void;
}

const DEFAULT_COLORS = [
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
  '#64748b', // slate
];

export default function NotesList({ folderId, folderName, isOpen, onClose, onTaskCompleted }: NotesListProps) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [noteLists, setNoteLists] = useState<NoteList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetails, setNewTaskDetails] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskColor, setNewTaskColor] = useState<string>('');
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState<string>('#64748b');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editColor, setEditColor] = useState<string>('');
  const [editNoteListId, setEditNoteListId] = useState<string | null>(null);
  const [showListsMenu, setShowListsMenu] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  const loadNoteLists = useCallback(async () => {
    if (!folderId) return;
    setIsLoadingLists(true);
    try {
      const res = await fetch(`/api/note-lists?folderId=${folderId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        throw new Error(errorData.error || 'Failed to load note lists');
      }
      const data = await res.json();
      setNoteLists(data);
      // Se não há lista selecionada e há listas disponíveis, seleciona a primeira
      if (!selectedListId && data.length > 0) {
        setSelectedListId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading note lists:', error);
      showToast('Erro ao carregar listas', 'error');
    } finally {
      setIsLoadingLists(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, selectedListId]);

  const loadTasks = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      // Se há uma lista selecionada, carrega tarefas da lista, senão carrega da pasta
      if (selectedListId) {
        const res = await fetch(`/api/tasks?noteListId=${selectedListId}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          if (res.status === 401) {
            showToast('Sessão expirada. Faça login novamente.', 'error');
            return;
          }
          throw new Error(errorData.error || 'Failed to load tasks');
        }
        const data = await res.json();
        setTasks(data.filter((task: Task) => !task.completed));
      } else if (folderId) {
        const res = await fetch(`/api/tasks?folderId=${folderId}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          if (res.status === 401) {
            showToast('Sessão expirada. Faça login novamente.', 'error');
            return;
          }
          throw new Error(errorData.error || 'Failed to load tasks');
        }
        const data = await res.json();
        setTasks(data.filter((task: Task) => !task.completed));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - check if server is running');
      } else {
        showToast('Erro ao carregar tarefas', 'error');
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, selectedListId, isOpen]);

  useEffect(() => {
    if (isOpen && folderId) {
      loadNoteLists();
      // Limpa a seleção quando muda de pasta
      setSelectedListId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, folderId]);

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedListId]);

  // Fechar menu de listas ao clicar fora
  useEffect(() => {
    if (!showListsMenu) {
      setMenuPosition(null);
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.lists-menu-container') && !target.closest('[style*="z-[300]"]')) {
        setShowListsMenu(false);
        setMenuPosition(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showListsMenu]);

  const handleCreateList = useCallback(async () => {
    if (!newListName.trim() || !folderId) return;
    try {
      const res = await fetch('/api/note-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName.trim(),
          color: newListColor,
          folder_id: folderId,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        throw new Error(errorData.error || 'Failed to create list');
      }
      const newList = await res.json();
      setNoteLists(prev => [...prev, newList]);
      setSelectedListId(newList.id);
      setNewListName('');
      setNewListColor('#64748b');
      setIsCreatingList(false);
      showToast('Lista criada!', 'success');
    } catch (error) {
      console.error('Error creating list:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar lista';
      showToast(errorMessage, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newListName, newListColor]);

  const handleDeleteList = useCallback(async (listId: string) => {
    const list = noteLists.find(l => l.id === listId);
    const listName = list?.name || 'esta lista';
    
    if (!confirm(`Excluir a lista "${listName}"? As tarefas não serão excluídas, apenas removidas desta lista.`)) return;
    
    try {
      const res = await fetch(`/api/note-lists?id=${listId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        throw new Error(errorData.error || 'Failed to delete list');
      }
      
      // Remove a lista da lista de listas
      setNoteLists(prev => prev.filter(l => l.id !== listId));
      
      // Se a lista excluída estava selecionada, limpa a seleção
      if (selectedListId === listId) {
        setSelectedListId(null);
      }
      
      showToast('Lista excluída!', 'success');
    } catch (error) {
      console.error('Error deleting list:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir lista';
      showToast(errorMessage, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteLists, selectedListId]);

  const handleAddTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_id: folderId,
          title: newTaskTitle.trim(),
          details: newTaskDetails.trim() || null,
          due_date: newTaskDueDate.trim() || null,
          color: newTaskColor.trim() || null,
          note_list_id: selectedListId || null,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        throw new Error(errorData.error || 'Failed to create task');
      }
      const newTask = await res.json();
      // Só adiciona se não estiver concluída
      if (!newTask.completed) {
        setTasks(prev => [...prev, newTask]);
      }
      setNewTaskTitle('');
      setNewTaskDetails('');
      setNewTaskDueDate('');
      setNewTaskColor('');
      setIsAddingTask(false);
      showToast('Tarefa adicionada!', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar tarefa';
      showToast(errorMessage, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, newTaskTitle, newTaskDetails, newTaskDueDate, newTaskColor, selectedListId]);

  const handleToggleComplete = useCallback(async (task: Task) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          completed: !task.completed,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        throw new Error(errorData.error || 'Failed to update task');
      }
      const updatedTask = await res.json();
      // Se a tarefa foi concluída, remove da lista (ela aparece na timeline)
      if (updatedTask.completed) {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        showToast('Tarefa concluída! Adicionada à timeline.', 'success');
        onTaskCompleted?.();
      } else {
        // Se foi desmarcada como concluída, adiciona de volta à lista
        setTasks(prev => {
          const exists = prev.find(t => t.id === task.id);
          if (!exists) {
            return [...prev, updatedTask];
          }
          return prev.map(t => t.id === task.id ? updatedTask : t);
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar tarefa';
      showToast(errorMessage, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTaskCompleted]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!confirm('Excluir esta tarefa?')) return;
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        throw new Error(errorData.error || 'Failed to delete task');
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToast('Tarefa excluída', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir tarefa';
      showToast(errorMessage, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartEdit = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDetails(task.details || '');
    setEditDueDate(task.due_date || '');
    setEditColor(task.color || '');
    setEditNoteListId(task.note_list_id || null);
  }, []);

  const handleSaveEdit = useCallback(async (taskId: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          title: editTitle.trim(),
          details: editDetails.trim() || null,
          due_date: editDueDate.trim() || null,
          color: editColor && editColor.trim() ? editColor.trim() : null,
          note_list_id: editNoteListId && editNoteListId.trim() ? editNoteListId : null,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        throw new Error(errorData.error || 'Failed to update task');
      }
      const updatedTask = await res.json();
      // Se a tarefa foi concluída após edição, remove da lista
      if (updatedTask.completed) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } else {
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      }
      setEditingTaskId(null);
      setEditTitle('');
      setEditDetails('');
      setEditDueDate('');
      setEditColor('');
      setEditNoteListId(null);
      showToast('Tarefa atualizada!', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar tarefa';
      showToast(errorMessage, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTitle, editDetails, editDueDate, editColor, editNoteListId]);

  const handleCancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDetails('');
    setEditDueDate('');
    setEditColor('');
    setEditNoteListId(null);
  }, []);

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return d && m && y ? `${d}/${m}/${y}` : dateStr;
  };

  // Função para determinar se uma cor é clara ou escura
  const isLightColor = (color: string): boolean => {
    if (!color) return false;
    // Remove # se presente
    const hex = color.replace('#', '');
    // Converte para RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Calcula luminosidade (fórmula padrão)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  if (!isOpen) return null;

  // Tarefas concluídas são automaticamente removidas da lista (aparecem na timeline)
  // Não precisamos mais filtrar aqui, pois já filtramos ao carregar

  // Encontra a lista selecionada para aplicar sua cor
  const selectedList = selectedListId ? noteLists.find(l => l.id === selectedListId) : null;
  const listColor = selectedList?.color;
  const hasListColor = listColor && listColor.trim();
  const isListColorLight = hasListColor ? isLightColor(listColor) : false;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-800 rounded-lg shadow-xl flex flex-col m-4">
        {/* Header */}
        <div 
          className={`flex items-center justify-between p-4 border-b transition-colors ${
            hasListColor 
              ? '' 
              : 'border-slate-700'
          }`}
          style={hasListColor ? {
            backgroundColor: listColor,
            opacity: 0.95,
            borderBottomColor: isListColorLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
          } : undefined}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className={`w-5 h-5 flex-shrink-0 ${
              hasListColor 
                ? (isListColorLight ? 'text-slate-900' : 'text-white')
                : 'text-white'
            }`} />
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg font-semibold truncate ${
                hasListColor 
                  ? (isListColorLight ? 'text-slate-900' : 'text-white')
                  : 'text-white'
              }`}>
                Notas - {folderName}
              </h2>
              {noteLists.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={selectedListId || ''}
                    onChange={(e) => setSelectedListId(e.target.value || null)}
                    className={`flex-1 text-xs border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasListColor
                        ? (isListColorLight 
                            ? 'bg-white/30 border-slate-700 text-slate-900' 
                            : 'bg-black/20 border-white/20 text-white')
                        : 'bg-slate-700 border-slate-600 text-white'
                    }`}
                  >
                    <option value="">Todas as tarefas</option>
                    {noteLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCreatingList && noteLists.length > 0 && (
              <div className="relative lists-menu-container">
                <button
                  ref={menuButtonRef}
                  onClick={() => {
                    if (menuButtonRef.current) {
                      const rect = menuButtonRef.current.getBoundingClientRect();
                      setMenuPosition({
                        top: rect.bottom + 8,
                        right: window.innerWidth - rect.right
                      });
                    }
                    setShowListsMenu(!showListsMenu);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    hasListColor
                      ? (isListColorLight 
                          ? 'hover:bg-white/20' 
                          : 'hover:bg-black/20')
                      : 'hover:bg-slate-700'
                  }`}
                  aria-label="Gerenciar listas"
                  title="Gerenciar listas"
                >
                  <MoreVertical className={`w-5 h-5 ${
                    hasListColor 
                      ? (isListColorLight ? 'text-slate-900' : 'text-white')
                      : 'text-white'
                  }`} />
                </button>
                {showListsMenu && menuPosition && (
                  <div 
                    className="fixed bg-slate-700 rounded-lg shadow-xl border border-slate-600 min-w-[200px] z-[300]"
                    style={{
                      top: `${menuPosition.top}px`,
                      right: `${menuPosition.right}px`
                    }}
                  >
                    <div className="p-2 border-b border-slate-600">
                      <span className="text-xs text-slate-400 font-medium">Gerenciar listas</span>
                    </div>
                    {noteLists.map((list) => (
                      <div
                        key={list.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: list.color }}
                          />
                          <span className="text-sm text-white truncate">{list.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            handleDeleteList(list.id);
                            setShowListsMenu(false);
                            setMenuPosition(null);
                          }}
                          className="p-1 hover:bg-red-600/20 rounded transition-colors text-red-400 hover:text-red-300 ml-2"
                          aria-label={`Excluir lista ${list.name}`}
                          title="Excluir lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="p-2 border-t border-slate-600">
                      <button
                        onClick={() => {
                          setIsCreatingList(true);
                          setShowListsMenu(false);
                          setMenuPosition(null);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-slate-600 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Criar nova lista
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!isCreatingList && noteLists.length === 0 && (
              <button
                onClick={() => setIsCreatingList(true)}
                className={`p-2 rounded-lg transition-colors ${
                  hasListColor
                    ? (isListColorLight 
                        ? 'hover:bg-white/20' 
                        : 'hover:bg-black/20')
                    : 'hover:bg-slate-700'
                }`}
                aria-label="Criar lista"
                title="Criar nova lista"
              >
                <List className={`w-5 h-5 ${
                  hasListColor 
                    ? (isListColorLight ? 'text-slate-900' : 'text-white')
                    : 'text-white'
                }`} />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                hasListColor
                  ? (isListColorLight 
                      ? 'hover:bg-white/20' 
                      : 'hover:bg-black/20')
                  : 'hover:bg-slate-700'
              }`}
              aria-label="Fechar"
            >
              <X className={`w-5 h-5 ${
                hasListColor 
                  ? (isListColorLight ? 'text-slate-900' : 'text-white')
                  : 'text-white'
              }`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div 
          className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors ${
            hasListColor ? '' : ''
          }`}
          style={hasListColor ? {
            backgroundColor: listColor,
            opacity: 0.85
          } : undefined}
        >
          {/* Formulário de Nova Lista */}
          {isCreatingList && (
            <div className="p-4 bg-slate-700/30 rounded-lg space-y-3">
              <input
                type="text"
                placeholder="Nome da lista"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateList();
                  }
                  if (e.key === 'Escape') {
                    setIsCreatingList(false);
                    setNewListName('');
                    setNewListColor('#64748b');
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div>
                <label className="text-xs text-slate-400 block mb-1">Cor da lista</label>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewListColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newListColor === color ? 'border-white scale-110' : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Cor ${color}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateList}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Criar
                </button>
                <button
                  onClick={() => {
                    setIsCreatingList(false);
                    setNewListName('');
                    setNewListColor('#64748b');
                  }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Botão Adicionar Tarefa */}
          {!isAddingTask && !isCreatingList && (
            <button
              onClick={() => setIsAddingTask(true)}
              className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
                hasListColor
                  ? (isListColorLight 
                      ? 'bg-white/30 hover:bg-white/40 text-slate-900' 
                      : 'bg-black/20 hover:bg-black/30 text-white')
                  : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar tarefa</span>
            </button>
          )}

          {/* Formulário de Nova Tarefa */}
          {isAddingTask && (
            <div className="p-4 bg-slate-700/30 rounded-lg space-y-3">
              <input
                type="text"
                placeholder="Nome da tarefa"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddTask();
                  }
                  if (e.key === 'Escape') {
                    setIsAddingTask(false);
                    setNewTaskTitle('');
                    setNewTaskDetails('');
                    setNewTaskDueDate('');
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <textarea
                placeholder="Detalhes (opcional)"
                value={newTaskDetails}
                onChange={(e) => setNewTaskDetails(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div>
                <label className="text-xs text-slate-400 block mb-1">Data de vencimento (opcional)</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {noteLists.length > 0 && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Lista (opcional)</label>
                  <select
                    value={selectedListId || ''}
                    onChange={(e) => setSelectedListId(e.target.value || null)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhuma lista</option>
                    {noteLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Cor da tarefa (opcional)
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setNewTaskColor('')}
                    className={`px-3 py-1 text-xs rounded border-2 transition-all ${
                      !newTaskColor ? 'border-white bg-slate-700' : 'border-slate-600 text-slate-400'
                    }`}
                  >
                    Sem cor
                  </button>
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTaskColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newTaskColor === color ? 'border-white scale-110' : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Cor ${color}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle('');
                    setNewTaskDetails('');
                    setNewTaskDueDate('');
                    setNewTaskColor('');
                  }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de Tarefas (apenas não concluídas) */}
          {isLoading ? (
            <div className="text-center text-slate-400 py-8">Carregando...</div>
          ) : (
            <>
              {tasks.length === 0 && (
                <div className={`text-center py-8 ${
                  hasListColor 
                    ? (isListColorLight ? 'text-slate-700' : 'text-white/80')
                    : 'text-slate-400'
                }`}>
                  Nenhuma tarefa pendente. Adicione uma tarefa para começar!
                </div>
              )}

              {tasks.map((task) => {
                const hasColor = task.color && task.color.trim();
                const isLight = hasColor && task.color ? isLightColor(task.color) : false;
                return (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg transition-colors ${
                    hasColor 
                      ? 'hover:opacity-90' 
                      : 'bg-slate-700/30 hover:bg-slate-700/50'
                  }`}
                  style={hasColor && task.color ? {
                    backgroundColor: task.color,
                    opacity: 0.9
                  } : undefined}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 border-2 rounded transition-colors flex items-center justify-center ${
                        hasColor && isLight
                          ? 'border-slate-700 hover:border-slate-900'
                          : 'border-slate-400 hover:border-blue-500'
                      }`}
                      style={hasColor && !isLight ? {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                      } : undefined}
                      aria-label={task.completed ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                    >
                      {task.completed && (
                        <Check className={`w-4 h-4 ${
                          hasColor && isLight ? 'text-slate-900' : 'text-blue-500'
                        }`} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingTaskId === task.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <textarea
                            value={editDetails}
                            onChange={(e) => setEditDetails(e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                          <div>
                            <label className="text-xs text-slate-400 block mb-0.5">Data de vencimento</label>
                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {noteLists.length > 0 && (
                            <div>
                              <label className="text-xs text-slate-400 block mb-0.5">Lista</label>
                              <select
                                value={editNoteListId || ''}
                                onChange={(e) => setEditNoteListId(e.target.value || null)}
                                className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Nenhuma lista</option>
                                {noteLists.map((list) => (
                                  <option key={list.id} value={list.id}>
                                    {list.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="text-xs text-slate-400 block mb-0.5 flex items-center gap-1">
                              <Palette className="w-3 h-3" />
                              Cor da tarefa
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setEditColor('')}
                                className={`px-2 py-1 text-xs rounded border-2 transition-all ${
                                  !editColor ? 'border-white bg-slate-700' : 'border-slate-600 text-slate-400'
                                }`}
                              >
                                Sem cor
                              </button>
                              {DEFAULT_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setEditColor(color)}
                                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                                    editColor === color ? 'border-white scale-110' : 'border-slate-600'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  aria-label={`Cor ${color}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(task.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <span
                              className={`flex-1 text-sm ${
                                task.completed 
                                  ? 'line-through opacity-60' 
                                  : hasColor 
                                    ? (isLight ? 'text-slate-900' : 'text-white')
                                    : 'text-white'
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.details && (
                              <button
                                onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                className={`flex-shrink-0 transition-colors ${
                                  hasColor 
                                    ? (isLight ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white')
                                    : 'text-slate-400 hover:text-white'
                                }`}
                                aria-label="Expandir detalhes"
                              >
                                {expandedTaskId === task.id ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                          {task.due_date && (
                            <div className={`text-xs mt-1 ${
                              hasColor 
                                ? (isLight ? 'text-slate-700 opacity-80' : 'text-white/80')
                                : 'text-slate-400'
                            }`}>
                              Vence: {formatDueDate(task.due_date)}
                            </div>
                          )}
                          {expandedTaskId === task.id && task.details && (
                            <div className={`mt-2 p-2 rounded text-sm whitespace-pre-wrap ${
                              hasColor 
                                ? (isLight ? 'bg-white/20 text-slate-900' : 'bg-black/20 text-white')
                                : 'bg-slate-800/50 text-slate-300'
                            }`}>
                              {task.details}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleStartEdit(task)}
                              className={`text-xs transition-colors ${
                                hasColor 
                                  ? (isLight ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white')
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className={`text-xs transition-colors ${
                                hasColor && isLight
                                  ? 'text-red-600 hover:text-red-800'
                                  : 'text-red-400 hover:text-red-300'
                              }`}
                            >
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
