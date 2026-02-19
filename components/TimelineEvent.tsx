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

interface TimelineEventProps {
  event: MockEvent;
  position: number;
  placement: 'top' | 'bottom';
  layer?: number;
  settings?: UserSettings | null;
  canEdit?: boolean;
  username?: string;
  onEventDeleted?: () => void;
}

function TimelineEvent({ event, position, placement, layer = 0, settings, canEdit, username, onEventDeleted }: TimelineEventProps) {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const eventRef = useRef<HTMLDivElement>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.link) {
      // Tracking Mixpanel
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

      // Cancela qualquer timeout pendente
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
        collapseTimeoutRef.current = null;
      }
      // Abre o link
      window.open(event.link, '_blank', 'noopener,noreferrer');
      // Colapsa imediatamente após abrir o link para não atrapalhar visualização
      setIsExpanded(false);
    }
  }, [event.id, event.title, event.date, event.type, event.link, event.folder, user?.id, username]);

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
    if (!confirm('Excluir este evento? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      onEventDeleted?.();
    } catch {
      alert('Não foi possível excluir o evento. Tente novamente.');
    }
  }, [event.id, onEventDeleted]);

  return (
    <>
      <div 
        ref={eventRef}
        className="absolute"
        data-event-id={event.id}
        style={{ 
          left: `${position}%`, 
          top: isTop 
            ? `calc(50% - ${layer * 130}px)` 
            : `calc(50% + ${layer * 130}px)`,
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
            height: '50px',
            backgroundColor: color,
            [isTop ? 'bottom' : 'top']: '0'
          }}
        ></div>

        {/* Card do evento */}
        <Tooltip content={event.title} position={isTop ? 'top' : 'bottom'} disabled={isExpanded}>
          <div 
            className={`absolute left-1/2 -translate-x-1/2 rounded-lg text-white text-xs sm:text-sm font-medium shadow-xl transition-all duration-300 animate-fade-in ${
              isExpanded 
                ? 'px-3 sm:px-4 py-2 sm:py-3 whitespace-normal max-w-[200px] sm:max-w-[280px] z-[100] cursor-default' 
                : 'px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap max-w-[120px] sm:max-w-none hover:scale-110 cursor-pointer hover:shadow-2xl'
            }`}
            style={{ 
              backgroundColor: color,
              [isTop ? 'bottom' : 'top']: '60px'
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
              <button
                onClick={handleLinkClick}
                className="flex items-center justify-center gap-1.5 mt-2 px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded transition-colors w-full text-[10px] sm:text-xs font-medium"
                aria-label={`Abrir link: ${event.link}`}
              >
                <ExternalLink className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{event.link}</span>
              </button>
            )}
            {isExpanded && canEdit && username && (
              <div className="flex gap-2 mt-2">
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
              </div>
            )}
            {!isExpanded && event.link && (
              <div className="text-[8px] sm:text-[10px] opacity-75 text-center mt-0.5">
                🔗 Link
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
