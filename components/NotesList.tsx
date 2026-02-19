'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Check, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Task } from '@/lib/db/types';
import { useToast } from './Toast';

interface NotesListProps {
  folderId: string;
  folderName: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskCompleted?: () => void;
}

export default function NotesList({ folderId, folderName, isOpen, onClose, onTaskCompleted }: NotesListProps) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetails, setNewTaskDetails] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDetails, setEditDetails] = useState('');

  const loadTasks = useCallback(async () => {
    if (!folderId || !isOpen) return;
    setIsLoading(true);
    try {
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
      // Filtra apenas tarefas não concluídas (tarefas concluídas aparecem na timeline)
      setTasks(data.filter((task: Task) => !task.completed));
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Evita loop infinito: só mostra toast se não for erro de rede durante carregamento inicial
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - check if server is running');
      } else {
        showToast('Erro ao carregar tarefas', 'error');
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, isOpen]);

  useEffect(() => {
    if (isOpen && folderId) {
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, folderId]);

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
      setIsAddingTask(false);
      showToast('Tarefa adicionada!', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar tarefa';
      showToast(errorMessage, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, newTaskTitle, newTaskDetails]);

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
      showToast('Tarefa atualizada!', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar tarefa';
      showToast(errorMessage, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTitle, editDetails]);

  const handleCancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDetails('');
  }, []);

  if (!isOpen) return null;

  // Tarefas concluídas são automaticamente removidas da lista (aparecem na timeline)
  // Não precisamos mais filtrar aqui, pois já filtramos ao carregar

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-800 rounded-lg shadow-xl flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Notas - {folderName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Botão Adicionar Tarefa */}
          {!isAddingTask && (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full flex items-center gap-2 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
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
                <div className="text-center text-slate-400 py-8">
                  Nenhuma tarefa pendente. Adicione uma tarefa para começar!
                </div>
              )}

              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="mt-0.5 flex-shrink-0 w-5 h-5 border-2 border-slate-400 rounded hover:border-blue-500 transition-colors flex items-center justify-center"
                      aria-label={task.completed ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                    >
                      {task.completed && <Check className="w-4 h-4 text-blue-500" />}
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
                              className={`flex-1 text-sm ${task.completed ? 'line-through text-slate-400' : 'text-white'}`}
                            >
                              {task.title}
                            </span>
                            {task.details && (
                              <button
                                onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
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
                          {expandedTaskId === task.id && task.details && (
                            <div className="mt-2 p-2 bg-slate-800/50 rounded text-sm text-slate-300 whitespace-pre-wrap">
                              {task.details}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleStartEdit(task)}
                              className="text-xs text-slate-400 hover:text-white transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
