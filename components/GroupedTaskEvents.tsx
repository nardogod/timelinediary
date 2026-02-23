'use client';

import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { MockEvent } from '@/lib/mockData';
import { UserSettings } from '@/lib/settings';
import { EVENT_COLORS } from '@/lib/utils';
import { formatDateShort } from '@/lib/utils';
import Tooltip from './Tooltip';
import { ChevronDown, ChevronUp, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { useToast } from './Toast';

interface GroupedTaskEventsProps {
  events: MockEvent[];
  position: number;
  placement: 'top' | 'bottom';
  layer: number;
  settings?: UserSettings | null;
  onTaskEdit?: (taskId: string) => void;
  onEventsUpdate?: () => void;
  onEventDeleted?: () => void;
  canEdit?: boolean;
  colorByFolder?: boolean;
  folderColorMap?: Record<string, string>;
}

function GroupedTaskEvents({ events, position, placement, layer, settings, onTaskEdit, onEventsUpdate, onEventDeleted, canEdit, colorByFolder, folderColorMap }: GroupedTaskEventsProps) {
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const isTop = placement === 'top';

  const firstEvent = events[0];
  const color = (colorByFolder && folderColorMap && firstEvent?.folder && folderColorMap[firstEvent.folder])
    ? folderColorMap[firstEvent.folder]
    : (settings?.eventSimpleColor || EVENT_COLORS.simple);

  // Extrai apenas o título da tarefa (remove " - HH:MM")
  const getTaskTitle = useCallback((title: string) => {
    return title.replace(/ - \d{2}:\d{2}$/, '');
  }, []);

  // Ordena eventos por horário (do mais antigo para o mais recente)
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.title.match(/ - (\d{2}:\d{2})$/)?.[1] || '';
    const timeB = b.title.match(/ - (\d{2}:\d{2})$/)?.[1] || '';
    return timeA.localeCompare(timeB);
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleEditTask = useCallback(async (event: MockEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!event.taskId) {
      console.error('Evento sem taskId:', event);
      showToast('Tarefa não encontrada', 'error');
      return;
    }

    console.log('Iniciando edição da tarefa:', event.taskId);
    
    try {
      // Busca a tarefa pelo ID diretamente
      const res = await fetch(`/api/tasks/${event.taskId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erro ao buscar tarefa:', errorData);
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        throw new Error(errorData.error || 'Failed to load task');
      }
      
      const task = await res.json();
      console.log('Tarefa carregada:', task);
      setEditingTaskId(event.taskId);
      setEditTitle(task.title);
      setEditDetails(task.details || '');
    } catch (error) {
      console.error('Error loading task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar tarefa';
      showToast(errorMessage, 'error');
    }
  }, [showToast]);

  const handleSaveEdit = useCallback(async (taskId: string) => {
    if (!editTitle.trim()) {
      showToast('O título da tarefa não pode estar vazio', 'error');
      return;
    }

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
      
      showToast('Tarefa atualizada! A timeline será atualizada.', 'success');
      setEditingTaskId(null);
      setEditTitle('');
      setEditDetails('');
      
      // Chama callbacks para atualizar a timeline (recarrega eventos)
      onTaskEdit?.(taskId);
      onEventsUpdate?.();
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar tarefa';
      showToast(errorMessage, 'error');
    }
  }, [editTitle, editDetails, showToast, onTaskEdit, onEventsUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDetails('');
  }, []);

  const handleDeleteTask = useCallback(async (event: MockEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event.id) {
      showToast('Evento não encontrado', 'error');
      return;
    }

    if (!confirm('Excluir esta tarefa da timeline? A tarefa será desmarcada como concluída.')) {
      return;
    }

    try {
      // Exclui o evento da timeline
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
      if (!res.ok) {
        let errorMessage = 'Falha ao excluir evento';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Se não conseguir parsear JSON, usa mensagem padrão baseada no status
          if (res.status === 401) {
            errorMessage = 'Sessão expirada. Faça login novamente.';
          } else if (res.status === 403) {
            errorMessage = 'Sem permissão para excluir este evento';
          } else if (res.status === 404) {
            errorMessage = 'Evento não encontrado';
          } else if (res.status >= 500) {
            errorMessage = 'Erro no servidor. Tente novamente.';
          }
        }
        
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        
        console.error('Failed to delete event:', res.status, errorMessage);
        throw new Error(errorMessage);
      }

      // Se o evento tem task_id, desmarca a tarefa como concluída
      if (event.taskId) {
        const taskRes = await fetch('/api/tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: event.taskId,
            completed: false,
          }),
        });
        if (!taskRes.ok) {
          console.warn('Failed to uncomplete task, but event was deleted');
        }
      }

      showToast('Tarefa removida da timeline!', 'success');
      onEventDeleted?.();
      onEventsUpdate?.();
    } catch (error) {
      console.error('Error deleting task event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir tarefa';
      showToast(errorMessage, 'error');
    }
  }, [showToast, onEventDeleted, onEventsUpdate]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded]);

  const offsetY = layer * 180; // Espaçamento maior entre camadas para evitar sobreposição

  return (
    <div
      ref={containerRef}
      className="absolute"
      style={{
        left: `${position}%`,
        top: isTop ? `calc(50% - ${offsetY}px)` : `calc(50% + ${offsetY}px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: isExpanded ? 100 : 50 + layer,
      }}
    >
      {/* Ponto na linha - centralizado exatamente na linha */}
      <div
        className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 sm:border-4 border-slate-900 z-10 transition-all duration-300 hover:scale-125 pointer-events-none"
        style={{
          backgroundColor: color,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      ></div>

      {/* Linha conectora */}
      <div
        className="absolute left-1/2 w-0.5 -translate-x-1/2 transition-all duration-300"
        style={{
          // Card está a 70px do centro do container
          // Ponto está no centro (50% do container)
          // Linha precisa ir do ponto até o card, mas não passar além do ponto
          // Quando isTop: linha começa logo após o ponto e vai até o card
          // Quando !isTop: linha começa logo após o ponto e vai até o card
          // Altura: 70px - metade da altura do ponto (para não passar além)
          height: `${70 - 2 + (layer > 0 ? layer * 10 : 0)}px`,
          backgroundColor: color,
          [isTop ? 'bottom' : 'top']: '2px', // Começa 2px após o centro para não passar pelo ponto
        }}
      ></div>

      {/* Card agrupado */}
      <Tooltip content={`${events.length} tarefa${events.length > 1 ? 's' : ''} concluída${events.length > 1 ? 's' : ''}`} position={isTop ? 'top' : 'bottom'} disabled={isExpanded}>
        <div
          onClick={(e) => {
            // Só expande/colapsa se não estiver clicando em um botão de ação
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
              return;
            }
            handleClick(e);
          }}
          className={`
            absolute left-1/2 -translate-x-1/2 min-w-[200px] sm:min-w-[240px] max-w-[280px] sm:max-w-[320px]
            bg-slate-800/95 backdrop-blur-sm border-2 rounded-lg shadow-lg
            transition-all duration-300 cursor-pointer
            ${isExpanded ? 'scale-105 shadow-2xl' : 'hover:scale-105'}
          `}
          style={{ 
            borderColor: color,
            [isTop ? 'bottom' : 'top']: `${70 + (layer > 0 ? layer * 10 : 0)}px`
          }}
        >
          {/* Header do card agrupado */}
          <div className="p-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color }} />
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">
                  {events.length} tarefa{events.length > 1 ? 's' : ''} concluída{events.length > 1 ? 's' : ''}
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  {formatDateShort(events[0].date)}
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
            </div>
            {!isExpanded && canEdit && events.length === 1 && (
              <div className="mt-2 text-xs text-slate-400">
                Clique para ver e editar
              </div>
            )}
          </div>

          {/* Lista de tarefas (quando expandido) */}
          {isExpanded && (
            <div className="max-h-[300px] overflow-y-auto">
              {sortedEvents.map((event, idx) => {
                const taskTitle = getTaskTitle(event.title);
                const timeMatch = event.title.match(/ - (\d{2}:\d{2})$/);
                const time = timeMatch ? timeMatch[1] : '';

                return (
                  <div
                    key={event.id}
                    className={`
                      p-3 border-b border-slate-700/30 last:border-b-0
                      hover:bg-slate-700/30 transition-colors
                    `}
                  >
                    {editingTaskId === event.taskId ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(event.taskId!);
                            }
                            if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          placeholder="Título da tarefa"
                        />
                        <textarea
                          value={editDetails}
                          onChange={(e) => setEditDetails(e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Detalhes (opcional)"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit(event.taskId!);
                            }}
                            disabled={!editTitle.trim()}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm">{taskTitle}</div>
                          {time && (
                            <div className="text-slate-400 text-xs mt-0.5">{time}</div>
                          )}
                        </div>
                        {event.taskId && canEdit && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleEditTask(event, e);
                              }}
                              className="flex-shrink-0 p-1.5 text-slate-400 hover:text-white transition-colors rounded hover:bg-slate-700/50"
                              title="Editar tarefa"
                              aria-label="Editar tarefa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteTask(event, e)}
                              className="flex-shrink-0 p-1.5 text-red-400 hover:text-red-300 transition-colors rounded hover:bg-red-900/30"
                              title="Excluir tarefa"
                              aria-label="Excluir tarefa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Tooltip>
    </div>
  );
}

export default memo(GroupedTaskEvents);
