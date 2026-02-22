import { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MockEvent } from '@/lib/mockData';
import { UserSettings } from '@/lib/settings';
import { EVENT_COLORS } from '@/lib/utils';
import { formatDateShort } from '@/lib/utils';
import Tooltip from './Tooltip';
import EventPreview from './EventPreview';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './Toast';
import { isTaskEvent } from '@/lib/utils';

interface TimelineEventProps {
  event: MockEvent;
  position: number;
  placement: 'top' | 'bottom';
  layer?: number;
  settings?: UserSettings | null;
  canEdit?: boolean;
  username?: string;
  onEventDeleted?: () => void;
  onTaskEdited?: () => void;
  /** Link deste evento foi clicado por alguém (selo "Visualizado") */
  linkViewed?: boolean;
}

function TimelineEvent({ event, position, placement, layer = 0, settings, canEdit, username, onEventDeleted, onTaskEdited, linkViewed }: TimelineEventProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingTask, setEditingTask] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const eventRef = useRef<HTMLDivElement>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isTask = isTaskEvent(event) && event.taskId;

  const color = useMemo(() => {
    if (settings) {
      if (event.type === 'simple') return settings.eventSimpleColor || EVENT_COLORS.simple;
      if (event.type === 'medium') return settings.eventMediumColor || EVENT_COLORS.medium;
      if (event.type === 'important') return settings.eventImportantColor || EVENT_COLORS.important;
    }
    return EVENT_COLORS[event.type];
  }, [event.type, settings]);
  const isTop = placement === 'top';

  // Colapsa automaticamente após 5 segundos se expandido
  useEffect(() => {
    if (isExpanded) {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
      collapseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);
    }
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, [isExpanded]);

  // Fecha ao clicar fora do card expandido
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (eventRef.current && !eventRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    // Pequeno delay para não fechar imediatamente ao abrir
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Se já estiver expandido, não faz nada (permite clicar no link ou fecha ao clicar fora)
    if (isExpanded) {
      return;
    }
    // Expande o card
    setIsExpanded(true);
    // Cancela o timeout de colapso automático ao interagir
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
  }, [isExpanded]);

  const handleLinkClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event.link) return;

    // Registra visualização do link (selo "visualizado" + ranking de fãs)
    if (user?.id && event.userId && user.id !== event.userId) {
      try {
        await fetch('/api/link-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: event.id }),
        });
      } catch (err) {
        console.warn('Link view record failed:', err);
      }
    }

    trackEvent('event_link_click', {
      eventId: event.id,
      title: event.title,
      date: event.date,
      type: event.type,
      link: event.link,
      folder: event.folder || null,
      viewerUserId: user?.id ?? null,
      profileUsername: username ?? null,
    });

    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    window.open(event.link, '_blank', 'noopener,noreferrer');
    setIsExpanded(false);
  }, [event.id, event.title, event.date, event.type, event.link, event.folder, event.userId, user?.id, username]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (eventRef.current && !isExpanded) {
      const rect = eventRef.current.getBoundingClientRect();
      setPreviewPosition({
        x: rect.left + rect.width / 2,
        y: isTop ? rect.top - 10 : rect.bottom + 10
      });
      setShowPreview(true);
    }
  }, [isTop, isExpanded]);

  const handleMouseLeave = useCallback(() => {
    if (!isExpanded) {
      setShowPreview(false);
    }
  }, [isExpanded]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMessage = isTask 
      ? 'Excluir esta tarefa da timeline? A tarefa será desmarcada como concluída.'
      : 'Excluir este evento? Esta ação não pode ser desfeita.';
    
    if (!confirm(confirmMessage)) return;
    
    try {
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
        if (res.status === 404) {
          showToast('Evento já foi removido.', 'success');
          onEventDeleted?.();
          onTaskEdited?.();
          return;
        }
        
        console.error('Failed to delete event:', res.status, errorMessage);
        throw new Error(errorMessage);
      }

      // Se é uma tarefa, desmarca como concluída
      if (isTask && event.taskId) {
        try {
          await fetch('/api/tasks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: event.taskId,
              completed: false,
            }),
          });
        } catch (err) {
          console.warn('Failed to uncomplete task, but event was deleted');
        }
      }

      showToast(isTask ? 'Tarefa removida da timeline!' : 'Evento excluído!', 'success');
      onEventDeleted?.();
      onTaskEdited?.();
    } catch (error) {
      console.error('Error deleting event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir';
      showToast(errorMessage, 'error');
    }
  }, [event.id, event.taskId, isTask, onEventDeleted, onTaskEdited, showToast]);

  const handleEditTask = useCallback(async () => {
    if (!event.taskId) {
      showToast('Tarefa não encontrada', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${event.taskId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        throw new Error(errorData.error || 'Failed to load task');
      }
      
      const task = await res.json();
      setEditTitle(task.title);
      setEditDetails(task.details || '');
      setEditingTask(true);
    } catch (error) {
      console.error('Error loading task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar tarefa';
      showToast(errorMessage, 'error');
    }
  }, [event.taskId, showToast]);

  const handleSaveTaskEdit = useCallback(async () => {
    if (!editTitle.trim()) {
      showToast('O título da tarefa não pode estar vazio', 'error');
      return;
    }

    if (!event.taskId) {
      showToast('Tarefa não encontrada', 'error');
      return;
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.taskId,
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
      
      showToast('Tarefa atualizada! A timeline será atualizada.', 'success');
      setEditingTask(false);
      setEditTitle('');
      setEditDetails('');
      onTaskEdited?.();
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar tarefa';
      showToast(errorMessage, 'error');
    }
  }, [editTitle, editDetails, event.taskId, showToast, onTaskEdited]);

  const handleCancelTaskEdit = useCallback(() => {
    setEditingTask(false);
    setEditTitle('');
    setEditDetails('');
  }, []);

  return (
    <>
      <div 
        ref={eventRef}
        className="absolute"
        data-event-id={event.id}
        style={{ 
          left: `${position}%`, 
          top: isTop 
            ? `calc(50% - ${layer * 180}px)` 
            : `calc(50% + ${layer * 180}px)`,
          transform: 'translate(-50%, -50%)',
          zIndex: isExpanded ? 100 : 50 + layer
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Ponto na linha - centralizado exatamente na linha */}
        <div 
          className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 sm:border-4 border-slate-900 z-10 transition-all duration-300 hover:scale-125"
          style={{ 
            backgroundColor: color,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        ></div>

        {/* Linha conectora */}
        <div 
          className="absolute left-1/2 w-0.5 -translate-x-1/2 transition-all duration-300"
          style={{
            height: `${72 - 2 + (layer > 0 ? layer * 20 : 0)}px`,
            backgroundColor: color,
            [isTop ? 'bottom' : 'top']: isTop ? '12px' : '2px' // Para linha superior usa bottom, para inferior usa top
          }}
        ></div>

        {/* Card do evento */}
        <Tooltip content={event.title} position={isTop ? 'top' : 'bottom'} disabled={isExpanded}>
          <div 
            className={`absolute left-1/2 -translate-x-1/2 rounded-lg text-white text-xs sm:text-sm font-medium shadow-xl transition-all duration-300 animate-fade-in ${
              isExpanded 
                ? 'px-3 sm:px-4 py-2 sm:py-3 whitespace-normal max-w-[200px] sm:max-w-[280px] z-[100] cursor-default' 
                : 'px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap max-w-[140px] sm:max-w-[200px] hover:scale-110 cursor-pointer hover:shadow-2xl'
            }`}
            style={{ 
              backgroundColor: color,
              [isTop ? 'bottom' : 'top']: `${70 + (layer > 0 ? layer * 10 : 0)}px`
            }}
            onClick={handleCardClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(e as any);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Evento: ${event.title} em ${formatDateShort(event.date)}`}
          >
            <div className={`font-semibold ${isExpanded ? '' : 'truncate'}`}>
              {event.title}
            </div>
            <div className="text-[10px] sm:text-xs opacity-90 text-center mt-0.5 sm:mt-1">
              {formatDateShort(event.date)}
            </div>
            {isExpanded && event.link && (
              <div className="mt-2 flex flex-col gap-1">
                <button
                  onClick={handleLinkClick}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded transition-colors w-full text-[10px] sm:text-xs font-medium"
                  aria-label={`Abrir link: ${event.link}`}
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate max-w-[200px]">{event.link}</span>
                </button>
                {linkViewed && (
                  <span className="text-[10px] opacity-80 text-center" title="Alguém clicou neste link">
                    👁 Visualizado
                  </span>
                )}
              </div>
            )}
            {isExpanded && canEdit && (
              <>
                {isTask && editingTask ? (
                  <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveTaskEdit();
                        }
                        if (e.key === 'Escape') {
                          handleCancelTaskEdit();
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
                        onClick={handleSaveTaskEdit}
                        disabled={!editTitle.trim()}
                        className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] sm:text-xs rounded transition-colors"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={handleCancelTaskEdit}
                        className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-[10px] sm:text-xs rounded transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    {isTask ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask();
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-[10px] sm:text-xs font-medium"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar Tarefa
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-red-600/80 hover:bg-red-600 rounded text-[10px] sm:text-xs font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      </>
                    ) : username ? (
                      <>
                        <Link
                          href={`/u/${username}/events/${event.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-[10px] sm:text-xs font-medium"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-red-600/80 hover:bg-red-600 rounded text-[10px] sm:text-xs font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      </>
                    ) : null}
                  </div>
                )}
              </>
            )}
            {!isExpanded && event.link && (
              <div className="text-[8px] sm:text-[10px] opacity-75 text-center mt-0.5">
                🔗 Link {linkViewed && '• 👁'}
              </div>
            )}
          </div>
        </Tooltip>
      </div>
      {showPreview && (
        <EventPreview
          event={event}
          position={previewPosition}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

export default memo(TimelineEvent);
